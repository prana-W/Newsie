import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import News from '../models/News.model.js';
import StoryArc from '../models/StoryArc.model.js';
import User from '../models/User.model.js';
import statusCode from '../constants/statusCode.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import {
    getRagRouteForArticle,
    personalizeArticle,
    readUserCache,
    writeUserCache,
    generateVibeVideo,
} from '../services/personalization.service.js';

const FEED_PAGE_SIZE = 7;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseUserFromRequest = async (req) => {
    const cookieToken = req?.cookies?.accessToken;
    const authHeader =
        req?.headers?.authorization || req?.headers?.Authorization;
    const bearerToken =
        typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

    const token =
        cookieToken && cookieToken !== 'null' ? cookieToken : bearerToken;
    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded?.userId) {
            return null;
        }

        return await User.findById(decoded.userId);
    } catch {
        return null;
    }
};

const normalizeArticle = ({article, personalized}) => ({
    id: article._id,
    title: personalized?.title || article.title,
    description: personalized?.description || article.description,
    fullDescription: article.description,
    image: article.image_url,
    image_url: article.image_url,
    body: article.body,
    author: article.author,
    url: article.url,
    category: article.section,
    source: article.source,
    tags: article.tags || [],
    sentiment: article.sentiment,
    sentiment_score: article.sentiment_score || 0,
    fetched_at: article.fetched_at,
    likeCount: article.likeCount || 0,
    dislikeCount: article.dislikeCount || 0,
    commentCount: Array.isArray(article.comments) ? article.comments.length : 0,
    language: personalized?.language || 'English',
    tone: personalized?.tone || 'neutral',
});

const buildBlend = async ({articles, preferences}) => {
    if (!preferences?.preferredCategories?.length) {
        return articles;
    }

    const preferredCategories = preferences.preferredCategories.map(
        (category) =>
            String(category || '')
                .toLowerCase()
                .trim()
    );

    const routes = await Promise.all(
        articles.map((article) =>
            getRagRouteForArticle({
                articleId: article._id,
                title: article.title,
                description: article.description,
            })
        )
    );

    const arcIds = routes.map((route) => route?.arcId).filter(Boolean);

    const relatedArcs = arcIds.length
        ? await StoryArc.find({arc_id: {$in: arcIds}})
              .select('arc_id category')
              .lean()
        : [];
    const arcCategoryMap = new Map(
        relatedArcs.map((arc) => [arc.arc_id, arc.category])
    );

    const scored = articles.map((article, index) => {
        const route = routes[index];
        const articleCategory = String(article.section || '')
            .toLowerCase()
            .trim();
        const matchedArcCategory = String(
            arcCategoryMap.get(route?.arcId) || ''
        )
            .toLowerCase()
            .trim();

        const categoryMatch = preferredCategories.includes(articleCategory);
        const semanticCategoryMatch =
            preferredCategories.includes(matchedArcCategory);
        const isImportant =
            Math.abs(article.sentiment_score || 0) >= 0.2 ||
            ['Markets News', 'Economy', 'Policy'].includes(article.section);

        const similarityScore =
            typeof route?.similarityScore === 'number'
                ? Math.max(0, Math.min(route.similarityScore, 1))
                : 0;

        let score = 0;
        if (categoryMatch) score += 100;
        if (semanticCategoryMatch) score += 45;
        if (isImportant) score += 30;
        score += similarityScore * 25;
        score += Math.min(Math.abs(article.sentiment_score || 0), 1) * 8;

        return {
            article,
            score,
            categoryMatch,
            semanticCategoryMatch,
            isImportant,
        };
    });

    const preferred = scored
        .filter((item) => item.categoryMatch || item.semanticCategoryMatch)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.article);

    const important = scored
        .filter(
            (item) =>
                !item.categoryMatch &&
                !item.semanticCategoryMatch &&
                item.isImportant
        )
        .sort((a, b) => b.score - a.score)
        .map((item) => item.article);

    const other = scored
        .filter(
            (item) =>
                !item.categoryMatch &&
                !item.semanticCategoryMatch &&
                !item.isImportant
        )
        .sort((a, b) => b.score - a.score)
        .map((item) => item.article);

    const merged = [...preferred, ...important, ...other];
    const unique = [];
    const seen = new Set();

    for (const article of merged) {
        const key = String(article._id);
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(article);
        }
    }

    return unique;
};

let isRebuilding = false;
let lastRebuildTime = 0;
const REBUILD_COOLDOWN = 1000 * 60 * 60; // 1 hour

const rebuildArcsIfNeeded = async () => {
    // Avoid concurrent rebuilds
    if (isRebuilding) return;

    const now = Date.now();
    const arcsCount = await StoryArc.countDocuments();

    // If arcs exist and we haven't hit cooldown, skip
    if (arcsCount > 0 && now - lastRebuildTime < REBUILD_COOLDOWN) {
        return;
    }

    const articleCount = await News.countDocuments();

    if (articleCount === 0) {
        if (arcsCount > 0) {
            await StoryArc.deleteMany({});
        }
        return;
    }

    if (arcsCount > 0) {
        lastRebuildTime = now;
        return;
    }

    isRebuilding = true;
    try {
        const sourceArticles = await News.find()
            .sort({fetched_at: -1, _id: -1})
            .limit(250)
            .lean();

        if (sourceArticles.length === 0) {
            return;
        }

        const groups = new Map();

        for (const article of sourceArticles) {
            const section = article.section || 'General';

            if (!groups.has(section)) {
                groups.set(section, []);
            }

            groups.get(section).push(article);
        }

        const arcs = [];
        for (const [section, items] of groups) {
            const sorted = [...items].sort(
                (a, b) =>
                    new Date(a.fetched_at || 0) - new Date(b.fetched_at || 0)
            );

            if (sorted.length === 0) {
                continue;
            }

            const firstId = String(sorted[0]._id).slice(-6);
            const lastId = String(sorted[sorted.length - 1]._id).slice(-6);
            const slug = section.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const arcId = `${slug}-${firstId}-${lastId}`;

            const compiled_timeline = sorted.map((item) => ({
                event_text: item.title,
                event_date: new Date(item.fetched_at || Date.now())
                    .toISOString()
                    .slice(0, 10),
                article_id: item._id,
            }));

            const latestDate = new Date(
                sorted[sorted.length - 1].fetched_at || Date.now()
            );
            const ageDays = Math.max(
                0,
                Math.floor(
                    (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
                )
            );

            arcs.push({
                arc_id: arcId,
                topic_summary: `${section} Watch`,
                category: section,
                associated_articles: sorted.map((item) => item._id),
                compiled_timeline,
                hotScore:
                    compiled_timeline.length * 4 + Math.max(1, 10 - ageDays),
            });
        }

        if (arcs.length > 0) {
            await StoryArc.deleteMany({});
            await StoryArc.insertMany(arcs);
        }
        lastRebuildTime = Date.now();
    } catch (err) {
        console.error('Failed to rebuild arcs:', err);
    } finally {
        isRebuilding = false;
    }
};

export const getNewsFeed = asyncHandler(async (req, res) => {
    const limit = Math.max(
        1,
        Math.min(Number(req.query.limit) || FEED_PAGE_SIZE, 25)
    );
    const cursor = req.query.cursor;
    const query = {};

    if (cursor) {
        query._id = {$lt: cursor};
    }

    const rawArticles = await News.find(query)
        .sort({_id: -1})
        .limit(limit * 2);
    const user = await parseUserFromRequest(req);

    // Run rebuild in background if needed, don't await it
    rebuildArcsIfNeeded().catch(console.error);

    const preferredTone =
        req.query.tone || user?.preferences?.tone || 'neutral';
    const preferredLanguage =
        req.query.language || user?.preferences?.language || 'English';

    const blendedArticles = (
        await buildBlend({
            articles: rawArticles,
            preferences: user?.preferences,
        })
    ).slice(0, limit);

    const articles = await Promise.all(
        blendedArticles.map(async (article) => {
            const personalized = await personalizeArticle({
                userId: user?._id || 'guest',
                articleId: article._id,
                title: article.title,
                description: article.description,
                tone: preferredTone,
                language: preferredLanguage,
            });

            return normalizeArticle({article, personalized});
        })
    );

    const nextCursor =
        blendedArticles.length === limit
            ? String(blendedArticles[blendedArticles.length - 1]._id)
            : null;

    return res.status(statusCode.OK).json(
        new ApiResponse(statusCode.OK, 'News feed fetched successfully', {
            articles,
            nextCursor,
            hasMore: Boolean(nextCursor),
        })
    );
});

export const generateVideo = asyncHandler(async (req, res) => {
    const {newsId} = req.params;
    const isDemo = String(newsId || '').startsWith('demo-');

    if (!isValidObjectId(newsId) && !isDemo) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Invalid article ID');
    }

    const article = isDemo
        ? {
              _id: newsId,
              title: 'Demo headline',
              description:
                  'AI video preview for demo data — replace with live article to get tailored animation.',
              body:
                  'Demo ET summary: Market anchors debate policy shifts, sector rotation, earnings surprises, and investor sentiment with playful newsroom satire.',
          }
        : await News.findById(newsId);

    if (!article) {
        throw new ApiError(statusCode.NOT_FOUND, 'Article not found');
    }

    const {title, description} = article;
    const summary = [article.description, article.body]
        .filter((part) => typeof part === 'string' && part.trim().length > 0)
        .join('\n\n');

    const result = await generateVibeVideo({
        articleId: newsId,
        title,
        description,
        summary,
    });

    return res
        .status(statusCode.CREATED)
        .json(new ApiResponse(statusCode.CREATED, 'Video generated', result));
});

export const likeNews = asyncHandler(async (req, res) => {
    const {newsId} = req.params;
    if (!isValidObjectId(newsId)) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Invalid article ID');
    }

    const article = await News.findByIdAndUpdate(
        newsId,
        {$inc: {likeCount: 1}},
        {new: true}
    );

    if (!article) {
        throw new ApiError(statusCode.NOT_FOUND, 'News article not found');
    }

    return res.status(statusCode.OK).json(
        new ApiResponse(statusCode.OK, 'Like updated', {
            likeCount: article.likeCount,
        })
    );
});

export const dislikeNews = asyncHandler(async (req, res) => {
    const {newsId} = req.params;
    if (!isValidObjectId(newsId)) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Invalid article ID');
    }

    const article = await News.findByIdAndUpdate(
        newsId,
        {$inc: {dislikeCount: 1}},
        {new: true}
    );

    if (!article) {
        throw new ApiError(statusCode.NOT_FOUND, 'News article not found');
    }

    return res.status(statusCode.OK).json(
        new ApiResponse(statusCode.OK, 'Dislike updated', {
            dislikeCount: article.dislikeCount,
        })
    );
});

export const getComments = asyncHandler(async (req, res) => {
    const {newsId} = req.params;
    if (!isValidObjectId(newsId)) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Invalid article ID');
    }

    const article = await News.findById(newsId).select('comments');

    if (!article) {
        throw new ApiError(statusCode.NOT_FOUND, 'News article not found');
    }

    const comments = [...article.comments]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((comment) => ({
            _id: comment._id,
            text: comment.text,
            createdAt: comment.createdAt,
            user: {
                name: comment.userName || 'Anonymous',
            },
        }));

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Comments fetched', {comments}));
});

export const addComment = asyncHandler(async (req, res) => {
    const {newsId} = req.params;
    if (!isValidObjectId(newsId)) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Invalid article ID');
    }

    const {text} = req.body;
    if (!text || String(text).trim().length === 0) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Comment text is required');
    }

    const user = await parseUserFromRequest(req);
    const userName = user?.name || 'You';

    const article = await News.findByIdAndUpdate(
        newsId,
        {
            $push: {
                comments: {
                    userId: user?._id,
                    userName,
                    text: String(text).trim(),
                },
            },
        },
        {new: true}
    );

    if (!article) {
        throw new ApiError(statusCode.NOT_FOUND, 'News article not found');
    }

    const lastComment = article.comments[article.comments.length - 1];

    return res.status(statusCode.CREATED).json(
        new ApiResponse(statusCode.CREATED, 'Comment posted', {
            comment: {
                _id: lastComment._id,
                text: lastComment.text,
                createdAt: lastComment.createdAt,
                user: {name: lastComment.userName},
            },
        })
    );
});

export const getTimelines = asyncHandler(async (req, res) => {
    await rebuildArcsIfNeeded();
    const arcs = await StoryArc.find().sort({updatedAt: -1}).limit(30).lean();

    const timelines = arcs.map((arc) => ({
        id: arc.arc_id,
        title: arc.topic_summary,
        summary: `${arc.compiled_timeline.length} events linked to this story arc`,
        category: arc.category,
        startDate: arc.compiled_timeline[0]?.event_date,
        events: arc.compiled_timeline,
        stats: {
            totalDuration: `${arc.compiled_timeline.length} events`,
            economicDamage:
                arc.compiled_timeline.length > 5
                    ? 'High impact'
                    : 'Moderate impact',
        },
    }));

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Timelines fetched', {timelines}));
});

export const getTimelineById = asyncHandler(async (req, res) => {
    await rebuildArcsIfNeeded();
    const arc = await StoryArc.findOne({arc_id: req.params.id}).lean();

    if (!arc) {
        throw new ApiError(statusCode.NOT_FOUND, 'Timeline not found');
    }

    const articleIds = arc.associated_articles || [];
    const linkedArticles = await News.find({_id: {$in: articleIds}})
        .select('_id title description image_url source section url')
        .lean();

    const timeline = {
        id: arc.arc_id,
        title: arc.topic_summary,
        summary: `${arc.compiled_timeline.length} events linked to this story arc`,
        category: arc.category,
        events: arc.compiled_timeline,
        linkedArticles: linkedArticles.map((article) => ({
            id: article._id,
            title: article.title,
            description: article.description,
            image: article.image_url,
            source: article.source,
            category: article.section,
            url: article.url,
        })),
        stats: {
            totalDuration: `${arc.compiled_timeline.length} events`,
            economicDamage:
                arc.compiled_timeline.length > 5
                    ? 'High impact'
                    : 'Moderate impact',
        },
    };

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Timeline fetched', {timeline}));
});

export const getHotTimelines = asyncHandler(async (req, res) => {
    await rebuildArcsIfNeeded();
    const arcs = await StoryArc.find()
        .sort({hotScore: -1, updatedAt: -1})
        .limit(5)
        .lean();

    const hot = arcs.map((arc) => ({
        id: arc.arc_id,
        title: arc.topic_summary,
        category: arc.category,
        events: arc.compiled_timeline.length,
    }));

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Hot timelines fetched', {hot}));
});

export const getStoryArcsForArticle = asyncHandler(async (req, res) => {
    const {newsId} = req.params;
    if (!isValidObjectId(newsId)) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Invalid article ID');
    }

    await rebuildArcsIfNeeded();

    const arcs = await StoryArc.find({
        associated_articles: newsId,
    })
        .sort({hotScore: -1})
        .limit(5)
        .lean();

    const storyArcs = arcs.map((arc) => ({
        id: arc.arc_id,
        title: arc.topic_summary,
        category: arc.category,
        events: arc.compiled_timeline,
        eventCount: arc.compiled_timeline.length,
    }));

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(statusCode.OK, 'Story arcs fetched', {storyArcs})
        );
});

export const translateArticle = asyncHandler(async (req, res) => {
    const {newsId} = req.params;
    if (!isValidObjectId(newsId)) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Invalid article ID');
    }

    const {language = 'English', tone = 'neutral'} = req.body;

    const article = await News.findById(newsId);
    if (!article) {
        throw new ApiError(statusCode.NOT_FOUND, 'News article not found');
    }

    const user = await parseUserFromRequest(req);
    const personalized = await personalizeArticle({
        userId: user?._id || 'guest',
        articleId: article._id,
        title: article.title,
        description: article.description,
        tone,
        language,
    });

    return res.status(statusCode.OK).json(
        new ApiResponse(statusCode.OK, 'Article translated', {
            id: article._id,
            title: personalized.title,
            description: personalized.description,
            language,
            tone,
        })
    );
});

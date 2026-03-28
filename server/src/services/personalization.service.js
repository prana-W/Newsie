import fs from 'fs/promises';
import path from 'path';
import News from '../models/News.model.js';

const CACHE_DIR = path.resolve(process.cwd(), 'storage', 'personalized');
const RAG_SERVER_URL = process.env.RAG_SERVER_URL || 'http://127.0.0.1:8100';
const RAG_TIMEOUT_MS = Number(process.env.RAG_TIMEOUT_MS || 30000);

const ensureDir = async () => {
    await fs.mkdir(CACHE_DIR, {recursive: true});
};

const sanitize = (value) =>
    String(value || '')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_');

const getCacheFilePath = (userId) =>
    path.join(CACHE_DIR, `${sanitize(userId || 'guest')}.json`);

const readUserCache = async (userId) => {
    await ensureDir();
    const filePath = getCacheFilePath(userId);

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return {};
    }
};

const writeUserCache = async (userId, cacheObject) => {
    await ensureDir();
    const filePath = getCacheFilePath(userId);
    await fs.writeFile(filePath, JSON.stringify(cacheObject, null, 2), 'utf-8');
};

/**
 * Call the RAG server's vibe-translate endpoint (Gemini 2.5 Flash Lite).
 */
const callVibeTranslate = async ({articleId, title, description, tone, language}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RAG_TIMEOUT_MS);

    try {
        const response = await fetch(`${RAG_SERVER_URL}/rag/vibe-translate`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            signal: controller.signal,
            body: JSON.stringify({
                article_id: String(articleId),
                title,
                description,
                tone,
                language,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`RAG vibe-translate failed (${response.status}): ${text}`);
        }

        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
};

export const getRagRouteForArticle = async ({articleId, title, description}) => {
    // 1. Check if we have a valid cache in MongoDB
    if (articleId) {
        try {
            const article = await News.findById(articleId).select('ragRouting');
            if (article?.ragRouting?.arcId && article?.ragRouting?.routedAt) {
                return {
                    action: article.ragRouting.action,
                    arcId: article.ragRouting.arcId,
                    similarityScore: article.ragRouting.similarityScore,
                };
            }
        } catch (err) {
            console.error('Error reading ragRouting cache:', err);
        }
    }

    const text = [title, description].filter(Boolean).join('\n\n').trim();
    if (!text) {
        return null;
    }

    // Use a much tighter timeout for background "routing" to keep the feed snappy
    const ROUTE_TIMEOUT_MS = 5000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);

    try {
        const response = await fetch(`${RAG_SERVER_URL}/rag/route-article`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            signal: controller.signal,
            body: JSON.stringify({
                article_id: String(articleId),
                article_text: text,
            }),
        });

        if (!response.ok) {
            return null;
        }

        const json = await response.json();
        const result = {
            action: json?.action || null,
            arcId: json?.arc_id || null,
            similarityScore:
                typeof json?.similarity_score === 'number'
                    ? json.similarity_score
                    : null,
        };

        // 2. Cache the result back to MongoDB asynchronously
        if (articleId && result.arcId) {
            News.findByIdAndUpdate(articleId, {
                ragRouting: {
                    ...result,
                    routedAt: new Date(),
                },
            }).catch((e) => console.error('Failed to cache ragRouting:', e));
        }

        return result;
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
};

export const personalizeArticle = async ({
    userId,
    articleId,
    title,
    description,
    tone,
    language,
}) => {
    const normalizedTone = tone || 'neutral';
    const normalizedLanguage = language || 'English';
    const cacheKey = `${articleId}::${normalizedTone}::${normalizedLanguage}`;
    const cache = await readUserCache(userId);

    if (cache[cacheKey]) {
        return cache[cacheKey];
    }

    // Skip LLM call when no transformation is needed
    if (normalizedTone === 'neutral' && normalizedLanguage.toLowerCase() === 'english') {
        const fallback = {
            title,
            description,
            tone: normalizedTone,
            language: normalizedLanguage,
        };
        cache[cacheKey] = fallback;
        await writeUserCache(userId, cache);
        return fallback;
    }

    try {
        const result = await callVibeTranslate({
            articleId,
            title,
            description,
            tone: normalizedTone,
            language: normalizedLanguage,
        });

        const personalized = {
            title: result?.title || title,
            description: result?.description || description,
            tone: normalizedTone,
            language: normalizedLanguage,
        };

        cache[cacheKey] = personalized;
        await writeUserCache(userId, cache);
        return personalized;
    } catch {
        const fallback = {
            title,
            description,
            tone: normalizedTone,
            language: normalizedLanguage,
        };
        cache[cacheKey] = fallback;
        await writeUserCache(userId, cache);
        return fallback;
    }
};

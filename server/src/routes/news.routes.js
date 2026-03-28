import {Router} from 'express';

import {
    addComment,
    dislikeNews,
    getComments,
    getHotTimelines,
    getNewsFeed,
    getStoryArcsForArticle,
    getTimelineById,
    getTimelines,
    likeNews,
    translateArticle,
} from '../controllers/news.controller.js';

const router = Router();

router.get('/', getNewsFeed);
router.get('/timelines', getTimelines);
router.get('/timelines/hot', getHotTimelines);
router.get('/timelines/:id', getTimelineById);
router.get('/:newsId/story-arcs', getStoryArcsForArticle);
router.post('/:newsId/like', likeNews);
router.post('/:newsId/dislike', dislikeNews);
router.get('/:newsId/comments', getComments);
router.post('/:newsId/comments', addComment);
router.post('/:newsId/translate', translateArticle);

export default router;

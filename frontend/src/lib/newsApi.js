import {SERVER_URL} from './env';

const parseJsonSafely = async (res) => {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return null;
    }
    return await res.json();
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return {Authorization: `Bearer ${token}`};
    }
    return {};
};

const request = async (path, options = {}) => {
    const response = await fetch(`${SERVER_URL}${path}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...(options.headers || {}),
        },
        ...options,
    });

    const json = await parseJsonSafely(response);

    if (!response.ok) {
        throw new Error(json?.message || `Request failed: ${response.status}`);
    }

    return json?.data ?? {};
};

export const fetchNewsFeed = ({cursor, limit = 7, tone, language} = {}) => {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (cursor) params.set('cursor', cursor);
    if (tone) params.set('tone', tone);
    if (language) params.set('language', language);

    return request(`/api/v1/news?${params.toString()}`);
};

export const likeNews = (newsId) =>
    request(`/api/v1/news/${newsId}/like`, {method: 'POST'});

export const dislikeNews = (newsId) =>
    request(`/api/v1/news/${newsId}/dislike`, {method: 'POST'});

export const fetchComments = (newsId) =>
    request(`/api/v1/news/${newsId}/comments`);

export const postComment = (newsId, text) =>
    request(`/api/v1/news/${newsId}/comments`, {
        method: 'POST',
        body: JSON.stringify({text}),
    });

export const fetchTimelines = () => request('/api/v1/news/timelines');

export const fetchTimelineById = (id) =>
    request(`/api/v1/news/timelines/${id}`);

export const fetchHotTimelines = () => request('/api/v1/news/timelines/hot');

export const fetchStoryArcsForArticle = (newsId) =>
    request(`/api/v1/news/${newsId}/story-arcs`);

export const translateNews = (newsId, language, tone) =>
    request(`/api/v1/news/${newsId}/translate`, {
        method: 'POST',
        body: JSON.stringify({language, tone}),
    });

export const generateNewsVideo = (newsId) =>
    request(`/api/v1/news/${newsId}/video`, {
        method: 'POST',
    });

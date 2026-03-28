const normalizeBaseUrl = (value, fallback) => {
    const raw = typeof value === 'string' ? value.trim() : '';
    const resolved = raw.length > 0 ? raw : fallback;
    return resolved.replace(/\/+$/, '');
};

export const SERVER_URL = normalizeBaseUrl(
    import.meta.env.VITE_SERVER_URL,
    'http://localhost:8000'
);

export const AI_SERVER_URL = normalizeBaseUrl(
    import.meta.env.VITE_AI_SERVER_URL,
    'http://localhost:8100'
);

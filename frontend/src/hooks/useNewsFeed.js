import {useCallback, useEffect, useMemo, useState} from 'react';
import {fetchNewsFeed} from '@/lib/newsApi';
import {newsData} from '@/data/newsData';

const mapDemoArticle = (item, index) => ({
    id: `demo-${item.id || index + 1}`,
    title: item.title,
    description: item.description,
    fullDescription: item.description,
    image: item.image,
    image_url: item.image,
    category: item.category,
    source: item.source,
    url: item.url || '',
    TLDR: item.TLDR,
    financial_facts: item.financial_facts,
    vibe_check: item.vibe_check,
    visual_direction: item.visual_direction,
    isDemoData: true,
});

export default function useNewsFeed() {
    const [articles, setArticles] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const preferences = useMemo(() => {
        try {
            const raw = localStorage.getItem('newsie:preferences');
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }, []);

    const loadNext = useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        setError(null);

        try {
            const data = await fetchNewsFeed({
                cursor,
                limit: 7,
                tone: preferences?.tone,
                language: preferences?.language,
            });

            const nextArticles = data?.articles || [];

            const isInitialEmptyLoad = !cursor && articles.length === 0;

            if (nextArticles.length === 0 && isInitialEmptyLoad) {
                const fallbackArticles = newsData.map(mapDemoArticle);
                setArticles(fallbackArticles);
                setCursor(null);
                setHasMore(false);
                setError(
                    'Live news is currently unavailable. Showing demo feed.'
                );
                return;
            }

            setArticles((prev) => [...prev, ...nextArticles]);
            setCursor(data?.nextCursor || null);
            setHasMore(Boolean(data?.hasMore));
        } catch (err) {
            setError(err.message || 'Failed to fetch news feed');
        } finally {
            setLoading(false);
        }
    }, [articles.length, cursor, hasMore, loading, preferences]);

    useEffect(() => {
        if (articles.length === 0) {
            loadNext();
        }
    }, [articles.length, loadNext]);

    return {
        articles,
        loading,
        error,
        hasMore,
        loadNext,
    };
}

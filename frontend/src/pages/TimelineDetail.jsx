import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchTimelineById } from '@/lib/newsApi';

export default function TimelineDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [timeline, setTimeline] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchTimelineById(id);
                setTimeline(data?.timeline || null);
            } catch (err) {
                setError(err.message || 'Failed to load timeline');
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [id]);

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[#090c12] text-white/70">
                Loading timeline...
            </div>
        );
    }

    if (error || !timeline) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-[#090c12] text-white px-6 text-center">
                <p className="text-base font-semibold mb-2">Timeline unavailable</p>
                <p className="text-sm text-white/60 mb-4">{error || 'This timeline no longer exists.'}</p>
                <button
                    onClick={() => navigate('/timelines')}
                    className="rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-sm"
                >
                    Back to timelines
                </button>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-gradient-to-b from-[#090c12] via-[#0b1018] to-[#090c12] px-4 pt-14 pb-24">
            <button
                onClick={() => navigate('/timelines')}
                className="text-white/70 hover:text-white text-sm mb-4"
            >
                 Back
            </button>

            <span className="inline-flex text-[11px] uppercase tracking-wider font-semibold text-[#a78bfa] bg-[#a78bfa]/10 rounded-md px-2 py-1 mb-3">
                {timeline.category}
            </span>
            <h1 className="text-white text-2xl font-bold leading-tight mb-2">{timeline.title}</h1>
            <p className="text-white/60 text-sm mb-5">{timeline.summary}</p>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6">
                <h2 className="text-white text-sm font-semibold mb-3">Compiled Timeline</h2>
                <div className="space-y-3">
                    {(timeline.events || []).map((event, idx) => (
                        <div key={`${event.article_id}-${idx}`} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#a78bfa] mt-1" />
                                {idx !== timeline.events.length - 1 ? (
                                    <div className="w-px flex-1 bg-white/20 mt-1" />
                                ) : null}
                            </div>
                            <div className="pb-2">
                                <p className="text-[11px] text-white/40 mb-0.5">{event.event_date}</p>
                                <p className="text-sm text-white/80 leading-relaxed">{event.event_text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-white text-sm font-semibold mb-3">Articles In This Arc</h2>
                <div className="space-y-3">
                    {(timeline.linkedArticles || []).map((article) => (
                        <a
                            key={article.id}
                            href={article.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.08] transition-colors"
                        >
                            <p className="text-white text-sm font-semibold leading-snug">{article.title}</p>
                            <p className="text-white/60 text-xs mt-2 line-clamp-3">{article.description}</p>
                            <p className="text-[#a78bfa] text-xs mt-3">Read ET Article </p>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}

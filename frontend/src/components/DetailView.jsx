import {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import CategoryBadge from './CategoryBadge';
import {translateNews, fetchStoryArcsForArticle} from '@/lib/newsApi';

// Map vibe_check strings → Tailwind colour sets
const vibeStyles = {
    stonks: 'bg-green-500/15 text-green-300 border-green-500/30',
    'major vibe': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    'major l': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    cooked: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    'cooked (mixed)': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    'major l (for humans, w for ai)':
        'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
};

function VibeBadge({vibe}) {
    const cls =
        vibeStyles[vibe?.toLowerCase()] ??
        'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    return (
        <span
            className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${cls}`}
        >
            {vibe}
        </span>
    );
}

function StoryArcTimeline({newsId}) {
    const navigate = useNavigate();
    const [arcs, setArcs] = useState([]);
    const [expandedArc, setExpandedArc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!newsId || String(newsId).startsWith('demo-')) {
            setLoading(false);
            return;
        }

        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchStoryArcsForArticle(newsId);
                setArcs(data?.storyArcs || []);
            } catch {
                setArcs([]);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [newsId]);

    if (loading) {
        return (
            <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-white/30 text-xs">Loading timelines...</p>
            </div>
        );
    }

    if (arcs.length === 0) return null;

    return (
        <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
                <span className="font-mono text-[0.6rem] uppercase tracking-widest text-[#a78bfa]/80">
                    Story Timeline
                </span>
            </div>
            <p className="text-white/50 text-xs mb-4">
                This article is part of {arcs.length} story{' '}
                {arcs.length === 1 ? 'arc' : 'arcs'}
            </p>

            <div className="space-y-3">
                {arcs.map((arc) => {
                    const isExpanded = expandedArc === arc.id;
                    return (
                        <div
                            key={arc.id}
                            className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
                        >
                            <button
                                onClick={() =>
                                    setExpandedArc(isExpanded ? null : arc.id)
                                }
                                className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-[#a78bfa] uppercase tracking-wider font-semibold">
                                        {arc.category}
                                    </span>
                                    <span className="text-[10px] text-white/40">
                                        {arc.eventCount} events{' '}
                                        {isExpanded ? '▾' : '▸'}
                                    </span>
                                </div>
                                <p className="text-white/90 text-sm font-medium leading-snug">
                                    {arc.title}
                                </p>
                            </button>

                            {isExpanded && (
                                <motion.div
                                    initial={{height: 0, opacity: 0}}
                                    animate={{height: 'auto', opacity: 1}}
                                    transition={{duration: 0.25}}
                                    className="px-4 pb-4 border-t border-white/5"
                                >
                                    <div className="pt-3 space-y-2.5">
                                        {(arc.events || []).map(
                                            (event, idx) => {
                                                const isCurrentArticle =
                                                    String(
                                                        event.article_id
                                                    ) === String(newsId);
                                                return (
                                                    <div
                                                        key={`${event.article_id}-${idx}`}
                                                        className="flex gap-3"
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <div
                                                                className={`w-2.5 h-2.5 rounded-full mt-1 ${
                                                                    isCurrentArticle
                                                                        ? 'bg-[#a78bfa] ring-2 ring-[#a78bfa]/30'
                                                                        : 'bg-white/30'
                                                                }`}
                                                            />
                                                            {idx !==
                                                            (arc.events || [])
                                                                .length -
                                                                1 ? (
                                                                <div className="w-px flex-1 bg-white/15 mt-1" />
                                                            ) : null}
                                                        </div>
                                                        <div className="pb-1.5 flex-1 min-w-0">
                                                            <p className="text-[10px] text-white/40 mb-0.5">
                                                                {
                                                                    event.event_date
                                                                }
                                                            </p>
                                                            <p
                                                                className={`text-xs leading-relaxed ${
                                                                    isCurrentArticle
                                                                        ? 'text-[#a78bfa] font-medium'
                                                                        : 'text-white/70'
                                                                }`}
                                                            >
                                                                {
                                                                    event.event_text
                                                                }
                                                                {isCurrentArticle && (
                                                                    <span className="ml-1 text-[9px] text-[#a78bfa]/70">
                                                                        ● You
                                                                        are here
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>

                                    <button
                                        onClick={() =>
                                            navigate(`/timelines/${arc.id}`)
                                        }
                                        className="mt-3 w-full text-center text-xs text-[#a78bfa] hover:text-white py-2 rounded-lg bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 transition-colors"
                                    >
                                        View full timeline →
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function DetailView({news, onClose}) {
    if (!news) return null;

    const hasGenZ = Boolean(news.TLDR);
    const articleUrl = news.url;
    const detailDescription = news.fullDescription || news.description;
    const [translatedTitle, setTranslatedTitle] = useState(news.title);
    const [translatedDescription, setTranslatedDescription] =
        useState(detailDescription);
    const [translateLanguage, setTranslateLanguage] = useState(
        news.language || 'English'
    );
    const [translating, setTranslating] = useState(false);

    const handleTranslate = async () => {
        if (!news.id || translating) return;
        setTranslating(true);
        try {
            const data = await translateNews(
                news.id,
                translateLanguage,
                news.tone || 'neutral'
            );
            setTranslatedTitle(data?.title || news.title);
            setTranslatedDescription(data?.description || detailDescription);
        } finally {
            setTranslating(false);
        }
    };

    return (
        <motion.div
            className="absolute inset-0 z-50 bg-[#0a0a0a] overflow-y-auto"
            initial={{x: '100%'}}
            animate={{x: 0}}
            exit={{x: '100%'}}
            transition={{type: 'spring', stiffness: 300, damping: 35}}
        >
            {/* Hero image */}
            <div className="relative h-64 w-full overflow-hidden flex-shrink-0">
                <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/20 to-transparent" />

                {/* Back button */}
                <button
                    onClick={onClose}
                    className="absolute top-12 left-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                >
                    <span className="text-xl">←</span>
                    <span className="text-sm font-medium">Back</span>
                </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-16 pt-4">
                {/* Meta row */}
                <div className="flex items-center gap-3 mb-4">
                    <CategoryBadge category={news.category} />
                    <span className="text-white/30 text-xs uppercase tracking-widest">
                        {news.source}
                    </span>
                </div>

                <div className="mb-4 rounded-xl bg-white/[0.04] border border-white/10 p-3 flex items-center gap-2">
                    <select
                        value={translateLanguage}
                        onChange={(e) => setTranslateLanguage(e.target.value)}
                        className="flex-1 bg-white/10 border border-white/10 text-white text-xs rounded-lg px-2 py-2 outline-none"
                    >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Bengali">Bengali</option>
                        <option value="Marathi">Marathi</option>
                        <option value="Telugu">Telugu</option>
                    </select>
                    <button
                        type="button"
                        onClick={handleTranslate}
                        disabled={translating}
                        className="px-3 py-2 rounded-lg bg-[#a78bfa]/80 hover:bg-[#a78bfa] disabled:opacity-60 text-white text-xs font-semibold"
                    >
                        {translating ? 'Translating...' : 'Translate'}
                    </button>
                </div>

                {/* Title */}
                <h1
                    className="text-white text-2xl font-bold leading-snug mb-4"
                    style={{fontFamily: "'Georgia', serif"}}
                >
                    {translatedTitle}
                </h1>

                {/* Hook / description */}
                <p className="text-white/50 text-sm leading-relaxed mb-6 italic border-l-2 border-white/20 pl-4">
                    {translatedDescription}
                </p>

                {hasGenZ ? (
                    <>
                        {/* ── TLDR ────────────────────────────────────────────── */}
                        <div className="mb-6">
                            <span className="block font-mono text-[0.6rem] uppercase tracking-widest text-violet-400/80 mb-2">
                                TLDR
                            </span>
                            <p
                                className="text-white/80 text-base leading-7"
                                style={{fontFamily: "'Georgia', serif"}}
                            >
                                {news.TLDR}
                            </p>
                        </div>

                        <hr className="border-white/[0.06] my-5" />

                        {/* ── Financial Facts ──────────────────────────────────── */}
                        <div className="mb-6">
                            <span className="block font-mono text-[0.6rem] uppercase tracking-widest text-cyan-400/80 mb-3">
                                The Numbers, No Cap
                            </span>
                            <ul className="space-y-2.5">
                                {news.financial_facts?.map((fact, i) => (
                                    <li
                                        key={i}
                                        className="flex gap-3 text-white/65 text-sm leading-snug"
                                    >
                                        <span className="text-cyan-400/70 font-semibold mt-0.5 shrink-0">
                                            →
                                        </span>
                                        <span>{fact}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <hr className="border-white/[0.06] my-5" />

                        {/* ── Vibe Check ──────────────────────────────────────── */}
                        <div className="mb-6">
                            <span className="block font-mono text-[0.6rem] uppercase tracking-widest text-green-400/80 mb-3">
                                Vibe Check
                            </span>
                            <VibeBadge vibe={news.vibe_check} />
                        </div>

                        <hr className="border-white/[0.06] my-5" />

                        {/* ── Visual Direction ─────────────────────────────────── */}
                        <div className="mb-6">
                            <span className="block font-mono text-[0.6rem] uppercase tracking-widest text-pink-400/80 mb-3">
                                If This Were a Reel...
                            </span>
                            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 text-white/40 text-sm leading-7 italic">
                                {news.visual_direction}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Fallback: plain content if no GenZ fields */
                    <div
                        className="text-white/80 text-base leading-7 space-y-4"
                        style={{fontFamily: "'Georgia', serif"}}
                    >
                        {translatedDescription}
                    </div>
                )}

                {/* Story Arc Timeline */}
                <StoryArcTimeline newsId={news.id} />

                {/* Source footer */}
                <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-white/30 text-xs uppercase tracking-widest mb-1">
                            Source
                        </p>
                        <p className="text-white/70 text-sm font-medium">
                            {news.source}
                        </p>
                    </div>
                    {articleUrl ? (
                        <a
                            href={articleUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors px-3 py-2 text-white/80 text-xs font-semibold"
                        >
                            ET Article
                            <span className="text-white/60">↗</span>
                        </a>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-white/60 text-xs">↗</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

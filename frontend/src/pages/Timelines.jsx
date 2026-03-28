import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchTimelines } from '@/lib/newsApi';

export default function Timelines() {
    const navigate = useNavigate();
    const [timelines, setTimelines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchTimelines();
                setTimelines(data?.timelines || []);
            } catch (err) {
                setError(err.message || 'Failed to load timelines');
            } finally {
                setLoading(false);
            }
        };

        run();
    }, []);

    return (
        <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-[#090c12] via-[#0b1018] to-[#090c12] px-4 pt-14 pb-24">
            <h1 className="text-white text-2xl font-bold tracking-tight mb-2">Story Timelines</h1>
            <p className="text-white/50 text-sm mb-5">Hot, linked sequences of related market stories</p>

            {loading && <p className="text-white/60 text-sm">Loading timelines...</p>}
            {error && <p className="text-red-300 text-sm">{error}</p>}

            <div className="space-y-3">
                {timelines.map((timeline) => (
                    <motion.button
                        key={timeline.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/timelines/${timeline.id}`)}
                        className="w-full text-left rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.08] transition-colors"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[#a78bfa] uppercase tracking-wide font-semibold">{timeline.category}</span>
                            <span className="text-[11px] text-white/40">{timeline.events?.length || 0} events</span>
                        </div>
                        <h2 className="text-white text-base font-semibold leading-snug">{timeline.title}</h2>
                        <p className="text-white/55 text-sm mt-2 line-clamp-2">{timeline.summary}</p>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

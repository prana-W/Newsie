import {useState, useCallback, useEffect} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import NewsCard from '../components/NewsCard';
import DetailView from '../components/DetailView';
import {useSwipe} from '../hooks/useSwipe';
import {useNewsContext} from '../context/NewsContext';
import useNewsFeed from '@/hooks/useNewsFeed';

const slideVariants = {
    enter: (dir) => ({y: dir > 0 ? '100%' : '-100%', opacity: 0}),
    center: {y: 0, opacity: 1},
    exit: (dir) => ({y: dir > 0 ? '-100%' : '100%', opacity: 0}),
};

export default function Home() {
    const navigate = useNavigate();
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [showDetail, setShowDetail] = useState(false);
    const {setCurrentCard} = useNewsContext();
    const {articles, loading, error, hasMore, loadNext} = useNewsFeed();

    // Keep NewsContext in sync with the visible card
    useEffect(() => {
        if (articles[index]) {
            setCurrentCard(articles[index]);
        }
    }, [articles, index, setCurrentCard]);

    useEffect(() => {
        if (articles.length > 0 && index >= articles.length - 2 && hasMore) {
            loadNext();
        }
    }, [articles.length, hasMore, index, loadNext]);

    const goNext = useCallback(() => {
        if (index < articles.length - 1) {
            setDirection(1);
            setIndex((i) => i + 1);
        }
    }, [articles.length, index]);

    const goPrev = useCallback(() => {
        if (index > 0) {
            setDirection(-1);
            setIndex((i) => i - 1);
        }
    }, [index]);

    const swipeHandlers = useSwipe({
        onSwipeUp: goNext,
        onSwipeDown: goPrev,
        onSwipeRight: () => setShowDetail(true),
        onSwipeLeft: () => navigate('/timelines'),
    });

    // Desktop wheel support
    const handleWheel = useCallback(
        (e) => {
            if (showDetail) return;
            if (e.deltaY > 30) goNext();
            else if (e.deltaY < -30) goPrev();
        },
        [showDetail, goNext, goPrev]
    );

    return (
        <div
            className="relative w-full h-full overflow-hidden bg-black"
            {...swipeHandlers}
            onWheel={handleWheel}
        >
            {error && (
                <div className="absolute top-20 left-4 right-4 z-30 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 px-3 py-2 text-sm">
                    {error}
                </div>
            )}

            {articles.length === 0 && loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm tracking-wide">
                    Loading latest news...
                </div>
            ) : null}

            {/* Progress indicator */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
                {articles.map((_, i) => (
                    <motion.div
                        key={i}
                        className="w-0.5 rounded-full bg-white origin-center"
                        animate={{
                            height: i === index ? 24 : 6,
                            opacity: i === index ? 1 : 0.25,
                        }}
                        transition={{duration: 0.25}}
                    />
                ))}
            </div>

            {/* News card with vertical transition */}
            <AnimatePresence custom={direction} mode="wait">
                {articles[index] && (
                    <motion.div
                        key={index}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            type: 'spring',
                            stiffness: 280,
                            damping: 30,
                        }}
                        className="absolute inset-0"
                    >
                        <NewsCard
                            news={articles[index]}
                            onClick={() => setShowDetail(true)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail view */}
            <AnimatePresence>
                {showDetail && (
                    <DetailView
                        news={articles[index]}
                        onClose={() => setShowDetail(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

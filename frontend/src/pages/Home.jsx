import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NewsCard from "../components/NewsCard";
import DetailView from "../components/DetailView";
import { newsData } from "../data/newsData";
import { useSwipe } from "../hooks/useSwipe";

const slideVariants = {
  enter: (dir) => ({ y: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir) => ({ y: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export default function Home() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showDetail, setShowDetail] = useState(false);

  const goNext = useCallback(() => {
    if (index < newsData.length - 1) {
      setDirection(1);
      setIndex((i) => i + 1);
    }
  }, [index]);

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
      {/* Progress indicator */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
        {newsData.map((_, i) => (
          <motion.div
            key={i}
            className="w-0.5 rounded-full bg-white origin-center"
            animate={{ height: i === index ? 24 : 6, opacity: i === index ? 1 : 0.25 }}
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>

      {/* News card with vertical transition */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={index}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="absolute inset-0"
        >
          <NewsCard
            news={newsData[index]}
            onClick={() => setShowDetail(true)}
          />
        </motion.div>
      </AnimatePresence>

      {/* Detail view */}
      <AnimatePresence>
        {showDetail && (
          <DetailView
            news={newsData[index]}
            onClose={() => setShowDetail(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop nav arrows */}
      <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 gap-4 z-20">
        <button
          onClick={goPrev}
          disabled={index === 0}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 border border-white/10 text-white flex items-center justify-center transition-all"
        >
          ↑
        </button>
        <button
          onClick={goNext}
          disabled={index === newsData.length - 1}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 border border-white/10 text-white flex items-center justify-center transition-all"
        >
          ↓
        </button>
      </div>
    </div>
  );
}
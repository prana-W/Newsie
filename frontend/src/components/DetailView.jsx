import { motion } from "framer-motion";
import CategoryBadge from "./CategoryBadge";

export default function DetailView({ news, onClose }) {
  return (
    <motion.div
      className="absolute inset-0 z-50 bg-[#0a0a0a] overflow-y-auto"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 35 }}
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
        <div className="flex items-center gap-3 mb-4">
          <CategoryBadge category={news.category} />
          <span className="text-white/30 text-xs uppercase tracking-widest">
            {news.source}
          </span>
        </div>

        <h1
          className="text-white text-2xl font-bold leading-snug mb-4"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {news.title}
        </h1>

        <p className="text-white/50 text-sm leading-relaxed mb-6 italic border-l-2 border-white/20 pl-4">
          {news.description}
        </p>

        <div
          className="text-white/80 text-base leading-7 space-y-4"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {news.content.split(". ").reduce((acc, sentence, i) => {
            const paraIdx = Math.floor(i / 3);
            if (!acc[paraIdx]) acc[paraIdx] = [];
            acc[paraIdx].push(sentence);
            return acc;
          }, []).map((sentences, i) => (
            <p key={i}>{sentences.join(". ")}.</p>
          ))}
        </div>

        {/* Source footer */}
        <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between">
          <div>
            <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Source</p>
            <p className="text-white/70 text-sm font-medium">{news.source}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white/60 text-xs">↗</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
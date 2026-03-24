import { motion } from "framer-motion";
import CategoryBadge from "./CategoryBadge";
import OverlayComponents from "./OverlayComponents";

export default function NewsCard({ news, onClick }) {
  return (
    <motion.div
      className="relative w-full h-full overflow-hidden cursor-pointer select-none"
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Background image */}
      <img
        src={news.image}
        alt={news.title}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Multi-stop gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 px-5 pt-12 pb-4 flex items-center justify-between">
        <span
          className="text-white font-black text-xl tracking-tight"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          newsie
        </span>
        <CategoryBadge category={news.category} />
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-20 bg-gradient-to-t from-black/90 to-transparent">
        <h2
          className="text-white text-2xl font-bold leading-tight mb-3"
          style={{ fontFamily: "'Georgia', serif", textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}
        >
          {news.title}
        </h2>
        <p className="text-white/70 text-sm leading-relaxed line-clamp-3 mb-4">
          {news.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-white/40 text-xs uppercase tracking-widest">
            {news.source}
          </span>
          <motion.div
            className="flex items-center gap-1.5 text-white/60 text-xs"
            animate={{ x: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <span>swipe right for full story</span>
            <span>→</span>
          </motion.div>
        </div>
      </div>

      {/* Action buttons (Like, Dislike, Comment) */}
      <div
        className="absolute right-3 bottom-44 z-10 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <OverlayComponents newsId={news.id} />
      </div>
    </motion.div>
  );
}
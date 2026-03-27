import { motion } from "framer-motion";
import CategoryBadge from "./CategoryBadge";

// Map vibe_check strings → Tailwind colour sets
const vibeStyles = {
  "stonks":         "bg-green-500/15 text-green-300 border-green-500/30",
  "major vibe":     "bg-violet-500/15 text-violet-300 border-violet-500/30",
  "major l":        "bg-rose-500/15 text-rose-300 border-rose-500/30",
  "cooked":         "bg-rose-500/15 text-rose-300 border-rose-500/30",
  "cooked (mixed)": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "major l (for humans, w for ai)": "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
};

function VibeBadge({ vibe }) {
  const cls = vibeStyles[vibe?.toLowerCase()] ?? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
  return (
    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${cls}`}>
      {vibe}
    </span>
  );
}

export default function DetailView({ news, onClose }) {
  const hasGenZ = Boolean(news.TLDR);

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
        {/* Meta row */}
        <div className="flex items-center gap-3 mb-4">
          <CategoryBadge category={news.category} />
          <span className="text-white/30 text-xs uppercase tracking-widest">
            {news.source}
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-white text-2xl font-bold leading-snug mb-4"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {news.title}
        </h1>

        {/* Hook / description */}
        <p className="text-white/50 text-sm leading-relaxed mb-6 italic border-l-2 border-white/20 pl-4">
          {news.hook || news.description}
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
                style={{ fontFamily: "'Georgia', serif" }}
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
                  <li key={i} className="flex gap-3 text-white/65 text-sm leading-snug">
                    <span className="text-cyan-400/70 font-semibold mt-0.5 shrink-0">→</span>
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
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {news.description}
          </div>
        )}

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
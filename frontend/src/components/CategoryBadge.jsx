const categoryColors = {
  Tech:    { bg: "bg-blue-500/20",   text: "text-blue-300",   border: "border-blue-500/40"   },
  Science: { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/40" },
  Markets: { bg: "bg-green-500/20",  text: "text-green-300",  border: "border-green-500/40"  },
  AI:      { bg: "bg-cyan-500/20",   text: "text-cyan-300",   border: "border-cyan-500/40"   },
  Sports:  { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/40" },
  World:   { bg: "bg-rose-500/20",   text: "text-rose-300",   border: "border-rose-500/40"   },
};

export default function CategoryBadge({ category }) {
  const colors = categoryColors[category] || {
    bg: "bg-white/10", text: "text-white/80", border: "border-white/20",
  };
  return (
    <span
      className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold tracking-widest uppercase border backdrop-blur-sm
        ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {category}
    </span>
  );
}
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { timelineData } from "../data/timelineData";

// Category color mapping
const categoryColors = {
  "Banking Crisis": { bg: "#ff4d6d", light: "rgba(255,77,109,0.15)" },
  Cryptocurrency: { bg: "#f9c74f", light: "rgba(249,199,79,0.15)" },
  "Corporate / India Markets": { bg: "#4cc9f0", light: "rgba(76,201,240,0.15)" },
  "India Markets": { bg: "#06d6a0", light: "rgba(6,214,160,0.15)" },
  "AI / Tech Finance": { bg: "#a78bfa", light: "rgba(167,139,250,0.15)" },
  "Monetary Policy": { bg: "#f4845f", light: "rgba(244,132,95,0.15)" },
  "India / Startup": { bg: "#fb5607", light: "rgba(251,86,7,0.15)" },
  "Macro / UK Economy": { bg: "#3a86ff", light: "rgba(58,134,255,0.15)" },
  "Regulation / India": { bg: "#8338ec", light: "rgba(131,56,236,0.15)" },
  "Fintech / Payments": { bg: "#2ec4b6", light: "rgba(46,196,182,0.15)" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

export default function Timelines() {
  const navigate = useNavigate();

  // Sort by most recent start date
  const sorted = [...timelineData].sort(
    (a, b) => new Date(b.startDate) - new Date(a.startDate)
  );

  return (
    <div
      className="scrollbar-hide"
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
        background: "linear-gradient(160deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%)",
        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          zIndex: 30,
          padding: "48px 20px 16px",
          background: "linear-gradient(to bottom, #0a0a0f 80%, transparent)",
        }}
      >

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Newsie Timelines
          </div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#fff",
              margin: 0,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Finance Stories,{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Unfolding Over Time
            </span>
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.45)",
              margin: "8px 0 0",
              lineHeight: 1.5,
            }}
          >
            {timelineData.length} curated event chains from real market history
          </p>
        </motion.div>
      </div>

      {/* Timeline cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ padding: "4px 16px 80px" }}
      >
        {sorted.map((tl, i) => {
          const colors = categoryColors[tl.category] || {
            bg: "#a78bfa",
            light: "rgba(167,139,250,0.15)",
          };
          return (
            <motion.div
              key={tl.id}
              variants={cardVariants}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/timelines/${tl.id}`)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "20px",
                marginBottom: "12px",
                overflow: "hidden",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {/* Top gradient bar */}
              <div
                style={{
                  height: "3px",
                  background: `linear-gradient(90deg, ${colors.bg}, transparent)`,
                }}
              />

              <div style={{ padding: "16px" }}>
                {/* Category + event count */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: colors.bg,
                      background: colors.light,
                      borderRadius: "6px",
                      padding: "3px 8px",
                    }}
                  >
                    {tl.category}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    {tl.events.length} events
                  </span>
                </div>

                {/* Title */}
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#fff",
                    margin: "0 0 6px",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                  }}
                >
                  {tl.title}
                </h2>

                {/* Summary */}
                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.45)",
                    margin: "0 0 14px",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {tl.summary}
                </p>

                {/* Stats strip */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    paddingTop: "12px",
                  }}
                >
                  <StatPill label="Duration" value={tl.stats.totalDuration} />
                  <StatPill label="Impact" value={tl.stats.economicDamage.split(" ").slice(0, 3).join(" ")} />
                </div>

                {/* Arrow */}
                <motion.div
                  style={{
                    position: "absolute",
                    right: "16px",
                    bottom: "20px",
                    color: "rgba(255,255,255,0.2)",
                    fontSize: "18px",
                  }}
                  animate={{ x: [0, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  →
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.04)",
        borderRadius: "10px",
        padding: "6px 8px",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "rgba(255,255,255,0.75)",
          fontWeight: 600,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

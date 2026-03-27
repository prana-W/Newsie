import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { timelineData } from "../data/timelineData";
import { newsData } from "../data/newsData";

// ── Category accent colour map ────────────────────────────────────────────
const categoryColors = {
  "Banking Crisis":           { bg: "#ff4d6d", glow: "rgba(255,77,109,0.35)" },
  Cryptocurrency:             { bg: "#f9c74f", glow: "rgba(249,199,79,0.35)" },
  "Corporate / India Markets":{ bg: "#4cc9f0", glow: "rgba(76,201,240,0.35)" },
  "India Markets":            { bg: "#06d6a0", glow: "rgba(6,214,160,0.35)" },
  "AI / Tech Finance":        { bg: "#a78bfa", glow: "rgba(167,139,250,0.35)" },
  "Monetary Policy":          { bg: "#f4845f", glow: "rgba(244,132,95,0.35)" },
  "India / Startup":          { bg: "#fb5607", glow: "rgba(251,86,7,0.35)" },
  "Macro / UK Economy":       { bg: "#3a86ff", glow: "rgba(58,134,255,0.35)" },
  "Regulation / India":       { bg: "#8338ec", glow: "rgba(131,56,236,0.35)" },
  "Fintech / Payments":       { bg: "#2ec4b6", glow: "rgba(46,196,182,0.35)" },
};

// ── Event category → dot colour ───────────────────────────────────────────
const eventDotColor = {
  warning:    "#f9c74f",
  escalation: "#ff4d6d",
  milestone:  "#a78bfa",
  resolution: "#06d6a0",
};

const eventDotLabel = {
  warning:    "⚠ Warning",
  escalation: "🔺 Escalation",
  milestone:  "⭐ Milestone",
  resolution: "✅ Resolution",
};

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "14px",
        padding: "12px 14px",
        minWidth: 0,
        flex: "1 1 140px",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: accent || "rgba(255,255,255,0.35)",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "#fff",
          lineHeight: 1.35,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Modal: previews a news card from newsData ─────────────────────────────
function NewsCardModal({ news, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 35 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          borderRadius: "24px 24px 0 0",
          overflow: "hidden",
          background: "#0d1117",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        className="scrollbar-hide"
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Image */}
        <div style={{ position: "relative", width: "100%", paddingBottom: "52%" }}>
          <img
            src={news.image}
            alt={news.title}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, #0d1117 0%, transparent 60%)",
          }} />
        </div>

        {/* Content */}
        <div style={{ padding: "0 20px 32px" }}>
          {/* Category badge */}
          <span
            style={{
              display: "inline-block",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#a78bfa",
              background: "rgba(167,139,250,0.15)",
              borderRadius: "6px",
              padding: "3px 8px",
              marginBottom: "10px",
            }}
          >
            {news.category}
          </span>

          <h3
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#fff",
              margin: "0 0 8px",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
            }}
          >
            {news.title}
          </h3>

          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 16px" }}>
            {news.description}
          </p>

          {/* Financial facts */}
          {news.financial_facts && (
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Key Facts
              </div>
              {news.financial_facts.map((fact, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.65)",
                    padding: "6px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "#a78bfa", flexShrink: 0 }}>▸</span>
                  {fact}
                </div>
              ))}
            </div>
          )}

          {/* Source + close */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {news.source}
            </span>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50px",
                padding: "8px 18px",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function TimelineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [modalNews, setModalNews] = useState(null);

  const tl = timelineData.find((t) => t.id === id);

  if (!tl) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0f",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔍</div>
        <div style={{ fontSize: "16px", fontWeight: 600 }}>Timeline not found</div>
        <button
          onClick={() => navigate("/timelines")}
          style={{
            marginTop: "16px",
            padding: "10px 20px",
            background: "#a78bfa",
            border: "none",
            borderRadius: "50px",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Back to Timelines
        </button>
      </div>
    );
  }

  const colors = categoryColors[tl.category] || {
    bg: "#a78bfa",
    glow: "rgba(167,139,250,0.35)",
  };

  const handleEventTap = (evt) => {
    if (expandedEvent === evt.id) {
      setExpandedEvent(null);
    } else {
      setExpandedEvent(evt.id);
    }
  };

  const handleReadInNewsie = (newsCardId) => {
    const card = newsData.find((n) => n.id === newsCardId);
    if (card) setModalNews(card);
  };

  return (
    <div
      className="scrollbar-hide"
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
        background: "linear-gradient(160deg, #0a0a0f 0%, #0d1117 60%, #0a0a0f 100%)",
        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
        position: "relative",
      }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            width: "100%",
            paddingBottom: "56%",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <img
            src={tl.coverImage}
            alt={tl.title}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.45) saturate(1.2)",
            }}
          />
          {/* Gradient overlays */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to bottom, rgba(10,10,15,0.5) 0%, rgba(10,10,15,0.3) 40%, rgba(10,10,15,0.9) 80%, #0a0a0f 100%)`,
            }}
          />
          {/* Glow from category color */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60%",
              background: `linear-gradient(to top, ${colors.glow}, transparent)`,
            }}
          />
        </div>

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate("/timelines")}
          style={{
            position: "absolute",
            top: "44px",
            left: "16px",
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "50px",
            padding: "6px 14px",
            color: "rgba(255,255,255,0.8)",
            fontSize: "13px",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← 
        </motion.button>

        {/* Hero content */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 20px 20px" }}>
          {/* Category pill */}
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: "inline-block",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: colors.bg,
              background: "rgba(0,0,0,0.5)",
              border: `1px solid ${colors.bg}40`,
              borderRadius: "6px",
              padding: "4px 10px",
              marginBottom: "10px",
            }}
          >
            {tl.category}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#fff",
              margin: "0 0 8px",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              textShadow: "0 2px 20px rgba(0,0,0,0.8)",
            }}
          >
            {tl.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {tl.summary}
          </motion.p>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}
          >
            {tl.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.45)",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "50px",
                  padding: "3px 10px",
                }}
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Stats Dashboard ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ padding: "20px 16px 0" }}
      >
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            marginBottom: "10px",
          }}
        >
          Timeline Stats
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <StatCard label="Duration" value={tl.stats.totalDuration} accent={colors.bg} />
          <StatCard label="Economic Impact" value={tl.stats.economicDamage} accent={colors.bg} />
          <StatCard label="Affected" value={tl.stats.affectedEntities} accent={colors.bg} />
          <StatCard label="Resolution" value={tl.stats.resolution} accent={colors.bg} />
          {tl.stats.estimatedRecoveryTime && tl.stats.estimatedRecoveryTime !== "N/A" && (
            <StatCard
              label="Est. Recovery"
              value={tl.stats.estimatedRecoveryTime}
              accent="rgba(255,255,255,0.35)"
            />
          )}
        </div>
      </motion.div>

      {/* ── Timeline Events ──────────────────────────────────────────────── */}
      <div style={{ padding: "28px 16px 80px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            marginBottom: "20px",
          }}
        >
          {tl.events.length} Key Events
        </div>

        {/* Spine container */}
        <div style={{ position: "relative", paddingLeft: "32px" }}>
          {/* Vertical spine line */}
          <div
            style={{
              position: "absolute",
              left: "10px",
              top: "8px",
              bottom: "8px",
              width: "2px",
              background: `linear-gradient(to bottom, ${colors.bg}80, ${colors.bg}10)`,
              borderRadius: "2px",
            }}
          />

          {tl.events.map((evt, i) => {
            const isExpanded = expandedEvent === evt.id;
            const dotColor = eventDotColor[evt.category] || "#fff";
            const linkedCard = evt.newsCardId ? newsData.find((n) => n.id === evt.newsCardId) : null;

            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 220, damping: 24 }}
                style={{ position: "relative", marginBottom: "16px" }}
              >
                {/* Dot on spine */}
                <motion.div
                  style={{
                    position: "absolute",
                    left: "-26px",
                    top: "12px",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: dotColor,
                    border: `2px solid rgba(10,10,15,1)`,
                    boxShadow: isExpanded ? `0 0 12px ${dotColor}` : "none",
                    zIndex: 2,
                  }}
                  animate={{ scale: isExpanded ? 1.3 : 1 }}
                  transition={{ duration: 0.2 }}
                />

                {/* Connector lines for first/last */}
                {i === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: "-20px",
                      top: 0,
                      bottom: "50%",
                      width: "2px",
                      background: "#0a0a0f",
                      zIndex: 1,
                    }}
                  />
                )}

                {/* Event card */}
                <motion.div
                  onClick={() => handleEventTap(evt)}
                  style={{
                    background: isExpanded
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(255,255,255,0.04)",
                    border: isExpanded
                      ? `1px solid ${dotColor}40`
                      : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "16px",
                    padding: "14px 14px",
                    cursor: "pointer",
                    transition: "background 0.2s, border 0.2s",
                  }}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* Date + category label */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.35)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {new Date(evt.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {evt.time && evt.time !== "All Day" && (
                        <span
                          style={{
                            fontSize: "9px",
                            color: "rgba(255,255,255,0.2)",
                          }}
                        >
                          · {evt.time}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        color: dotColor,
                        background: `${dotColor}18`,
                        borderRadius: "5px",
                        padding: "2px 7px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {eventDotLabel[evt.category]}
                    </span>
                  </div>

                  {/* Headline */}
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.35,
                      marginBottom: isExpanded ? "10px" : 0,
                    }}
                  >
                    {evt.headline}
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <p
                          style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.55)",
                            lineHeight: 1.65,
                            margin: "0 0 14px",
                          }}
                        >
                          {evt.detail}
                        </p>

                        {/* Impact badge */}
                        {evt.impact && (
                          <div style={{ marginBottom: "12px" }}>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                color:
                                  evt.impact === "Critical"
                                    ? "#ff4d6d"
                                    : evt.impact === "High"
                                    ? "#f9c74f"
                                    : "#06d6a0",
                                background:
                                  evt.impact === "Critical"
                                    ? "rgba(255,77,109,0.15)"
                                    : evt.impact === "High"
                                    ? "rgba(249,199,79,0.15)"
                                    : "rgba(6,214,160,0.15)",
                                padding: "3px 9px",
                                borderRadius: "6px",
                              }}
                            >
                              Impact: {evt.impact}
                            </span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: "8px" }}>
                          {linkedCard && (
                            <button
                              id={`read-newsie-${evt.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReadInNewsie(evt.newsCardId);
                              }}
                              style={{
                                flex: 1,
                                padding: "9px 12px",
                                background: colors.bg,
                                border: "none",
                                borderRadius: "10px",
                                color: "#fff",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                                letterSpacing: "0.02em",
                              }}
                            >
                              📰 Read in Newsie
                            </button>
                          )}

                          {evt.externalUrl && (
                            <a
                              id={`view-source-${evt.id}`}
                              href={evt.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                flex: linkedCard ? "0 0 auto" : 1,
                                padding: "9px 12px",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "10px",
                                color: "rgba(255,255,255,0.7)",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                textDecoration: "none",
                                textAlign: "center",
                              }}
                            >
                              ↗ Source
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tap hint */}
                  {!isExpanded && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.2)",
                        marginTop: "6px",
                      }}
                    >
                      Tap to expand →
                    </div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}

          {/* End cap */}
          <div style={{ position: "relative", paddingLeft: "0" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + tl.events.length * 0.05 }}
              style={{
                position: "absolute",
                left: "-26px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: colors.bg,
                boxShadow: `0 0 16px ${colors.glow}`,
                zIndex: 2,
              }}
            />
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "12px",
                color: "rgba(255,255,255,0.35)",
                fontStyle: "italic",
              }}
            >
              {tl.stats.resolution}
            </div>
          </div>
        </div>
      </div>

      {/* ── News Card Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalNews && (
          <NewsCardModal news={modalNews} onClose={() => setModalNews(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

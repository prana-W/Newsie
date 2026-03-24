import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, MessageCircle, X, Send } from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_SERVER_URL;

// ─── Like Button ────────────────────────────────────────────────────────────
export function Like({ newsId, initialLiked = false, initialCount = 0 }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setCount((c) => (newLiked ? c + 1 : c - 1));

    try {
      await fetch(`${API_BASE}/api/v1/news/${newsId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ liked: newLiked }),
      });
    } catch {
      // Revert on failure
      setLiked(!newLiked);
      setCount((c) => (newLiked ? c - 1 : c + 1));
      toast.error("Failed to update like.");
    }
  };

  return (
    <motion.button
      onClick={handleLike}
      whileTap={{ scale: 0.8 }}
      className="flex flex-col items-center gap-1 group"
    >
      <motion.div
        animate={liked ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
        className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-colors duration-200 ${
          liked
            ? "bg-blue-500/90 text-white shadow-lg shadow-blue-500/30"
            : "bg-white/10 text-white/80 hover:bg-white/20"
        }`}
      >
        <ThumbsUp className="w-5 h-5" fill={liked ? "currentColor" : "none"} />
      </motion.div>
      <span className="text-[11px] font-medium text-white/70">{count}</span>
    </motion.button>
  );
}

// ─── Dislike Button ─────────────────────────────────────────────────────────
export function Dislike({ newsId, initialDisliked = false, initialCount = 0 }) {
  const [disliked, setDisliked] = useState(initialDisliked);
  const [count, setCount] = useState(initialCount);

  const handleDislike = async () => {
    const newDisliked = !disliked;
    setDisliked(newDisliked);
    setCount((c) => (newDisliked ? c + 1 : c - 1));

    try {
      await fetch(`${API_BASE}/api/v1/news/${newsId}/dislike`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ disliked: newDisliked }),
      });
    } catch {
      setDisliked(!newDisliked);
      setCount((c) => (newDisliked ? c - 1 : c + 1));
      toast.error("Failed to update dislike.");
    }
  };

  return (
    <motion.button
      onClick={handleDislike}
      whileTap={{ scale: 0.8 }}
      className="flex flex-col items-center gap-1 group"
    >
      <motion.div
        animate={disliked ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
        className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-colors duration-200 ${
          disliked
            ? "bg-red-500/90 text-white shadow-lg shadow-red-500/30"
            : "bg-white/10 text-white/80 hover:bg-white/20"
        }`}
      >
        <ThumbsDown
          className="w-5 h-5"
          fill={disliked ? "currentColor" : "none"}
        />
      </motion.div>
      <span className="text-[11px] font-medium text-white/70">{count}</span>
    </motion.button>
  );
}

// ─── Comment Button + Overlay ───────────────────────────────────────────────
export function Comment({ newsId, initialCount = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Fetch comments when overlay opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchComments = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/news/${newsId}/comments`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch {
        toast.error("Failed to load comments.");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [isOpen, newsId]);

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const handlePost = async () => {
    if (!newComment.trim() || posting) return;

    const text = newComment.trim();
    setNewComment("");
    setPosting(true);

    // Optimistic update
    const tempComment = {
      _id: Date.now().toString(),
      text,
      user: { name: "You" },
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, tempComment]);

    // Scroll to bottom
    setTimeout(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);

    try {
      const res = await fetch(`${API_BASE}/api/v1/news/${newsId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      // Replace temp comment with real one
      if (data.comment) {
        setComments((prev) =>
          prev.map((c) => (c._id === tempComment._id ? data.comment : c))
        );
      }
    } catch {
      // Remove temp comment on failure
      setComments((prev) => prev.filter((c) => c._id !== tempComment._id));
      toast.error("Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  const formatTime = (dateStr) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* Comment trigger button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileTap={{ scale: 0.8 }}
        className="flex flex-col items-center gap-1 group"
      >
        <div className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md bg-white/10 text-white/80 hover:bg-white/20 transition-colors duration-200">
          <MessageCircle className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-medium text-white/70">
          {comments.length || initialCount}
        </span>
      </motion.button>

      {/* Comment overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-[100]"
            />

            {/* Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col bg-zinc-900 rounded-t-2xl max-h-[75vh] sm:max-w-md sm:mx-auto"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10">
                <h3 className="text-white font-semibold text-base">
                  Comments{" "}
                  <span className="text-white/40 text-sm font-normal">
                    ({comments.length})
                  </span>
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comments list */}
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-[200px]"
              >
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-white/40 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-white/30">
                    <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs mt-1">Be the first to share your thoughts</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <motion.div
                      key={comment._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                        {(comment.user?.name || "U")[0].toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-white/90 text-sm font-medium truncate">
                            {comment.user?.name || "Anonymous"}
                          </span>
                          <span className="text-white/30 text-[10px] flex-shrink-0">
                            {formatTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm mt-0.5 leading-relaxed break-words">
                          {comment.text}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Input area */}
              <div className="px-4 py-3 border-t border-white/10 bg-zinc-900/95 backdrop-blur-lg">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handlePost();
                      }
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 bg-white/10 text-white text-sm rounded-full px-4 py-2.5 placeholder-white/30 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                  />
                  <motion.button
                    onClick={handlePost}
                    disabled={!newComment.trim() || posting}
                    whileTap={{ scale: 0.85 }}
                    className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-400 disabled:bg-white/10 disabled:text-white/20 text-white flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Combined Overlay ───────────────────────────────────────────────────────
function OverlayComponents({ newsId, initialLikes = 0, initialDislikes = 0, initialComments = 0 }) {
  return (
    <div>
      <Like newsId={newsId} initialCount={initialLikes} />
      <Dislike newsId={newsId} initialCount={initialDislikes} />
      <Comment newsId={newsId} initialCount={initialComments} />
    </div>
  );
}

export default OverlayComponents;

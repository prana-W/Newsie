import React from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {X, Tv, Loader2, Sparkles, Wand2} from 'lucide-react';

const AIVideoModal = ({isOpen, onClose, videoUrl, generating, prompt}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{scale: 0.9, opacity: 0}}
                        animate={{scale: 1, opacity: 1}}
                        exit={{scale: 0.9, opacity: 0}}
                        className="relative w-[min(92vw,26rem)] sm:w-[min(88vw,28rem)] bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                    >
                        {/* Header */}
                        <div className="px-3.5 py-3 border-b border-white/5 flex items-center justify-between bg-white/2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <Tv className="w-4 h-4 text-[#a78bfa] shrink-0" />
                                <h3 className="font-semibold text-sm text-white tracking-tight truncate">
                                    AI News Animation
                                </h3>
                                <div className="px-2 py-0.5 rounded-full bg-[#a78bfa]/20 border border-[#a78bfa]/30 text-[9px] text-[#ddd6fe] font-bold uppercase tracking-widest shrink-0">
                                    PHONE 9:16
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="relative mx-auto w-full aspect-9/16 bg-black flex items-center justify-center overflow-hidden">
                            {generating ? (
                                <div className="flex flex-col items-center gap-5 text-center px-6">
                                    <div className="relative">
                                        <motion.div
                                            animate={{rotate: 360}}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: 'linear',
                                            }}
                                            className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#a78bfa]"
                                        />
                                        <motion.div
                                            animate={{scale: [1, 1.2, 1]}}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                            }}
                                            className="absolute inset-0 flex items-center justify-center"
                                        >
                                            <Wand2 className="w-6 h-6 text-[#a78bfa]" />
                                        </motion.div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-bold text-white">
                                            Generating 9:16 Story Video...
                                        </h4>
                                        <p className="text-white/60 text-xs leading-relaxed max-w-[16rem] mx-auto">
                                            Building a mobile-first
                                            multi-segment Veo 3.1 animation
                                            (15-60s) with detailed ET summary
                                            context.
                                            <br />
                                            <span className="text-[#a78bfa] italic mt-2 block font-medium">
                                                Rendering can take a bit for
                                                longer videos.
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                animate={{
                                                    opacity: [0.3, 1, 0.3],
                                                }}
                                                transition={{
                                                    duration: 1,
                                                    repeat: Infinity,
                                                    delay: i * 0.2,
                                                }}
                                                className="w-2 h-2 rounded-full bg-[#a78bfa]"
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : videoUrl ? (
                                <video
                                    src={videoUrl}
                                    controls
                                    autoPlay
                                    playsInline
                                    preload="metadata"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-white/40 flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span>Failed to load video</span>
                                </div>
                            )}

                            {/* Prompt Reflection (Visible only when not generating) */}
                            {!generating && prompt && (
                                <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-white/80 opacity-100 md:opacity-0 md:hover:opacity-100 transition-opacity duration-300 max-h-28 overflow-y-auto">
                                    <div className="flex items-center gap-2 mb-1 font-semibold text-[#a78bfa]">
                                        <Sparkles className="w-3 h-3" />
                                        <span>AI PROMPT</span>
                                    </div>
                                    {prompt}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-3.5 py-3 bg-white/2 flex items-center justify-center">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-full bg-[#a78bfa] hover:bg-[#8b5cf6] text-white text-xs font-bold shadow-lg shadow-[#a78bfa]/20 transition-all hover:scale-105"
                            >
                                Nice! Take me back
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AIVideoModal;

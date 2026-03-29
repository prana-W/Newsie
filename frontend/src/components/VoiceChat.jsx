import { useState, useEffect, useRef, useCallback } from 'react';
import voiceResponses from '@/data/voiceResponses.json';
import TextToSpeech from './TextToSpeech';

/* ═══════════════════════════════════════════════════════════════════════════
   Newsie Voice Chat — Demo Mode (Spacebar Version)
   Shows "Listening...", waits for user to press Spacebar, then reads the next
   scripted response from voiceResponses.json using the <TextToSpeech /> component.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function VoiceChat({ getCurrentCard }) {
  // ── UI state ───────────────────────────────────────────────────────────────
  const [isActive, setIsActive]       = useState(false);
  const [voiceState, setVoiceState]   = useState('idle');
  const [statusText, setStatusText]   = useState('');
  const [userBubbles, setUserBubbles] = useState([]);
  const [fabClass, setFabClass]       = useState('');
  const [currentText, setCurrentText] = useState(''); // Drives the TextToSpeech component

  // ── Stable mutable refs ───────────────────────────────────────────────────
  const isActiveRef        = useRef(false);
  const responseIndexRef   = useRef(0);
  const micStreamRef       = useRef(null);
  const isSpeakingRef      = useRef(false);
  const isListeningRef     = useRef(false);

  // Stable function refs
  const startListeningRef  = useRef(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setStatus = useCallback((state, text) => {
    setVoiceState(state);
    setStatusText(text);
  }, []);

  // ── Stop everything ───────────────────────────────────────────────────────
  const stopVoiceChat = useCallback(() => {
    isActiveRef.current    = false;
    isListeningRef.current = false;
    isSpeakingRef.current  = false;

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }

    setIsActive(false);
    setFabClass('');
    setStatus('idle', '');
    setUserBubbles([]);
    setCurrentText('');
  }, [setStatus]);

  // ── Wire up stable refs once on mount ─────────────────────────────────────
  useEffect(() => {
    // ── startListening ─────────────────────────────────────────────────────
    startListeningRef.current = () => {
      if (!isActiveRef.current || isSpeakingRef.current) return;

      // Ask for mic access just to trigger browser recording indicator (for demo realism)
      if (!micStreamRef.current) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            if (!isActiveRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
            micStreamRef.current = stream;
            isListeningRef.current = true;
            setStatus('listening', 'Press SPACE to reply');
            setFabClass('aura-glow');
          })
          .catch(err => {
            console.warn('[Voice] Mic access denied (fallback used):', err);
            isListeningRef.current = true;
            setStatus('listening', 'Press SPACE to reply');
            setFabClass('aura-glow');
          });
      } else {
        isListeningRef.current = true;
        setStatus('listening', 'Press SPACE to reply');
        setFabClass('aura-glow');
      }
    };
  }, [setStatus]);

  // ── Global Spacebar Listener ──────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent running if user is typing in forms, etc.
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (isActiveRef.current && isListeningRef.current && !isSpeakingRef.current) {
          e.preventDefault(); // Stop page scrolling
          
          isListeningRef.current = false; // block double triggers
          setStatus('listening', 'Transcribing...');
          
          setUserBubbles(prev => {
            const now = Date.now();
            return [...prev, { id: now, text: '...', _ts: now }].slice(-6);
          });
          
          if (!isActiveRef.current) return;

          const idx = responseIndexRef.current;
          if (idx >= voiceResponses.length) {
            setStatus('listening', 'Press SPACE to reply');
            setFabClass('aura-glow');
            startListeningRef.current?.();
            return;
          }

          const text = voiceResponses[idx].text;
          responseIndexRef.current = idx + 1;

          isSpeakingRef.current = true;
          setStatus('speaking', 'Newsie is talking...');
          setFabClass('active');
          
          // This triggers the <TextToSpeech /> component synchronously!
          setCurrentText(text);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Start voice chat ──────────────────────────────────────────────────────
  const startVoiceChat = useCallback(async () => {
    isActiveRef.current      = true;
    responseIndexRef.current = 0;

    setIsActive(true);
    setFabClass('connecting');
    setStatus('connecting', 'Connecting...');

    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices(); 
      // Silent primer unlocks synthesis on browsers that gate behind a user gesture
      const primer = new SpeechSynthesisUtterance('');
      primer.volume = 0;
      window.speechSynthesis.speak(primer);
    }

    setTimeout(() => {
      if (!isActiveRef.current) return;
      setFabClass('aura-glow');
      setStatus('listening', 'Press SPACE to reply');
      startListeningRef.current?.();
    }, 800);
  }, [setStatus]);

  // ── Handling `TextToSpeech` component end ─────────────────────────────────
  const handleSpeechEnd = useCallback(() => {
    if (!isActiveRef.current) return;
    isSpeakingRef.current = false;
    setCurrentText(''); // Clear text so it won't repeatedly play
    setStatus('listening', 'Press SPACE to reply');
    setFabClass('aura-glow');
    startListeningRef.current?.();
  }, [setStatus]);

  // Cleanup on unmount
  useEffect(() => () => stopVoiceChat(), [stopVoiceChat]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const fabStyles = {
    base:       'absolute bottom-4 left-1/2 -translate-x-1/2 z-30 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-300 ease-out overflow-visible',
    idle:       'bg-white/[0.08] border-white/15 text-white/75 hover:bg-white/[0.14] hover:border-white/30 hover:text-white hover:scale-110',
    connecting: 'bg-white/[0.08] border-amber-400/40 text-amber-200',
    active:     'bg-rose-400/25 border-rose-400/50 text-rose-200 shadow-[0_0_24px_rgba(244,63,94,0.3)]',
    auraGlow:   'bg-violet-500/20 border-violet-500/60 text-white shadow-[0_0_24px_rgba(139,92,246,0.4),0_0_48px_rgba(139,92,246,0.15)]',
  };

  const getFabCls = () => {
    const b = fabStyles.base;
    if (fabClass === 'connecting') return `${b} ${fabStyles.connecting}`;
    if (fabClass === 'aura-glow')  return `${b} ${fabStyles.auraGlow}`;
    if (fabClass === 'active')     return `${b} ${fabStyles.active}`;
    return `${b} ${fabStyles.idle}`;
  };

  const statusColors = {
    idle:        'text-foreground/35',
    connecting:  'text-amber-400/80',
    listening:   'text-green-400/80',
    speaking:    'text-indigo-400/90',
    error:       'text-rose-400/80',
    disconnected:'text-foreground/35',
  };

  const auraRingCls = {
    base:      'w-12 h-12 rounded-full shrink-0 border-2 relative',
    idle:      'bg-violet-500/[0.4] border-violet-500/30 animate-pulse',
    listening: 'bg-green-500/30  border-green-500/50',
    speaking:  'bg-indigo-500/40 border-indigo-500/60',
  };

  const getAuraCls = () => {
    if (voiceState === 'listening')
      return `${auraRingCls.base} ${auraRingCls.listening} shadow-[0_0_20px_rgba(34,197,94,0.4)]`;
    if (voiceState === 'speaking')
      return `${auraRingCls.base} ${auraRingCls.speaking}  shadow-[0_0_24px_rgba(99,102,241,0.5)]`;
    return `${auraRingCls.base} ${auraRingCls.idle}`;
  };

  return (
    <>
      <TextToSpeech text={currentText} onEnd={handleSpeechEnd} />

      {/* ── Mic FAB ───────────────────────────────────────────────────────── */}
      <button
        id="voice-fab"
        className={getFabCls()}
        style={{ width: 52, height: 52 }}
        aria-label="Voice Chat"
        onClick={() => (isActive ? stopVoiceChat() : startVoiceChat())}
      >
        {(fabClass === 'aura-glow' || fabClass === 'connecting') && (
          <span
            className={`absolute inset-[-8px] rounded-full pointer-events-none z-[1]
              bg-[radial-gradient(circle,rgba(139,92,246,0.5)_0%,rgba(139,92,246,0)_70%)]
              ${fabClass === 'aura-glow'
                ? 'animate-[auraGlow_2s_ease-in-out_infinite]'
                : 'animate-[auraBreath_1.5s_ease-in-out_infinite]'}`}
          />
        )}
        <svg
          className="relative z-[2]"
          width={22} height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8"  y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {/* ── Voice overlay (slides up when active) ─────────────────────────── */}
      <div
        id="voice-overlay"
        className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isActive ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
      >
        <div
          className="bg-background/[0.92] backdrop-blur-2xl border-t border-white/[0.08] px-5 pt-4 pb-7 flex items-center gap-4"
          style={{ minHeight: 100 }}
        >
          <div className={getAuraCls()} />

          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <span
              className={`font-mono text-[0.6rem] uppercase tracking-widest transition-colors duration-300 ${statusColors[voiceState] ?? statusColors.idle}`}
            >
              {statusText}
            </span>

            {userBubbles.length > 0 && (
              <div className="flex flex-col gap-1 max-h-[60px] overflow-y-auto">
                {userBubbles.map(b => (
                  <div
                    key={b.id}
                    className="self-start max-w-[90%] text-[0.78rem] text-foreground/80 leading-snug px-2.5 py-1 bg-white/[0.06] border border-white/[0.08] rounded-xl animate-[bubbleFadeIn_0.25s_ease-out]"
                  >
                    {b.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            id="voice-close"
            aria-label="End voice chat"
            onClick={(e) => { e.stopPropagation(); stopVoiceChat(); }}
            className="w-9 h-9 rounded-full border border-rose-400/30 bg-rose-400/[0.12] text-rose-300 flex items-center justify-center shrink-0 transition-all duration-200 hover:bg-rose-400/25 hover:border-rose-400/50 cursor-pointer relative z-50"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6"  x2="6"  y2="18" />
              <line x1="6"  y1="6"  x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
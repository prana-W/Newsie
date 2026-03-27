import { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   Newsie Voice Chat — React port of static/voice-chat.js
   Same WebSocket + Audio logic, Tailwind-styled, using index.css variables.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Utility: load an external script exactly once ───────────────────────────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export default function VoiceChat({ getCurrentCard }) {
  // ── UI state ───────────────────────────────────────────────────────────────
  const [isActive, setIsActive]           = useState(false);
  const [voiceState, setVoiceState]       = useState('idle'); // idle | connecting | listening | speaking | error
  const [statusText, setStatusText]       = useState('');
  const [userBubbles, setUserBubbles]     = useState([]);   // [{ id, text }]
  const [toolText, setToolText]           = useState('');
  const [toolVisible, setToolVisible]     = useState(false);
  const [fabClass, setFabClass]           = useState('');   // 'connecting' | 'aura-glow' | 'active'

  // ── Mutable refs (NOT react state — changes shouldn't re-render) ──────────
  const wsRef               = useRef(null);
  const audioCtxRef         = useRef(null);
  const micStreamRef        = useRef(null);
  const workletNodeRef      = useRef(null);
  const analyserRef         = useRef(null);
  const vadIntervalRef      = useRef(null);
  const sileroVadRef        = useRef(null);
  const sileroReadyRef      = useRef(false);
  const isUserSpeakingRef   = useRef(false);
  const lastVadSpeechAtRef  = useRef(0);
  const micStopTimerRef     = useRef(null);
  const speechEndWatchRef   = useRef(null);
  const scheduledSourcesRef = useRef([]);
  const nextPlayTimeRef     = useRef(0);
  const isSpeakingRef       = useRef(false);
  const isConnectedRef      = useRef(false);
  const reconnectAttemptsRef= useRef(0);
  const reconnectTimerRef   = useRef(null);
  const isActiveRef         = useRef(false);

  // ── Helpers (stable refs so they don't cause stale-closure issues) ────────
  const setStatus = useCallback((state, text) => {
    setVoiceState(state);
    setStatusText(text);
  }, []);

  const setMicStreamingEnabled = useCallback((enabled) => {
    if (!workletNodeRef.current) return;
    workletNodeRef.current.port.postMessage({ type: 'streaming', enabled: Boolean(enabled) });
  }, []);

  const flushPlayback = useCallback(() => {
    for (const src of scheduledSourcesRef.current) {
      try { src.stop(); } catch (_) {}
    }
    scheduledSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
    isSpeakingRef.current = false;
  }, []);

  const interruptPlayback = useCallback(() => {
    if (!isSpeakingRef.current) return;
    flushPlayback();
    setStatus('listening', 'Listening...');
  }, [flushPlayback, setStatus]);

  const notifySpeechEnd = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'speech_end' }));
    }
  }, []);

  // ── Audio playback ─────────────────────────────────────────────────────────
  const handleAudioChunk = useCallback((pcmBuffer) => {
    if (!audioCtxRef.current) return;
    if (isUserSpeakingRef.current || Date.now() - lastVadSpeechAtRef.current < 160) return;

    const int16 = new Int16Array(pcmBuffer);
    if (int16.length === 0) return;

    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const buf = new AudioBuffer({ length: float32.length, numberOfChannels: 1, sampleRate: 24000 });
    buf.copyToChannel(float32, 0);

    const src = audioCtxRef.current.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtxRef.current.destination);

    const now = audioCtxRef.current.currentTime;
    if (nextPlayTimeRef.current < now) nextPlayTimeRef.current = now;

    src.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += buf.duration;

    scheduledSourcesRef.current.push(src);
    isSpeakingRef.current = true;
    setStatus('speaking', 'Newsie is talking...');

    src.onended = () => {
      const idx = scheduledSourcesRef.current.indexOf(src);
      if (idx > -1) scheduledSourcesRef.current.splice(idx, 1);
      if (scheduledSourcesRef.current.length === 0) {
        isSpeakingRef.current = false;
        if (isConnectedRef.current) setStatus('listening', 'Listening...');
      }
    };
  }, [setStatus]);

  // ── Server message handler ─────────────────────────────────────────────────
  const handleServerMessage = useCallback((msg) => {
    if (msg.event === 'generation_complete') {
      isSpeakingRef.current = false;
      setStatus('listening', 'Standing by');
      setFabClass('active');
      return;
    }

    switch (msg.type) {
      case 'session_ready':
        isConnectedRef.current = true;
        setFabClass('aura-glow');
        setStatus('listening', 'Listening...');
        break;

      case 'reconnecting':
        setStatus('connecting', msg.time_left ? `Reconnecting (${msg.time_left}s)...` : 'Reconnecting...');
        setFabClass('connecting');
        break;

      case 'interrupted':
        interruptPlayback();
        break;

      case 'input_transcript':
        if (msg.text) {
          interruptPlayback();
          setUserBubbles(prev => {
            const now = Date.now();
            const last = prev[prev.length - 1];
            if (last && now - last._ts < 3000) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...last, text: last.text + ' ' + msg.text, _ts: now };
              return updated.slice(-6);
            }
            return [...prev, { id: now, text: msg.text, _ts: now }].slice(-6);
          });
        }
        break;

      case 'output_transcript':
        if (msg.text && !isSpeakingRef.current) {
          isSpeakingRef.current = true;
          setStatus('speaking', 'Newsie is talking...');
        }
        break;

      case 'tool_call':
        setToolText(`🔍 ${msg.args?.query || msg.name}...`);
        setToolVisible(true);
        break;

      case 'tool_result':
        setToolText(msg.success ? '✅ got it' : '❌ failed');
        setTimeout(() => setToolVisible(false), 2000);
        break;

      case 'error':
        setStatus('error', msg.message || 'Error');
        break;

      default:
        break;
    }
  }, [interruptPlayback, setStatus]);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const connectWebSocket = useCallback(() => {
    if (!isActiveRef.current) return;

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${location.host}/ws/voice`);
    socket.binaryType = 'arraybuffer';
    wsRef.current = socket;

    socket.onopen = () => {
      reconnectAttemptsRef.current = 0;
      if (getCurrentCard) {
        const card = getCurrentCard();
        if (card) socket.send(JSON.stringify({ type: 'context', card }));
      }
    };

    socket.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        handleAudioChunk(e.data);
      } else {
        handleServerMessage(JSON.parse(e.data));
      }
    };

    socket.onerror = () => {
      if (!isActiveRef.current) return;
      isConnectedRef.current = false;
      scheduleReconnect();
    };

    socket.onclose = () => {
      if (!isActiveRef.current) return;
      isConnectedRef.current = false;
      setStatus('disconnected', 'Disconnected');
      setFabClass('');
      scheduleReconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCurrentCard, handleAudioChunk, handleServerMessage, setStatus]);

  const scheduleReconnect = useCallback(() => {
    if (!isActiveRef.current) return;
    const delay = Math.min(500 * Math.pow(2, reconnectAttemptsRef.current), 5000);
    reconnectAttemptsRef.current += 1;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(connectWebSocket, delay);
    setStatus('connecting', 'Reconnecting...');
    setFabClass('connecting');
  }, [connectWebSocket, setStatus]);

  // ── Silero VAD init ────────────────────────────────────────────────────────
  const initSileroVAD = useCallback(async () => {
    if (!audioCtxRef.current || !micStreamRef.current) return;
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/ort.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.24/dist/bundle.min.js');

      if (!window.vad || !window.vad.MicVAD) throw new Error('Silero VAD library not available');

      sileroVadRef.current = await window.vad.MicVAD.new({
        stream: micStreamRef.current,
        baseAssetPath: 'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.24/dist/',
        onnxWASMBasePath: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/',
        positiveSpeechThreshold: 0.85,
        negativeSpeechThreshold: 0.7,
        redemptionFrames: 5,
        minSpeechFrames: 5,
        onSpeechStart: () => {
          isUserSpeakingRef.current = true;
          lastVadSpeechAtRef.current = Date.now();
          if (micStopTimerRef.current) { clearTimeout(micStopTimerRef.current); micStopTimerRef.current = null; }
          if (speechEndWatchRef.current) { clearTimeout(speechEndWatchRef.current); speechEndWatchRef.current = null; }
          setMicStreamingEnabled(true);
          interruptPlayback();
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'speech_start' }));
          }
          speechEndWatchRef.current = setTimeout(() => {
            if (!isUserSpeakingRef.current) return;
            isUserSpeakingRef.current = false;
            notifySpeechEnd();
            setMicStreamingEnabled(false);
            if (isConnectedRef.current) setStatus('listening', 'Listening...');
            speechEndWatchRef.current = null;
          }, 7000);
          setStatus('listening', "You're speaking...");
        },
        onSpeechEnd: () => {
          isUserSpeakingRef.current = false;
          if (micStopTimerRef.current) clearTimeout(micStopTimerRef.current);
          if (speechEndWatchRef.current) { clearTimeout(speechEndWatchRef.current); speechEndWatchRef.current = null; }
          notifySpeechEnd();
          micStopTimerRef.current = setTimeout(() => {
            if (!isUserSpeakingRef.current) {
              setMicStreamingEnabled(false);
            }
            micStopTimerRef.current = null;
          }, 100);
          if (isConnectedRef.current) setStatus('listening', 'Listening...');
        },
      });

      sileroVadRef.current.start();
      sileroReadyRef.current = true;
    } catch (e) {
      sileroReadyRef.current = false;
      console.warn('[Voice] Silero init failed; using fallback VAD', e);
    }
  }, [interruptPlayback, notifySpeechEnd, setMicStreamingEnabled, setStatus]);

  // ── Start / Stop ───────────────────────────────────────────────────────────
  const startVoiceChat = useCallback(async () => {
    isActiveRef.current = true;
    setIsActive(true);
    setFabClass('connecting');
    setStatus('connecting', 'Connecting...');

    try {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      audioCtxRef.current = new AudioContext({ sampleRate: 16000 });

      await audioCtxRef.current.audioWorklet.addModule('/audio-processor.js');

      const source = audioCtxRef.current.createMediaStreamSource(micStreamRef.current);

      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      source.connect(analyserRef.current);
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      await initSileroVAD();

      vadIntervalRef.current = setInterval(() => {
        if (sileroReadyRef.current) return;
        if (!isSpeakingRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        if (sum / dataArray.length > 12) interruptPlayback();
      }, 50);

      workletNodeRef.current = new AudioWorkletNode(audioCtxRef.current, 'audio-capture-processor');
      workletNodeRef.current.port.onmessage = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(e.data);
        }
      };

      source.connect(workletNodeRef.current);
      workletNodeRef.current.connect(audioCtxRef.current.destination);

      connectWebSocket();
    } catch (err) {
      console.error('[Voice] Start failed:', err);
      setStatus('error', err.message || 'Mic access denied');
      stopVoiceChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectWebSocket, initSileroVAD, interruptPlayback, setStatus]);

  const stopVoiceChat = useCallback(() => {
    isActiveRef.current = false;
    isConnectedRef.current = false;
    reconnectAttemptsRef.current = 0;
    isUserSpeakingRef.current = false;
    sileroReadyRef.current = false;
    lastVadSpeechAtRef.current = 0;

    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    if (speechEndWatchRef.current) { clearTimeout(speechEndWatchRef.current); speechEndWatchRef.current = null; }

    if (sileroVadRef.current) { try { sileroVadRef.current.pause(); } catch (_) {} sileroVadRef.current = null; }
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    if (workletNodeRef.current) { workletNodeRef.current.disconnect(); workletNodeRef.current = null; }
    if (analyserRef.current) { analyserRef.current.disconnect(); analyserRef.current = null; }
    if (vadIntervalRef.current) { clearInterval(vadIntervalRef.current); vadIntervalRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }

    flushPlayback();
    setIsActive(false);
    setFabClass('');
    setStatus('idle', '');
    setUserBubbles([]);
    setToolVisible(false);
  }, [flushPlayback, setStatus]);

  // Cleanup on unmount
  useEffect(() => () => stopVoiceChat(), [stopVoiceChat]);

  // ── Derived styles via Tailwind ────────────────────────────────────────────
  const fabStyles = {
    base: 'absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-13 h-13 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-300 ease-out overflow-visible',
    idle:       'bg-white/[0.08] border-white/15 text-white/75 hover:bg-white/[0.14] hover:border-white/30 hover:text-white hover:scale-110',
    connecting: 'bg-white/[0.08] border-amber-400/40 text-amber-200',
    active:     'bg-rose-400/25 border-rose-400/50 text-rose-200 shadow-[0_0_24px_rgba(244,63,94,0.3)]',
    auraGlow:   'bg-violet-500/20 border-violet-500/60 text-white shadow-[0_0_24px_rgba(139,92,246,0.4),0_0_48px_rgba(139,92,246,0.15)]',
  };

  const getFabCls = () => {
    if (fabClass === 'connecting') return `${fabStyles.base} ${fabStyles.connecting}`;
    if (fabClass === 'aura-glow')  return `${fabStyles.base} ${fabStyles.auraGlow}`;
    if (fabClass === 'active')     return `${fabStyles.base} ${fabStyles.active}`;
    return `${fabStyles.base} ${fabStyles.idle}`;
  };

  const statusColors = {
    idle:       'text-foreground/35',
    connecting: 'text-amber-400/80',
    listening:  'text-green-400/80',
    speaking:   'text-indigo-400/90',
    error:      'text-rose-400/80',
    disconnected: 'text-foreground/35',
  };

  const auraRingCls = {
    base: 'w-12 h-12 rounded-full shrink-0 border-2 relative',
    idle:      'bg-violet-500/[0.4] border-violet-500/30 animate-pulse',
    listening: 'bg-green-500/30 border-green-500/50',
    speaking:  'bg-indigo-500/40 border-indigo-500/60',
  };

  const getAuraCls = () => {
    if (voiceState === 'listening') return `${auraRingCls.base} ${auraRingCls.listening} shadow-[0_0_20px_rgba(34,197,94,0.4)]`;
    if (voiceState === 'speaking')  return `${auraRingCls.base} ${auraRingCls.speaking} shadow-[0_0_24px_rgba(99,102,241,0.5)]`;
    return `${auraRingCls.base} ${auraRingCls.idle}`;
  };

  return (
    <>
      {/* ── Mic Floating Action Button ──────────────────────────────────── */}
      <button
        id="voice-fab"
        className={getFabCls()}
        style={{ width: 52, height: 52 }}
        aria-label="Voice Chat"
        onClick={() => isActive ? stopVoiceChat() : startVoiceChat()}
      >
        {/* Aura glow ring behind the icon */}
        {(fabClass === 'aura-glow' || fabClass === 'connecting') && (
          <span
            className={`absolute inset-[-8px] rounded-full pointer-events-none z-[1]
              bg-[radial-gradient(circle,rgba(139,92,246,0.5)_0%,rgba(139,92,246,0)_70%)]
              ${fabClass === 'aura-glow' ? 'animate-[auraGlow_2s_ease-in-out_infinite]' : 'animate-[auraBreath_1.5s_ease-in-out_infinite]'}`}
          />
        )}
        {/* Mic SVG icon */}
        <svg
          className="relative z-[2]"
          width={22}
          height={22}
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
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {/* ── Voice Overlay (bottom bar, slides up when active) ───────────── */}
      <div
        id="voice-overlay"
        className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none
          ${isActive ? 'translate-y-0 pointer-events-auto' : 'translate-y-full'}`}
      >
        <div
          className="bg-background/[0.92] backdrop-blur-2xl border-t border-white/[0.08] px-5 pt-4 pb-7 flex items-center gap-4"
          style={{ minHeight: 100 }}
        >
          {/* Aura ring */}
          <div className={getAuraCls()} />

          {/* Status + bubbles + tool indicator */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {/* Status text */}
            <span
              className={`font-mono text-[0.6rem] uppercase tracking-widest transition-colors duration-300 ${statusColors[voiceState] ?? statusColors.idle}`}
            >
              {statusText}
            </span>

            {/* User speech bubbles */}
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

            {/* Tool indicator */}
            {toolVisible && (
              <span className="font-mono text-[0.58rem] text-cyan-400/70 tracking-wide transition-all duration-300">
                {toolText}
              </span>
            )}
          </div>

          {/* Close button */}
          <button
            id="voice-close"
            aria-label="End voice chat"
            onClick={stopVoiceChat}
            className="w-9 h-9 rounded-full border border-rose-400/30 bg-rose-400/[0.12] text-rose-300 flex items-center justify-center shrink-0 transition-all duration-200 hover:bg-rose-400/25 hover:border-rose-400/50"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

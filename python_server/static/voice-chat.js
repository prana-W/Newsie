/* ═══════════════════════════════════════════════════════════════════════════
   Newsie Voice Chat — Client-side WebSocket + Audio
   Low-latency, interrupt-aware, user-speech-focused UI
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── State ────────────────────────────────────────────────────────────
  let ws = null;
  let audioCtx = null;
  let micStream = null;
  let workletNode = null;
  let analyser = null;
  let vadInterval = null;
  let isActive = false;
  let isConnected = false;
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  let sileroVad = null;
  let isUserSpeaking = false;
  let sileroReady = false;
  let lastVadSpeechAt = 0;
  let micStopTimer = null;
  let speechEndWatchdogTimer = null;

  // Playback state — track all scheduled sources for interruption
  let scheduledSources = [];
  let nextPlayTime = 0;
  let isSpeaking = false;

  // Transcript accumulation
  let userTranscriptParts = [];

  // ── DOM refs ─────────────────────────────────────────────────────────
  let micFab, voiceOverlay, voiceClose, voiceStatus;
  let auraPulse, userBubbles, toolIndicator;

  // ── Get current card from app.js ─────────────────────────────────────
  function getCurrentCard() {
    if (window.__newsie_getCurrentCard) {
      return window.__newsie_getCurrentCard();
    }
    return null;
  }

  // ── Init DOM ─────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    micFab = document.getElementById("voice-fab");
    voiceOverlay = document.getElementById("voice-overlay");
    voiceClose = document.getElementById("voice-close");
    voiceStatus = document.getElementById("voice-status");
    auraPulse = document.getElementById("voice-aura");
    userBubbles = document.getElementById("voice-user-bubbles");
    toolIndicator = document.getElementById("voice-tool-indicator");

    if (micFab) micFab.addEventListener("click", toggleVoiceChat);
    if (voiceClose) voiceClose.addEventListener("click", stopVoiceChat);
  });

  // ── Toggle ───────────────────────────────────────────────────────────
  function toggleVoiceChat() {
    isActive ? stopVoiceChat() : startVoiceChat();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "true") return resolve();
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error(`Failed to load ${src}`)),
          {
            once: true,
          },
        );
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function setMicStreamingEnabled(enabled) {
    if (!workletNode) return;
    workletNode.port.postMessage({
      type: "streaming",
      enabled: Boolean(enabled),
    });
  }

  function notifySpeechEnd() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "speech_end" }));
    }
  }

  async function initSileroVAD() {
    if (!audioCtx || !micStream) return;

    try {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/ort.min.js",
      );
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.24/dist/bundle.min.js",
      );

      if (!window.vad || !window.vad.MicVAD) {
        throw new Error("Silero VAD library not available");
      }

      sileroVad = await window.vad.MicVAD.new({
        stream: micStream,
        baseAssetPath:
          "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.24/dist/",
        onnxWASMBasePath:
          "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/",
        positiveSpeechThreshold: 0.85, // Decreased sensitivity (was 0.68)
        negativeSpeechThreshold: 0.7, // Decreased sensitivity (was 0.52)
        redemptionFrames: 5,
        minSpeechFrames: 5, // Require more frames to trigger (was 3)
        onSpeechStart: () => {
          isUserSpeaking = true;
          lastVadSpeechAt = Date.now();
          if (micStopTimer) {
            clearTimeout(micStopTimer);
            micStopTimer = null;
          }
          if (speechEndWatchdogTimer) {
            clearTimeout(speechEndWatchdogTimer);
            speechEndWatchdogTimer = null;
          }
          setMicStreamingEnabled(true);
          interruptPlayback();
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "speech_start" }));
          }

          speechEndWatchdogTimer = setTimeout(() => {
            if (!isUserSpeaking) return;
            isUserSpeaking = false;
            notifySpeechEnd();
            setMicStreamingEnabled(false);
            if (isConnected) setStatus("listening", "Listening...");
            speechEndWatchdogTimer = null;
            console.warn("[Voice] Forced speech_end watchdog triggered");
          }, 7000);

          setStatus("listening", "You’re speaking...");
        },
        onSpeechEnd: () => {
          isUserSpeaking = false;
          if (micStopTimer) clearTimeout(micStopTimer);
          if (speechEndWatchdogTimer) {
            clearTimeout(speechEndWatchdogTimer);
            speechEndWatchdogTimer = null;
          }

          notifySpeechEnd();

          // Very short delay before cutting off mic streaming (100ms)
          micStopTimer = setTimeout(() => {
            if (!isUserSpeaking) {
              setMicStreamingEnabled(false);
              console.log("[Voice] Mic streaming paused after silence delay");
            }
            micStopTimer = null;
          }, 100);

          if (isConnected) setStatus("listening", "Listening...");
        },
      });

      sileroVad.start();
      sileroReady = true;
      console.log("[Voice] Silero VAD ready");
    } catch (e) {
      sileroReady = false;
      console.warn("[Voice] Silero init failed; using fallback VAD", e);
    }
  }

  // ── Reconnecting WebSocket wrapper ─────────────────────────────────
  function scheduleReconnect() {
    if (!isActive) return;
    const delay = Math.min(500 * Math.pow(2, reconnectAttempts), 5000);
    reconnectAttempts += 1;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectWebSocket, delay);
    setStatus("connecting", "Reconnecting...");
    if (micFab) micFab.classList.add("connecting");
  }

  function connectWebSocket() {
    if (!isActive) return;

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${location.host}/ws/voice`);
    socket.binaryType = "arraybuffer";
    ws = socket;

    socket.onopen = () => {
      reconnectAttempts = 0;
      console.log("[Voice] WS connected");
      const card = getCurrentCard();
      if (card) socket.send(JSON.stringify({ type: "context", card }));
    };

    socket.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        handleAudioChunk(e.data);
      } else {
        handleServerMessage(JSON.parse(e.data));
      }
    };

    socket.onerror = () => {
      if (!isActive) return;
      isConnected = false;
      scheduleReconnect();
    };

    socket.onclose = () => {
      if (!isActive) return;
      isConnected = false;
      setStatus("disconnected", "Disconnected");
      if (micFab) micFab.classList.remove("active", "connecting", "aura-glow");
      scheduleReconnect();
    };
  }

  // ── Start Voice Chat ─────────────────────────────────────────────────
  async function startVoiceChat() {
    if (isActive) return;
    isActive = true;

    voiceOverlay.classList.add("active");
    micFab.classList.add("connecting");
    setStatus("connecting", "Connecting...");

    try {
      // 1. Mic
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 2. AudioContext at 16kHz for Gemini input
      audioCtx = new AudioContext({ sampleRate: 16000 });

      // 3. AudioWorklet for streaming + Silero VAD
      await audioCtx.audioWorklet.addModule("/static/audio-processor.js");

      const source = audioCtx.createMediaStreamSource(micStream);

      // Fallback analyser VAD only if Silero cannot be loaded
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      await initSileroVAD();

      vadInterval = setInterval(() => {
        if (sileroReady) return;
        if (!isSpeaking) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        if (sum / dataArray.length > 12) {
          interruptPlayback();
        }
      }, 50);

      workletNode = new AudioWorkletNode(audioCtx, "audio-capture-processor");

      workletNode.port.onmessage = (e) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(e.data);
        }
      };

      source.connect(workletNode);
      workletNode.connect(audioCtx.destination);

      // 4. WebSocket with reconnect/backoff
      connectWebSocket();
    } catch (err) {
      console.error("[Voice] Start failed:", err);
      setStatus("error", err.message || "Mic access denied");
      stopVoiceChat();
    }
  }

  // ── Stop Voice Chat ──────────────────────────────────────────────────
  function stopVoiceChat() {
    isActive = false;
    isConnected = false;
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    isUserSpeaking = false;
    sileroReady = false;
    lastVadSpeechAt = 0;

    if (sileroVad) {
      try {
        sileroVad.pause();
      } catch (_) {}
      sileroVad = null;
    }
    if (speechEndWatchdogTimer) {
      clearTimeout(speechEndWatchdogTimer);
      speechEndWatchdogTimer = null;
    }

    if (ws) {
      ws.close();
      ws = null;
    }
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }
    if (workletNode) {
      workletNode.disconnect();
      workletNode = null;
    }
    if (analyser) {
      analyser.disconnect();
      analyser = null;
    }
    if (vadInterval) {
      clearInterval(vadInterval);
      vadInterval = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }

    // Kill any playing audio
    flushPlayback();

    voiceOverlay.classList.remove("active");
    micFab.classList.remove("active", "connecting", "aura-glow");
    setStatus("idle", "");

    // Clear transcript
    userTranscriptParts = [];
    if (userBubbles) userBubbles.innerHTML = "";
    if (toolIndicator) toolIndicator.classList.remove("visible");
  }

  // ══════════════════════════════════════════════════════════════════════
  // INTERRUPTION: When user starts talking, kill all queued AI audio
  // ══════════════════════════════════════════════════════════════════════
  function interruptPlayback() {
    if (!isSpeaking) return;
    flushPlayback();
    setStatus("listening", "Listening...");
  }

  function flushPlayback() {
    for (const src of scheduledSources) {
      try {
        src.stop();
      } catch (_) {}
    }
    scheduledSources = [];
    nextPlayTime = 0;
    isSpeaking = false;
  }

  // ── Handle server JSON messages ──────────────────────────────────────
  function handleServerMessage(msg) {
    if (msg.event === "generation_complete") {
      isSpeaking = false;
      setStatus("listening", "Standing by");
      if (micFab) micFab.classList.remove("aura-glow");
      return;
    }

    switch (msg.type) {
      case "session_ready":
        isConnected = true;
        micFab.classList.remove("connecting");
        micFab.classList.add("active", "aura-glow");
        setStatus("listening", "Listening...");
        break;

      case "reconnecting":
        setStatus(
          "connecting",
          msg.time_left
            ? `Reconnecting (time_left ${msg.time_left}s)...`
            : "Reconnecting...",
        );
        if (micFab) micFab.classList.add("connecting");
        break;

      case "interrupted":
        console.log("[Voice] Server VAD triggered: interrupted");
        interruptPlayback();
        break;

      case "input_transcript":
        // User spoke — interrupt AI audio and show user speech
        if (msg.text) {
          interruptPlayback();
          addUserBubble(msg.text);
        }
        break;

      case "output_transcript":
        // AI is speaking — we don't display AI text, just track state
        if (msg.text && !isSpeaking) {
          isSpeaking = true;
          setStatus("speaking", "Newsie is talking...");
        }
        break;

      case "tool_call":
        if (toolIndicator) {
          toolIndicator.classList.add("visible");
          toolIndicator.textContent = `🔍 ${msg.args?.query || msg.name}...`;
        }
        break;

      case "tool_result":
        if (toolIndicator) {
          toolIndicator.textContent = msg.success ? "✅ got it" : "❌ failed";
          setTimeout(() => toolIndicator.classList.remove("visible"), 2000);
        }
        break;

      case "error":
        setStatus("error", msg.message || "Error");
        break;
    }
  }

  // ── User speech bubbles (scrolling) ──────────────────────────────────
  function addUserBubble(text) {
    if (!userBubbles) return;

    // Check if last bubble exists and append, or create new
    const lastBubble = userBubbles.lastElementChild;
    const now = Date.now();

    // If recent bubble exists (within 3s), append to it
    if (lastBubble && lastBubble._ts && now - lastBubble._ts < 3000) {
      lastBubble.textContent += " " + text;
      lastBubble._ts = now;
    } else {
      const bubble = document.createElement("div");
      bubble.className = "voice-bubble";
      bubble.textContent = text;
      bubble._ts = now;
      userBubbles.appendChild(bubble);

      // Keep only last 6 bubbles
      while (userBubbles.children.length > 6) {
        userBubbles.firstElementChild.remove();
      }
    }

    // Auto scroll
    userBubbles.scrollTop = userBubbles.scrollHeight;
  }

  // ══════════════════════════════════════════════════════════════════════
  // AUDIO PLAYBACK — Low-latency gapless with interrupt support
  // Gemini outputs PCM Int16 @ 24kHz
  // ══════════════════════════════════════════════════════════════════════
  function handleAudioChunk(pcmBuffer) {
    if (!audioCtx) return;
    if (isUserSpeaking || Date.now() - lastVadSpeechAt < 160) return;

    const int16 = new Int16Array(pcmBuffer);
    if (int16.length === 0) return;

    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    // Create buffer at Gemini's 24kHz output rate
    const buf = new AudioBuffer({
      length: float32.length,
      numberOfChannels: 1,
      sampleRate: 24000,
    });
    buf.copyToChannel(float32, 0);

    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);

    // Schedule gaplessly
    const now = audioCtx.currentTime;
    if (nextPlayTime < now) nextPlayTime = now;

    src.start(nextPlayTime);
    nextPlayTime += buf.duration;

    // Track for interruption
    scheduledSources.push(src);
    isSpeaking = true;
    setStatus("speaking", "Newsie is talking...");

    src.onended = () => {
      // Remove from tracked sources
      const idx = scheduledSources.indexOf(src);
      if (idx > -1) scheduledSources.splice(idx, 1);

      // If no more audio scheduled, switch to listening
      if (scheduledSources.length === 0) {
        isSpeaking = false;
        if (isConnected) setStatus("listening", "Listening...");
      }
    };
  }

  // ── UI State ─────────────────────────────────────────────────────────
  function setStatus(state, text) {
    if (!voiceStatus) return;
    voiceStatus.textContent = text;
    voiceStatus.className = "voice-status";
    if (state) voiceStatus.classList.add(`voice-status--${state}`);

    // Update aura ring
    if (auraPulse) {
      auraPulse.className = "voice-aura-ring";
      if (state === "listening")
        auraPulse.classList.add("voice-aura--listening");
      if (state === "speaking") auraPulse.classList.add("voice-aura--speaking");
    }
  }
})();

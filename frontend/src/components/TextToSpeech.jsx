import { useEffect, useRef } from 'react';

/**
 * Reusable TextToSpeech component
 * Automatically cancels ongoing speech when text changes.
 * Keeps utterance in reference to avoid Chrome garbage collection bugs.
 */
export default function TextToSpeech({ text, onEnd }) {
  const synthUtteranceRef = useRef(null);
  const chromePatchRef = useRef(null);

  useEffect(() => {
    if (!text || !window.speechSynthesis) return;

    console.log('[TextToSpeech] Preparing to speak text:', text.substring(0, 40) + '...');

    // Clear any existing Patch
    if (chromePatchRef.current) {
      clearInterval(chromePatchRef.current);
      chromePatchRef.current = null;
    }

    // DO NOT window.speechSynthesis.cancel() here! It causes a bug in Safari/Chrome if you cancel and speak instantly.
    // Cleanup function below handles it.

    const speak = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        console.log('[TextToSpeech] Voices not loaded yet. Waiting for onvoiceschanged...');
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          speak();
        };
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      synthUtteranceRef.current = utterance; // Prevent GC bug
      
      utterance.lang = 'en-US';
      utterance.rate = 1.05;
      utterance.pitch = 1;
      utterance.volume = 1; // Explicitly set volume to prevent silence bug

      const preferred =
        voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')) ||
        voices.find((v) => v.lang.startsWith('en-US')) ||
        voices.find((v) => v.lang.startsWith('en'));
      
      if (preferred) {
        utterance.voice = preferred;
      }
      
      console.log('[TextToSpeech] Triggering speech with voice:', utterance.voice?.name ?? 'default');

      // Chrome bug: Speech synthesis stops working if the string is very long (pauses after 15s)
      // We fix this by calling pause/resume every 10 seconds.
      chromePatchRef.current = setInterval(() => {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 10_000);

      const cleanup = () => {
        if (chromePatchRef.current) {
          clearInterval(chromePatchRef.current);
          chromePatchRef.current = null;
        }
      };

      utterance.onstart = () => {
        console.log('[TextToSpeech] Synthesis started.');
      };

      utterance.onend = () => {
        console.log('[TextToSpeech] Synthesis normally ended.');
        cleanup();
        if (onEnd) onEnd();
      };
      
      utterance.onerror = (e) => {
        cleanup();
        if (e.error === 'canceled' || e.error === 'interrupted') {
          console.log('[TextToSpeech] Synthesis canceled explicitly.');
          return;
        }
        console.warn('[TextToSpeech] Synthesis error:', e);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    };


    // Execute the speech immediately to stay within the browser's user gesture trust window
    speak();

    return () => {
      if (chromePatchRef.current) {
        clearInterval(chromePatchRef.current);
        chromePatchRef.current = null;
      }
      window.speechSynthesis.cancel();
      synthUtteranceRef.current = null;
    };
  }, [text, onEnd]);

  return null; // This component handles audio logic, renders nothing
}

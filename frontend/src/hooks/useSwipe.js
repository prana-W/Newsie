import { useRef } from "react";

export function useSwipe({ onSwipeUp, onSwipeDown, onSwipeRight, threshold = 50 }) {
  const startX = useRef(null);
  const startY = useRef(null);

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;

    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy < -threshold) onSwipeUp?.();
      else if (dy > threshold) onSwipeDown?.();
    } else {
      if (dx > threshold) onSwipeRight?.();
    }

    startX.current = null;
    startY.current = null;
  };

  return { onTouchStart, onTouchEnd };
}
import {useRef} from 'react';

export function useSwipe({
  onSwipeUp,
  onSwipeDown,
  onSwipeRight,
  onSwipeLeft,
  threshold = 50,
}) {
  const startX = useRef(null);
  const startY = useRef(null);
  const lastX = useRef(null);
  const lastY = useRef(null);

  const reset = () => {
    startX.current = null;
    startY.current = null;
    lastX.current = null;
    lastY.current = null;
  };

  const onTouchStart = (e) => {
    if (!e.touches?.length) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    lastX.current = startX.current;
    lastY.current = startY.current;
  };

  const onTouchMove = (e) => {
    if (
      startX.current === null ||
      startY.current === null ||
      !e.touches?.length
    ) {
      return;
    }

    lastX.current = e.touches[0].clientX;
    lastY.current = e.touches[0].clientY;

    // Prevent browser pull-to-refresh / native page pan from swallowing downward swipes.
    const dx = lastX.current - startX.current;
    const dy = lastY.current - startY.current;
    if ((Math.abs(dx) > 8 || Math.abs(dy) > 8) && e.cancelable) {
      e.preventDefault();
    }
  };

  const onTouchEnd = (e) => {
    if (startX.current === null || startY.current === null) return;

    const endX = e.changedTouches?.[0]?.clientX ?? lastX.current;
    const endY = e.changedTouches?.[0]?.clientY ?? lastY.current;
    if (endX === null || endY === null) {
      reset();
      return;
    }

    const dx = endX - startX.current;
    const dy = endY - startY.current;

    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy < -threshold) onSwipeUp?.();
      else if (dy > threshold) onSwipeDown?.();
    } else {
      if (dx > threshold) onSwipeRight?.();
      else if (dx < -threshold) onSwipeLeft?.();
    }

    reset();
  };

  const onTouchCancel = () => {
    reset();
  };

  return {onTouchStart, onTouchMove, onTouchEnd, onTouchCancel};
}
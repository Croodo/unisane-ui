import { useEffect, useRef } from 'react';

/**
 * Hook to lock body scroll while preventing layout shift.
 * Calculates scrollbar width and adds equivalent padding to compensate.
 */
export function useScrollLock(locked: boolean) {
  const scrollbarWidthRef = useRef(0);

  useEffect(() => {
    if (locked) {
      // Calculate scrollbar width before hiding it
      scrollbarWidthRef.current = window.innerWidth - document.documentElement.clientWidth;

      // Store original styles
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // Apply scroll lock with compensation
      document.body.style.overflow = 'hidden';
      if (scrollbarWidthRef.current > 0) {
        document.body.style.paddingRight = `${scrollbarWidthRef.current}px`;
      }

      return () => {
        // Restore original styles
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [locked]);

  return scrollbarWidthRef.current;
}

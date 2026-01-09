/**
 * useSafeRAF - Safe requestAnimationFrame hook with automatic cleanup
 *
 * Prevents memory leaks by canceling RAF callbacks when component unmounts.
 * All RAF callbacks scheduled through this hook are automatically cleaned up.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { requestFrame, cancelFrame, cancelAllFrames } = useSafeRAF();
 *
 *   const handleScroll = () => {
 *     requestFrame(() => {
 *       // This will be canceled if component unmounts
 *       updateScrollPosition();
 *     });
 *   };
 *
 *   return <div onScroll={handleScroll}>...</div>;
 * }
 * ```
 */

import { useRef, useCallback, useEffect } from "react";

export interface UseSafeRAFReturn {
  /** Schedule a callback to run on next animation frame. Returns frame ID for cancellation. */
  requestFrame: (callback: FrameRequestCallback) => number;
  /** Cancel a specific frame by ID */
  cancelFrame: (id: number) => void;
  /** Cancel all pending frames */
  cancelAllFrames: () => void;
  /** Check if a specific frame is pending */
  isFramePending: (id: number) => boolean;
  /** Get count of pending frames */
  pendingCount: () => number;
}

/**
 * Hook that provides safe requestAnimationFrame with automatic cleanup on unmount.
 *
 * Features:
 * - Automatic cancellation of all pending frames on unmount
 * - Individual frame cancellation
 * - Bulk cancellation of all frames
 * - Frame tracking for debugging
 *
 * @returns Object with requestFrame, cancelFrame, cancelAllFrames, isFramePending, pendingCount
 */
export function useSafeRAF(): UseSafeRAFReturn {
  // Track all pending frame IDs
  const pendingFramesRef = useRef<Set<number>>(new Set());
  // Track if component is mounted
  const isMountedRef = useRef(true);

  // Cleanup all frames on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Cancel all pending frames
      pendingFramesRef.current.forEach((id) => {
        cancelAnimationFrame(id);
      });
      pendingFramesRef.current.clear();
    };
  }, []);

  const requestFrame = useCallback((callback: FrameRequestCallback): number => {
    // If already unmounted, return -1 to indicate no frame was scheduled
    if (!isMountedRef.current) {
      return -1;
    }

    const id = requestAnimationFrame((time) => {
      // Remove from pending set before calling callback
      pendingFramesRef.current.delete(id);

      // Only call callback if still mounted
      if (isMountedRef.current) {
        callback(time);
      }
    });

    pendingFramesRef.current.add(id);
    return id;
  }, []);

  const cancelFrame = useCallback((id: number): void => {
    if (id !== -1 && pendingFramesRef.current.has(id)) {
      cancelAnimationFrame(id);
      pendingFramesRef.current.delete(id);
    }
  }, []);

  const cancelAllFrames = useCallback((): void => {
    pendingFramesRef.current.forEach((id) => {
      cancelAnimationFrame(id);
    });
    pendingFramesRef.current.clear();
  }, []);

  const isFramePending = useCallback((id: number): boolean => {
    return pendingFramesRef.current.has(id);
  }, []);

  const pendingCount = useCallback((): number => {
    return pendingFramesRef.current.size;
  }, []);

  return {
    requestFrame,
    cancelFrame,
    cancelAllFrames,
    isFramePending,
    pendingCount,
  };
}

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Create a RAF-based throttle function that automatically cleans up.
 * Useful for scroll/resize handlers.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { throttledFn, cancel } = useRAFThrottle((scrollTop: number) => {
 *     console.log('Scroll position:', scrollTop);
 *   });
 *
 *   return <div onScroll={(e) => throttledFn(e.currentTarget.scrollTop)}>...</div>;
 * }
 * ```
 */
export interface UseRAFThrottleReturn<T extends (...args: unknown[]) => void> {
  /** Throttled function - only executes once per animation frame */
  throttledFn: T;
  /** Cancel any pending execution */
  cancel: () => void;
  /** Check if there's a pending execution */
  isPending: () => boolean;
}

export function useRAFThrottle<T extends (...args: unknown[]) => void>(
  callback: T
): UseRAFThrottleReturn<T> {
  const { requestFrame, cancelFrame, isFramePending } = useSafeRAF();
  const frameIdRef = useRef<number>(-1);
  const argsRef = useRef<unknown[]>([]);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledFn = useCallback(
    ((...args: unknown[]) => {
      argsRef.current = args;

      // If no frame pending, schedule one
      if (frameIdRef.current === -1 || !isFramePending(frameIdRef.current)) {
        frameIdRef.current = requestFrame(() => {
          frameIdRef.current = -1;
          callbackRef.current(...argsRef.current);
        });
      }
    }) as T,
    [requestFrame, isFramePending]
  );

  const cancel = useCallback(() => {
    if (frameIdRef.current !== -1) {
      cancelFrame(frameIdRef.current);
      frameIdRef.current = -1;
    }
  }, [cancelFrame]);

  const isPending = useCallback(() => {
    return frameIdRef.current !== -1 && isFramePending(frameIdRef.current);
  }, [isFramePending]);

  return { throttledFn, cancel, isPending };
}

/**
 * Execute a callback on the next animation frame, with automatic cleanup.
 * Simpler API for one-off RAF calls.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const scheduleUpdate = useRAFCallback(() => {
 *     // Runs on next animation frame
 *     measureLayout();
 *   });
 *
 *   return <button onClick={scheduleUpdate}>Measure</button>;
 * }
 * ```
 */
export function useRAFCallback(callback: () => void): () => void {
  const { requestFrame } = useSafeRAF();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(() => {
    requestFrame(() => {
      callbackRef.current();
    });
  }, [requestFrame]);
}

export default useSafeRAF;

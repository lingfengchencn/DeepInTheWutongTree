import { useCallback, useEffect, useRef, useState } from 'react';

interface SplashOptions {
  minDuration?: number;
  maxDuration?: number;
  onTimeout?: () => void;
}

interface SplashState {
  visible: boolean;
  progress: number;
  markReady: () => void;
}

export const useSplashController = (
  { minDuration = 3000, maxDuration = 6000, onTimeout }: SplashOptions = {}
): SplashState => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const visibleRef = useRef(true);
  const startRef = useRef(Date.now());
  const loadedRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  const scheduleTimeout = useCallback((handler: () => void, delay: number) => {
    if (typeof window === 'undefined') {
      return 0;
    }
    return window.setTimeout(handler, delay);
  }, []);

  const scheduleFrame = useCallback((cb: FrameRequestCallback) => {
    if (typeof window === 'undefined') {
      return 0;
    }
    if (typeof window.requestAnimationFrame === 'function') {
      return window.requestAnimationFrame(cb);
    }
    return scheduleTimeout(() => cb(Date.now()), 16);
  }, [scheduleTimeout]);

  const cancelFrame = useCallback((id: number | null) => {
    if (id === null) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    if (typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(id);
    } else {
      window.clearTimeout(id);
    }
  }, []);

  const clearAll = useCallback(() => {
    if (typeof window !== 'undefined') {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    }
    timeoutsRef.current = [];
    if (rafRef.current) {
      cancelFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [cancelFrame]);

  const hideSplash = useCallback(() => {
    visibleRef.current = false;
    setVisible(false);
    setProgress(100);
    clearAll();
  }, [clearAll]);

  useEffect(() => {
    startRef.current = Date.now();
    visibleRef.current = true;
    loadedRef.current = false;
    setProgress(0);

    const maxTimer = scheduleTimeout(() => {
      if (visibleRef.current) {
        if (onTimeout) {
          onTimeout();
        }
        hideSplash();
      }
    }, maxDuration);

    timeoutsRef.current.push(maxTimer);

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const baseRatio = Math.min(elapsed / minDuration, 1);
      const target = loadedRef.current ? 100 : Math.min(baseRatio * 100, 92);

      setProgress((prev) => (target > prev ? target : prev));

      if (visibleRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = scheduleFrame(tick);

    return () => {
      clearAll();
    };
  }, [clearAll, hideSplash, maxDuration, minDuration, onTimeout, scheduleFrame]);

  const markReady = useCallback(() => {
    if (loadedRef.current || !visibleRef.current) {
      return;
    }
    loadedRef.current = true;

    setProgress((prev) => (prev < 96 ? 96 : prev));

    const elapsed = Date.now() - startRef.current;
    const remaining = minDuration - elapsed;
    const delay = remaining > 0 ? remaining : 250;

    const timer = scheduleTimeout(() => {
      if (visibleRef.current) {
        hideSplash();
      }
    }, delay);

    timeoutsRef.current.push(timer);
  }, [hideSplash, minDuration, scheduleTimeout]);

  return {
    visible,
    progress: Math.min(progress, 100),
    markReady
  };
};

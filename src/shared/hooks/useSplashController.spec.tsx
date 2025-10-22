import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSplashController } from './useSplashController';

describe('useSplashController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('respects minimum duration before hiding after ready', () => {
    const { result } = renderHook(() => useSplashController({ minDuration: 3000, maxDuration: 6000 }));

    act(() => {
      result.current.markReady();
    });

    act(() => {
      vi.advanceTimersByTime(2800);
    });

    expect(result.current.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.visible).toBe(false);
    expect(result.current.progress).toBe(100);
  });

  it('forces hide once max duration elapses', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useSplashController({ minDuration: 3000, maxDuration: 3500, onTimeout })
    );

    act(() => {
      vi.advanceTimersByTime(3600);
    });

    expect(result.current.visible).toBe(false);
    expect(onTimeout).toHaveBeenCalledOnce();
  });
});

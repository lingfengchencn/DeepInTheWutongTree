import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScriptRunner } from './useScriptRunner';
import { mockAiService } from '../backend/mockAiService';
import type { ConversationTurn } from '../types';

describe('useScriptRunner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('pushes turns to mock backend sequentially', () => {
    const script: ConversationTurn[] = [
      { character: 'AI', text: '欢迎来到梧桐深处。', audio: '' },
      { character: 'user', text: '带我去武康大楼。', audio: '' }
    ];

    const listener = vi.fn();
    const unsubscribe = mockAiService.subscribe(listener);

    renderHook(() => useScriptRunner(script));

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[0][0].text).toContain('梧桐深处');
    expect(listener.mock.calls[1][0].text).toContain('武康大楼');
  });

  it('stops after navigateTo event', () => {
    const script: ConversationTurn[] = [
      { character: 'AI', text: '准备跳转。', audio: '', navigateTo: 'house/wukang-building' },
      { character: 'AI', text: '不会播放的条目', audio: '' }
    ];

    const listener = vi.fn();
    const unsubscribe = mockAiService.subscribe(listener);

    renderHook(() => useScriptRunner(script));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].navigateTo).toBe('house/wukang-building');
  });
});

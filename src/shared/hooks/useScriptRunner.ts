import { useCallback, useEffect, useRef, useState } from 'react';
import { mockAiService } from '../backend/mockAiService';
import { useAiControlStore } from '../state/useAiControlStore';
import type { ConversationTurn } from '../types';

interface ScriptRunnerOptions {
  autoStart?: boolean;
  resetKey?: unknown;
}

interface ScriptRunnerState {
  current?: ConversationTurn;
  isPlaying: boolean;
  currentIndex: number;
  stop: () => void;
}

const DEFAULT_DELAY = 1600;

export const useScriptRunner = (
  script: ConversationTurn[] | undefined,
  { autoStart = true, resetKey }: ScriptRunnerOptions = {}
): ScriptRunnerState => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const queueRef = useRef<ConversationTurn[]>([]);
  const timeoutRef = useRef<number>();

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    setIsPlaying(false);
    setCurrentIndex(-1);
    useAiControlStore.setState({ playing: false, waitingForAi: false });
  }, [clearTimers]);

  const playEntry = useCallback(
    (index: number) => {
      const queue = queueRef.current;
      if (!queue.length || index >= queue.length) {
        stop();
        return;
      }

      const entry = queue[index];
      setCurrentIndex(index);
      setIsPlaying(true);
      useAiControlStore.setState({ playing: true, waitingForAi: false });

      mockAiService.push(entry);

      const delay = entry.delayMs ?? DEFAULT_DELAY;
      timeoutRef.current = window.setTimeout(() => {
        if (entry.navigateTo) {
          useAiControlStore.setState({ lastNavigation: entry.navigateTo });
          stop();
        } else {
          playEntry(index + 1);
        }
      }, delay);
    },
    [stop]
  );

  useEffect(() => {
    queueRef.current = script ?? [];
    stop();
    if (autoStart && script && script.length) {
      playEntry(0);
    }
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, resetKey, script]);

  return {
    current: currentIndex >= 0 ? queueRef.current[currentIndex] : undefined,
    isPlaying,
    currentIndex,
    stop
  };
};

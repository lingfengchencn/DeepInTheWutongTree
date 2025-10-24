import { create } from 'zustand';

interface AiControlState {
  playing: boolean;
  waitingForAi: boolean;
  lastNavigation?: string;
  reset: () => void;
  interruptToken: number;
}

export const useAiControlStore = create<AiControlState>((set) => ({
  playing: false,
  waitingForAi: false,
  lastNavigation: undefined,
  interruptToken: 0,
  reset: () =>
    set((state) => ({
      playing: false,
      waitingForAi: false,
      lastNavigation: undefined,
      interruptToken: state.interruptToken + 1
    }))
}));

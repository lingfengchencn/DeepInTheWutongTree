import type { ConversationTurn } from '../types';

let listeners: Array<(turn: ConversationTurn) => void> = [];

export const mockAiService = {
  subscribe(listener: (turn: ConversationTurn) => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((item) => item !== listener);
    };
  },
  push(turn: ConversationTurn) {
    listeners.forEach((listener) => listener(turn));
  }
};

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  HouseProfile,
  Stage,
  TranscriptEntry
} from '../types';

interface AppState {
  houses: HouseProfile[];
  currentHouse: HouseProfile | null;
  stage: Stage;
  activePanel: 'archive' | 'community' | 'valuation';
  offlineMode: boolean;
  transcript: TranscriptEntry[];
  initialize: (houses: HouseProfile[]) => void;
  toggleOfflineMode: () => void;
  focusPanel: (panel: AppState['activePanel']) => void;
  moveToHouse: (houseId: string, narrative?: string) => void;
  enterInterior: () => void;
  showCommunity: () => void;
  showValuation: () => void;
  guideSpeak: (text: string) => void;
  userSpeak: (text: string) => void;
  resetTranscript: () => void;
}

const guideEntry = (text: string): TranscriptEntry => ({
  id: nanoid(),
  speaker: 'guide',
  text,
  timestamp: Date.now()
});

const userEntry = (text: string): TranscriptEntry => ({
  id: nanoid(),
  speaker: 'user',
  text,
  timestamp: Date.now()
});

export const useAppStore = create<AppState>((set, get) => ({
  houses: [],
  currentHouse: null,
  stage: 'idle',
  activePanel: 'archive',
  offlineMode: true,
  transcript: [],
  initialize: (houses) => {
    if (!houses.length) {
      return;
    }

    set({
      houses,
      currentHouse: houses[0],
      stage: 'intro',
      transcript: [guideEntry('梧桐导览员上线，准备带你穿梭上海的洋房记忆。')]
    });
  },
  toggleOfflineMode: () => {
    const offlineMode = !get().offlineMode;
    set({ offlineMode });
    set({
      transcript: [
        ...get().transcript,
        guideEntry(offlineMode ? '切换至离线脚本模式，所有讲解将自动播放。' : '恢复在线互动，可随时对我说“开始导览”。')
      ]
    });
  },
  focusPanel: (panel) => set({ activePanel: panel }),
  moveToHouse: (houseId) => {
    const houses = get().houses;
    const target = houses.find((item) => item.id === houseId) ?? houses[0];
    set({ currentHouse: target, stage: 'touring', activePanel: 'archive' });
    set({
      transcript: [
        ...get().transcript,
        guideEntry(`已抵达${target.name}，这座${target.style}风格的建筑建于${target.yearBuilt}年。`)
      ]
    });
  },
  enterInterior: () => {
    const current = get().currentHouse;
    if (!current) return;

    set({ stage: 'interior' });
    set({
      transcript: [
        ...get().transcript,
        guideEntry(`正在切换至${current.name}的室内视角，请留意墙面的复原影像。`)
      ]
    });
  },
  showCommunity: () => {
    set({ activePanel: 'community', stage: 'community' });
    set({
      transcript: [
        ...get().transcript,
        guideEntry('为你打开社区共创面板，这里聚合了打卡、点评与活动报名。')
      ]
    });
  },
  showValuation: () => {
    set({ activePanel: 'valuation', stage: 'valuation' });
    const current = get().currentHouse;
    if (!current) return;
    set({
      transcript: [
        ...get().transcript,
        guideEntry(
          `这是${current.name}的投资评估摘要，收藏评级${current.valuation.collectionRating}分，保值指数${current.valuation.preservationIndex}。`
        )
      ]
    });
  },
  guideSpeak: (text) =>
    set({ transcript: [...get().transcript, guideEntry(text)] }),
  userSpeak: (text) =>
    set({ transcript: [...get().transcript, userEntry(text)] }),
  resetTranscript: () =>
    set({ transcript: [guideEntry('对话记录已清空，可以重新开始导览。')] })
}));

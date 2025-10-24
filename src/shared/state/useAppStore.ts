import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { HouseProfile, Stage, TranscriptEntry } from '../types';

type TranscriptExtras = Partial<Omit<TranscriptEntry, 'id' | 'speaker' | 'text' | 'timestamp'>>;

interface AppState {
  houses: HouseProfile[];
  currentHouse: HouseProfile | null;
  stage: Stage;
  view: 'home' | 'house';
  activePanel: 'archive' | 'community' | 'valuation';
  offlineMode: boolean;
  transcript: TranscriptEntry[];
  highlightedHouseId: string | null;
  activeVideo: string | null;
  initialize: (houses: HouseProfile[]) => void;
  toggleOfflineMode: () => void;
  focusPanel: (panel: AppState['activePanel']) => void;
  moveToHouse: (houseId: string, narrative?: string) => void;
  enterInterior: () => void;
  showCommunity: () => void;
  showValuation: () => void;
  goHome: () => void;
  setHighlightedHouse: (houseId: string | null) => void;
  guideSpeak: (text: string, extras?: TranscriptExtras) => void;
  guideRequest: (text: string, navigationTarget?: string) => void;
  userSpeak: (text: string, extras?: TranscriptExtras) => void;
  recordNavigationIntent: (houseId: string) => void;
  resetTranscript: () => void;
  setActiveVideo: (video: string | null) => void;
}

const guideEntry = (text: string, extras: TranscriptExtras = {}): TranscriptEntry => ({
  id: nanoid(),
  speaker: 'guide',
  text,
  timestamp: Date.now(),
  ...extras
});

const userEntry = (text: string, extras: TranscriptExtras = {}): TranscriptEntry => ({
  id: nanoid(),
  speaker: 'user',
  text,
  timestamp: Date.now(),
  ...extras
});

const appendEntry = (entries: TranscriptEntry[], entry: TranscriptEntry) => {
  const last = entries[entries.length - 1];
  if (
    last &&
    last.speaker === entry.speaker &&
    last.text === entry.text &&
    last.mode === entry.mode &&
    last.status === entry.status &&
    last.navigationTarget === entry.navigationTarget
  ) {
    return entries;
  }
  return [...entries, entry];
};

const resolvePendingGuide = (entries: TranscriptEntry[]) =>
  entries.map((item) => (item.speaker === 'guide' && item.status === 'pending' ? { ...item, status: 'resolved' } : item));

export const useAppStore = create<AppState>((set, get) => ({
  houses: [],
  currentHouse: null,
  stage: 'home',
  view: 'home',
  activePanel: 'archive',
  offlineMode: false,
  transcript: [],
  highlightedHouseId: null,
  activeVideo: null,
  initialize: (houses) => {
    if (!houses.length) {
      return;
    }

    set({
      houses,
      currentHouse: houses[0],
      stage: 'home',
      view: 'home',
      transcript: [guideEntry('梧桐导览员上线，准备带你穿梭上海的洋房记忆。', { mode: 'online' })]
    });
  },
  toggleOfflineMode: () =>
    set((state) => {
      const offlineMode = !state.offlineMode;
      const transcript = appendEntry(
        state.transcript,
        guideEntry(
          offlineMode ? '切换至离线脚本模式，所有讲解将自动播放。' : '恢复在线互动，可随时对我说“开始导览”。',
          { mode: offlineMode ? 'offline' : 'online' }
        )
      );
      return { offlineMode, transcript };
    }),
  focusPanel: (panel) => set({ activePanel: panel }),
  moveToHouse: (houseId, narrative) =>
    set((state) => {
      const target = state.houses.find((item) => item.id === houseId) ?? state.houses[0];
      console.log('[AppStore] moveToHouse invoked', {
        requestId: houseId,
        narrativeProvided: Boolean(narrative),
        foundId: target?.id,
        stageBefore: state.stage,
        viewBefore: state.view
      });
      if (!target) {
        console.warn('[AppStore] moveToHouse aborted: no target available');
        return {};
      }

      const transcript = appendEntry(
        state.transcript,
        guideEntry(
          narrative ?? `已抵达${target.name}，这座${target.style}风格的建筑建于${target.yearBuilt}年。`,
          { navigationTarget: target.name }
        )
      );

      const nextState = {
        currentHouse: target,
        stage: 'touring' as Stage,
        activePanel: 'archive' as AppState['activePanel'],
        view: 'house' as AppState['view'],
        highlightedHouseId: target.id,
        activeVideo: null,
        transcript
      };
      console.log('[AppStore] moveToHouse committed', {
        currentHouse: nextState.currentHouse.id,
        stageAfter: nextState.stage,
        viewAfter: nextState.view
      });
      return nextState;
    }),
  goHome: () => {
    const current = get().currentHouse;
    set({
      stage: 'home',
      view: 'home',
      activePanel: 'archive',
      highlightedHouseId: current?.id ?? null,
      activeVideo: null
    });
  },
  setHighlightedHouse: (houseId) => set({ highlightedHouseId: houseId }),
  enterInterior: () => {
    const current = get().currentHouse;
    if (!current) return;

    set((state) => ({
      stage: 'interior',
      activeVideo: null,
      transcript: appendEntry(
        state.transcript,
        guideEntry(`正在切换至${current.name}的室内视角，请留意墙面的复原影像。`)
      )
    }));
  },
  showCommunity: () =>
    set((state) => ({
      activePanel: 'community',
      stage: 'community',
      activeVideo: null,
      transcript: appendEntry(
        state.transcript,
        guideEntry('为你打开社区共创面板，这里聚合了打卡、点评与活动报名。')
      )
    })),
  showValuation: () =>
    set((state) => {
      const current = state.currentHouse;
      if (!current) {
        return { activePanel: 'valuation', stage: 'valuation', activeVideo: null };
      }

      return {
        activePanel: 'valuation',
        stage: 'valuation',
        activeVideo: null,
        transcript: appendEntry(
          state.transcript,
          guideEntry(
            `这是${current.name}的投资评估摘要，收藏评级${current.valuation.collectionRating}分，保值指数${current.valuation.preservationIndex}。`
          )
        )
      };
    }),
  guideSpeak: (text, extras) =>
    set((state) => {
      const resolved = resolvePendingGuide(state.transcript);
      return { transcript: appendEntry(resolved, guideEntry(text, extras)) };
    }),
  guideRequest: (text, navigationTarget) =>
    set((state) => ({
      transcript: appendEntry(
        state.transcript,
        guideEntry(text, { mode: 'online', status: 'pending', navigationTarget })
      )
    })),
  userSpeak: (text, extras) =>
    set((state) => ({
      transcript: appendEntry(state.transcript, userEntry(text, extras))
    })),
  recordNavigationIntent: (houseId) =>
    set((state) => {
      const target = state.houses.find((item) => item.id === houseId);
      const label = target?.name ?? houseId;
      return {
        transcript: appendEntry(
          state.transcript,
          userEntry(`导航到${label}`, { navigationTarget: label, mode: 'online' })
        )
      };
    }),
  resetTranscript: () =>
    set({ transcript: [guideEntry('对话记录已清空，可以重新开始导览。', { mode: 'online' })] }),
  setActiveVideo: (video) => set({ activeVideo: video })
}));

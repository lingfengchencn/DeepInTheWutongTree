import { useEffect } from 'react';
import { mockAiService } from '../backend/mockAiService';
import { useAppStore } from '../state/useAppStore';
import { useAiControlStore } from '../state/useAiControlStore';
import type { ConversationTurn } from '../types';

export const useAiBackend = () => {
  const guideSpeak = useAppStore((state) => state.guideSpeak);
  const userSpeak = useAppStore((state) => state.userSpeak);
  const moveToHouse = useAppStore((state) => state.moveToHouse);
  const goHome = useAppStore((state) => state.goHome);
  const setActiveVideo = useAppStore((state) => state.setActiveVideo);
  const setHighlightedHouse = useAppStore((state) => state.setHighlightedHouse);

  useEffect(() => {
    const unsubscribe = mockAiService.subscribe((turn: ConversationTurn) => {
      useAiControlStore.setState({ playing: true, waitingForAi: false });

      const appState = useAppStore.getState();
      let navigationLabel: string | undefined;
      if (turn.navigateTo) {
        if (turn.navigateTo === 'home') {
          navigationLabel = '城市首页';
        } else if (turn.navigateTo.startsWith('house/')) {
          const [, houseId] = turn.navigateTo.split('/');
          if (houseId) {
            const target = appState.houses.find((item) => item.id === houseId);
            navigationLabel = target ? target.name : `house/${houseId}`;
          }
        } else {
          navigationLabel = turn.navigateTo;
        }
      }

      if (turn.character === 'AI') {
        guideSpeak(turn.text, { mode: 'online', navigationTarget: navigationLabel });
      } else {
        userSpeak(turn.text, { mode: 'online', navigationTarget: navigationLabel });
      }

      if (turn.highlightHouseId) {
        setHighlightedHouse(turn.highlightHouseId);
      }

      if (turn.video) {
        setActiveVideo(turn.video);
      }

      if (turn.navigateTo) {
        if (turn.navigateTo === 'home') {
          goHome();
        } else if (turn.navigateTo.startsWith('house/')) {
          const [, houseId] = turn.navigateTo.split('/');
          if (houseId) {
            moveToHouse(houseId);
          }
        }

        const label = navigationLabel ?? turn.navigateTo;
        useAiControlStore.setState({ lastNavigation: label, waitingForAi: false, playing: false });
      } else {
        useAiControlStore.setState({ playing: false });
      }
    });

    return () => {
      unsubscribe();
      useAiControlStore.setState({ playing: false, waitingForAi: false });
    };
  }, [guideSpeak, goHome, moveToHouse, setActiveVideo, setHighlightedHouse, userSpeak]);
};

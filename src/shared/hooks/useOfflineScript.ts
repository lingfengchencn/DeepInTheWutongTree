import { useEffect, useRef } from 'react';
import { useAppStore } from '../state/useAppStore';
import { offlineScript } from '../script/offlineScript';

export const useOfflineScript = () => {
  const offlineMode = useAppStore((state) => state.offlineMode);
  const moveToHouse = useAppStore((state) => state.moveToHouse);
  const enterInterior = useAppStore((state) => state.enterInterior);
  const showCommunity = useAppStore((state) => state.showCommunity);
  const showValuation = useAppStore((state) => state.showValuation);
  const guideSpeak = useAppStore((state) => state.guideSpeak);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timeouts.current.forEach((timeout) => clearTimeout(timeout));
    timeouts.current = [];

    if (!offlineMode) {
      return;
    }

    offlineScript.forEach((step) => {
      const handle = setTimeout(() => {
        switch (step.action) {
          case 'announce': {
            if (step.payload?.text) {
              guideSpeak(step.payload.text);
            }
            break;
          }
          case 'moveToHouse': {
            if (step.payload?.houseId) {
              moveToHouse(step.payload.houseId);
            }
            break;
          }
          case 'enterInterior':
            enterInterior();
            break;
          case 'showCommunity':
            showCommunity();
            break;
          case 'showValuation':
            showValuation();
            break;
          default:
            break;
        }
      }, step.delay);
      timeouts.current.push(handle);
    });

    return () => {
      timeouts.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, [offlineMode, guideSpeak, moveToHouse, enterInterior, showCommunity, showValuation]);
};

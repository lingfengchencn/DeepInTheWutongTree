import { useEffect, useMemo } from 'react';
import { ConversationOverlay } from './shared/components/ConversationOverlay';
import { MiniAppChrome } from './shared/components/MiniAppChrome';
import { SplashScreen } from './shared/components/SplashScreen';
import { useAppStore } from './shared/state/useAppStore';
import { loadHouseDataset } from './shared/data/loadHouses';
import { useOfflineScript } from './shared/hooks/useOfflineScript';
import { useSplashController } from './shared/hooks/useSplashController';
import { TourScene } from './tour/components/TourScene';
import { ArchivePanel } from './archive/ArchivePanel';
import { CommunityPanel } from './community/CommunityPanel';
import { ValuationPanel } from './valuation/ValuationPanel';

const App = () => {
  const initialize = useAppStore((state) => state.initialize);
  const activePanel = useAppStore((state) => state.activePanel);
  const currentHouse = useAppStore((state) => state.currentHouse);
  const stage = useAppStore((state) => state.stage);
  const offlineMode = useAppStore((state) => state.offlineMode);
  const transcript = useAppStore((state) => state.transcript);
  const scriptedSteps = useMemo(() => loadHouseDataset(), []);
  const { visible: splashVisible, progress: splashProgress, markReady } = useSplashController({
    minDuration: 3000,
    maxDuration: 6000
  });

  useEffect(() => {
    initialize(scriptedSteps.houses);
    markReady();
  }, [initialize, markReady, scriptedSteps]);

  useOfflineScript();

  return (
    <MiniAppChrome>
      <div className="app-layout">
        <section className="scene-column">
          <TourScene
            house={currentHouse}
            stage={stage}
            offlineFallback={offlineMode}
            transcript={transcript}
          />
        </section>
        <section className="panel-column">
          {activePanel === 'archive' && <ArchivePanel house={currentHouse} />}
          {activePanel === 'community' && <CommunityPanel house={currentHouse} />}
          {activePanel === 'valuation' && <ValuationPanel house={currentHouse} />}
        </section>
      </div>
      <ConversationOverlay />
      {splashVisible && <SplashScreen progress={splashProgress} />}
    </MiniAppChrome>
  );
};

export default App;

import { useEffect, useMemo } from 'react';
import { MiniAppChrome } from './shared/components/MiniAppChrome';
import { SplashScreen } from './shared/components/SplashScreen';
import { useAppStore } from './shared/state/useAppStore';
import { loadHouseDataset } from './shared/data/loadHouses';
import { useOfflineScript } from './shared/hooks/useOfflineScript';
import { useSplashController } from './shared/hooks/useSplashController';
import { HomeMiniAppSection } from './home/HomeMiniAppSection';
import { HomeAiConsoleSection } from './home/HomeAiConsoleSection';
import { useAiBackend } from './shared/hooks/useAiBackend';

const App = () => {
  const initialize = useAppStore((state) => state.initialize);
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
  useAiBackend();

  return (
    <MiniAppChrome>
      <div className="home-content">
        <HomeMiniAppSection />
        <HomeAiConsoleSection />
      </div>
      {splashVisible && <SplashScreen progress={splashProgress} />}
    </MiniAppChrome>
  );
};

export default App;

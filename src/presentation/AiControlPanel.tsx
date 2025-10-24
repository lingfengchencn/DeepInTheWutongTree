import { useCallback } from 'react';
import { useAiControlStore } from '../shared/state/useAiControlStore';
import { useAppStore } from '../shared/state/useAppStore';
import { mockAiService } from '../shared/backend/mockAiService';
import type { ConversationTurn } from '../shared/types';
import './AiControlPanel.css';
import { ConversationOverlay } from '../shared/components/ConversationOverlay';

const manualTurn = (partial: Partial<ConversationTurn>): ConversationTurn => ({
  character: partial.character ?? 'AI',
  text: partial.text ?? '',
  audio: partial.audio ?? '',
  navigateTo: partial.navigateTo,
  highlightHouseId: partial.highlightHouseId,
  delayMs: partial.delayMs,
  action: partial.action,
  video: partial.video
});

const queueAiTurn = (turn: ConversationTurn, delay = 900) => {
  useAiControlStore.setState({ waitingForAi: true, playing: false });
  setTimeout(() => {
    mockAiService.push(turn);
  }, delay);
};

export const AiControlPanel = () => {
  const { playing, waitingForAi, lastNavigation } = useAiControlStore();
  const resetAi = useCallback(() => useAiControlStore.getState().reset(), []);
  const resetTranscript = useAppStore((state) => state.resetTranscript);
  const houses = useAppStore((state) => state.houses);
  const currentHouse = useAppStore((state) => state.currentHouse);
  const guideRequest = useAppStore((state) => state.guideRequest);
  const userSpeak = useAppStore((state) => state.userSpeak);
  const recordNavigationIntent = useAppStore((state) => state.recordNavigationIntent);
  const enterInterior = useAppStore((state) => state.enterInterior);

  const handleRefresh = () => {
    resetAi();
    useAiControlStore.setState({ waitingForAi: false, playing: false, lastNavigation: undefined });
    resetTranscript();
  };

  const handleHome = () => {
    resetAi();
    userSpeak('回到城市首页', { mode: 'online' });
    guideRequest('请求 Coze：返回城市地图');
    queueAiTurn(
      manualTurn({
        character: 'AI',
        text: '梧桐导览员带你回到城市地图入口。',
        navigateTo: 'home'
      })
    );
  };

  const handleHouse = () => {
    resetAi();
    const target = currentHouse ?? houses[0];
    if (!target) return;

    userSpeak(`介绍一下${target.name}`, { mode: 'online' });
    recordNavigationIntent(target.id);
    guideRequest(`请求 Coze：介绍一下${target.name}`, target.name);
    queueAiTurn(
      manualTurn({
        character: 'AI',
        text: `正在为你导航到${target.name}，准备播报重点故事。`,
        navigateTo: `house/${target.id}`,
        highlightHouseId: target.id
      })
    );
  };

  const handleInterior = () => {
    resetAi();
    const target = currentHouse ?? houses[0];
    if (!target) return;

    userSpeak(`带我进入${target.name}的室内`, { mode: 'online' });
    guideRequest(`请求 Coze：打开${target.name}的室内漫游`);
    enterInterior();
    queueAiTurn(
      manualTurn({
        character: 'AI',
        text: `带你进入${target.name}的室内漫游，感受修复后的细节。`,
        action: 'enterInterior'
      })
    );
  };

  const statusLabel = waitingForAi ? '请求 Coze 中…' : playing ? '脚本播放中' : '手动模式';

  return (
    <aside className="ai-panel">
      <header className="ai-panel-header">
        <div>
          <h2>AI 控制台</h2>
          <p>梧桐导览员随时待命</p>
        </div>
        <span className={`ai-status-badge ${waitingForAi ? 'ai-status-waiting' : 'ai-status-idle'}`}>
          {statusLabel}
        </span>
      </header>
      <section className="ai-status">
        <div>
          <strong>最后导航</strong>
          <span>{lastNavigation ?? '暂无'}</span>
        </div>
        <div>
          <strong>AI 状态</strong>
          <span>{statusLabel}</span>
        </div>
      </section>
      <section className="ai-controls">
        <button onClick={handleRefresh}>刷新</button>
        <button onClick={handleHome}>返回首页</button>
        <button onClick={handleHouse}>洋房导览</button>
        <button onClick={handleInterior}>进入室内</button>
      </section>
      <div className="conversation-wrapper">
        <ConversationOverlay />
      </div>
    </aside>
  );
};

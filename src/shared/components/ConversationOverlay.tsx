import { useMemo } from 'react';
import { useAppStore } from '../state/useAppStore';
import type { TranscriptEntry } from '../types';
import './ConversationOverlay.css';

const TranscriptLog = ({ transcript }: { transcript: TranscriptEntry[] }) => {
  return (
    <div className="transcript-log">
      {transcript.map((entry) => (
        <div key={entry.id} className={`log-item log-item-${entry.speaker}`}>
          <span className="speaker">{speakerLabel(entry.speaker)}</span>
          <span className="text">{entry.text}</span>
        </div>
      ))}
    </div>
  );
};

const speakerLabel = (speaker: TranscriptEntry['speaker']) => {
  switch (speaker) {
    case 'guide':
      return '梧桐导览员';
    case 'user':
      return '评委';
    default:
      return '系统';
  }
};

export const ConversationOverlay = () => {
  const transcript = useAppStore((state) => state.transcript);
  const toggleOfflineMode = useAppStore((state) => state.toggleOfflineMode);
  const offlineMode = useAppStore((state) => state.offlineMode);
  const moveToHouse = useAppStore((state) => state.moveToHouse);
  const enterInterior = useAppStore((state) => state.enterInterior);
  const showCommunity = useAppStore((state) => state.showCommunity);
  const showValuation = useAppStore((state) => state.showValuation);
  const userSpeak = useAppStore((state) => state.userSpeak);
  const houses = useAppStore((state) => state.houses);

  const [primaryHouse, secondaryHouse] = useMemo(() => houses.slice(0, 2), [houses]);

  return (
    <aside className="conversation-overlay">
      <div className="mascot">
        <div className={`mic ${offlineMode ? 'mic-offline' : 'mic-online'}`}>
          <div className="pulse" />
        </div>
        <header>
          <h1>梧桐导览员</h1>
          <p>语音指令 + 自动脚本，随时切换</p>
        </header>
      </div>
      <div className="quick-actions">
        <button
          className="chip"
          onClick={() => {
            if (!primaryHouse) return;
            userSpeak('开始导览');
            moveToHouse(primaryHouse.id);
          }}
        >
          开始导览
        </button>
        {secondaryHouse && (
          <button
            className="chip"
            onClick={() => {
              userSpeak(`带我去${secondaryHouse.name}`);
              moveToHouse(secondaryHouse.id);
            }}
          >
            切换到 {secondaryHouse.name}
          </button>
        )}
        <button
          className="chip"
          onClick={() => {
            userSpeak('看看里面');
            enterInterior();
          }}
        >
          看看里面
        </button>
        <button
          className="chip"
          onClick={() => {
            userSpeak('社区活动有什么');
            showCommunity();
          }}
        >
          打开社区
        </button>
        <button
          className="chip"
          onClick={() => {
            userSpeak('看看投资价值');
            showValuation();
          }}
        >
          查看估值
        </button>
      </div>
      <TranscriptLog transcript={transcript} />
      <div className="controls">
        <button className="primary" onClick={toggleOfflineMode}>
          {offlineMode ? '切换至在线互动' : '启用离线脚本'}
        </button>
      </div>
    </aside>
  );
};

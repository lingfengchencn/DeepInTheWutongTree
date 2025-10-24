import { useAppStore } from '../state/useAppStore';
import type { TranscriptEntry } from '../types';
import './ConversationOverlay.css';

const TranscriptLog = ({ transcript }: { transcript: TranscriptEntry[] }) => (
  <div className="transcript-log">
    {transcript.map((entry) => {
      const pending = entry.status === 'pending';
      return (
        <div
          key={entry.id}
          className={`log-item log-item-${entry.speaker}${pending ? ' log-item-pending' : ''}`}
        >
          <span className="speaker">{speakerLabel(entry)}</span>
          <span className="text">{entry.text}</span>
          {(entry.navigationTarget || pending || entry.mode === 'online') && (
            <div className="log-meta">
              {entry.navigationTarget && <span className="log-navigation">导航：{entry.navigationTarget}</span>}
              {pending && <span className="log-status">等待 Coze 返回…</span>}
              {!pending && entry.mode === 'online' && entry.speaker === 'guide' && (
                <span className="log-status">Coze 已响应</span>
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

const speakerLabel = (entry: TranscriptEntry) => {
  const suffix = entry.mode === 'online' ? ' · 在线' : entry.mode === 'offline' ? ' · 离线' : '';
  switch (entry.speaker) {
    case 'guide':
      return `梧桐导览员${suffix}`;
    case 'user':
      return `用户${suffix}`;
    default:
      return `系统${suffix}`;
  }
};

export const ConversationOverlay = () => {
  const transcript = useAppStore((state) => state.transcript);
  const toggleOfflineMode = useAppStore((state) => state.toggleOfflineMode);
  const offlineMode = useAppStore((state) => state.offlineMode);

  return (
    <aside className="conversation-overlay">
      <div className="mascot">
        <div className={`mic ${offlineMode ? 'mic-offline' : 'mic-online'}`}>
          <div className="pulse" />
        </div>
        <header>
          <h1>梧桐导览员</h1>
          <p>实时播报 · 语音记录</p>
        </header>
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

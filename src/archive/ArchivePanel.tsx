import type { HouseProfile } from '../shared/types';
import './ArchivePanel.css';

interface ArchivePanelProps {
  house: HouseProfile | null;
}

export const ArchivePanel = ({ house }: ArchivePanelProps) => {
  if (!house) {
    return <p>正在加载档案...</p>;
  }

  return (
    <div className="scroll-stack">
      <div className="section-card">
        <span className="badge">一房一档</span>
        <h2>{house.name} 档案</h2>
        <p>{house.address}</p>
        <p>建于 {house.yearBuilt} 年 · {house.style} · {house.floors} 层</p>
      </div>
      <div className="section-card">
        <h3>时间线</h3>
        {house.timeline.map((item) => (
          <div key={item.year} className="timeline-item">
            <strong>{item.year}</strong>
            <p>{item.event}</p>
          </div>
        ))}
      </div>
      <div className="section-card">
        <h3>故事摘录</h3>
        {house.narratives.map((story) => (
          <article key={story.title} className="story-card">
            <header>
              <h4>{story.title}</h4>
            </header>
            <p>{story.summary}</p>
            <ul>
              {story.media.map((asset) => (
                <li key={asset.title}>
                  <strong>{asset.title}</strong>
                  <span> · 来源：{asset.source}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="section-card">
        <h3>业主与运营</h3>
        {house.owners.map((owner) => (
          <p key={owner.name}>
            <strong>{owner.name}</strong> · {owner.role} · {owner.intention}
          </p>
        ))}
      </div>
    </div>
  );
};

import type { HouseProfile } from '../shared/types';
import './CommunityPanel.css';

interface CommunityPanelProps {
  house: HouseProfile | null;
}

export const CommunityPanel = ({ house }: CommunityPanelProps) => {
  if (!house) {
    return <p>正在拉取社区动态…</p>;
  }

  return (
    <div className="scroll-stack">
      <div className="section-card">
        <span className="badge">社区共创</span>
        <h2>{house.name} 活动</h2>
        {house.activities.map((activity) => (
          <article key={activity.id} className="activity-card">
            <header>
              <h3>{activity.title}</h3>
              <span className="tag">剩余 {activity.remaining}/{activity.slots}</span>
            </header>
            <p>{activity.date}</p>
            <p>{activity.description}</p>
            <button className="button">立即报名</button>
          </article>
        ))}
      </div>
      <div className="section-card">
        <h3>记忆墙</h3>
        <ul className="memory-wall">
          <li>
            <strong>🍃 @洋房守望者</strong>
            <p>今晨阳光透进骑楼，法式拱券像时间胶囊。打卡成功！</p>
          </li>
          <li>
            <strong>🎻 @午夜琴声</strong>
            <p>音乐会排练声又在楼梯间回荡，40年老琴修复后第一次公开亮相。</p>
          </li>
        </ul>
      </div>
    </div>
  );
};

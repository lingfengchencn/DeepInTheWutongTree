import type { HouseProfile } from '../shared/types';
import './ValuationPanel.css';

interface ValuationPanelProps {
  house: HouseProfile | null;
}

export const ValuationPanel = ({ house }: ValuationPanelProps) => {
  if (!house) {
    return <p>正在整理估值数据...</p>;
  }

  return (
    <div className="scroll-stack">
      <div className="section-card">
        <span className="badge">投资评估</span>
        <h2>{house.name} 估值指标</h2>
        <div className="metric-grid">
          <MetricCard label="收藏评级" value={`${house.valuation.collectionRating} 分`} tone="warm" />
          <MetricCard label="保值指数" value={`${house.valuation.preservationIndex} 分`} tone="cool" />
          <MetricCard label="租金回报" value={`${house.valuation.rentalYield}%`} tone="neutral" />
        </div>
        <p className="commentary">{house.valuation.commentary}</p>
      </div>
      <div className="section-card">
        <h3>AI 投资问答</h3>
        <div className="qa-block">
          <p className="question">评委：未来 5 年的保值风险是什么？</p>
          <p className="answer">
            梧桐导览员：{house.name} 坐落在风貌区核心，城市更新政策稳定，建议关注建筑维护基金及社区运营计划保持加分项。
          </p>
        </div>
        <div className="qa-block">
          <p className="question">评委：若作为文化资产持有，可否生成现金流？</p>
          <p className="answer">
            梧桐导览员：当前活动转化率 18%，结合共创场景，可打造会员制体验与定制导览，预计三年内稳定 4% 回报。
          </p>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: 'warm' | 'cool' | 'neutral';
}) => {
  return (
    <div className={`metric metric-${tone}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
};

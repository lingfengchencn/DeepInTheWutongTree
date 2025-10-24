import { useEffect, useMemo } from 'react';
import { useScriptRunner } from '../shared/hooks/useScriptRunner';
import { useAppStore } from '../shared/state/useAppStore';
import type { HouseProfile } from '../shared/types';
import './HomeInterior.css';

interface HomeInteriorProps {
  house: HouseProfile;
}

export const HomeInterior = ({ house }: HomeInteriorProps) => {
  const activeVideo = useAppStore((state) => state.activeVideo);
  const setActiveVideo = useAppStore((state) => state.setActiveVideo);

  const interiorScript = useMemo(
    () => house.script.detail.filter((turn) => turn.action !== 'enterInterior'),
    [house]
  );

  useScriptRunner(interiorScript, {
    autoStart: true,
    resetKey: `${house.id}-interior-script`
  });

  const primaryNarrative = useMemo(() => house.narratives[0], [house.narratives]);
  const otherNarratives = useMemo(() => house.narratives.slice(1), [house.narratives]);

  const heroImage = '/assets/gaolan/武康内部.png';

  useEffect(() => {
    if (!activeVideo && house.activities[0]?.id === 'moller-story-night') {
      setActiveVideo(house.activities[0]?.description ?? '');
    }
    return () => {
      setActiveVideo(null);
    };
  }, [activeVideo, house.activities, setActiveVideo]);

  return (
    <div className="home-interior">
      <section className="home-interior-hero">
        <div className="home-interior-visual">
          {activeVideo ? (
            <video
              className="home-interior-video"
              src={activeVideo}
              autoPlay
              loop
              controls
            />
          ) : (
            <img src={heroImage} alt={`${house.name} 室内`} />
          )}
          <div className="home-interior-hero-overlay">
            <span className="hero-badge">室内探索</span>
            <h1>{house.name}</h1>
            <p>{house.address} · {house.style} · {house.yearBuilt} 年建</p>
          </div>
        </div>
        {primaryNarrative ? (
          <aside className="home-interior-highlight">
            <h2>今日故事 · {primaryNarrative.title}</h2>
            <p>{primaryNarrative.summary}</p>
            {primaryNarrative.media[0] ? (
              <div className="highlight-media">
                <span>{primaryNarrative.media[0].title}</span>
                <small>{primaryNarrative.media[0].source}</small>
              </div>
            ) : null}
          </aside>
        ) : null}
      </section>

      <section className="home-interior-content">
        <div className="home-interior-column">
          <h3>活动与体验</h3>
          <ul className="home-interior-list">
            {house.activities.map((activity) => (
              <li key={activity.id}>
                <div className="list-header">
                  <span className="list-badge">📅 活动</span>
                  <strong>{activity.title}</strong>
                </div>
                <p>{activity.description}</p>
                <footer>
                  <span>{activity.date}</span>
                  <span>剩余名额：{activity.remaining}/{activity.slots}</span>
                </footer>
              </li>
            ))}
          </ul>

          <h3>时间线</h3>
          <ul className="home-interior-timeline">
            {house.timeline.map((item) => (
              <li key={`${house.id}-${item.year}`}>
                <span className="timeline-year">{item.year}</span>
                <p>{item.event}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="home-interior-column">
          <h3>住户故事</h3>
          <ul className="home-interior-stories">
            {otherNarratives.map((story) => (
              <li key={story.title}>
                <strong>{story.title}</strong>
                <p>{story.summary}</p>
                {story.media[0] ? (
                  <small>{story.media[0].title} · {story.media[0].source}</small>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

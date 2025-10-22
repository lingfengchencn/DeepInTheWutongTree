import './SplashScreen.css';

interface SplashScreenProps {
  progress: number;
}

export const SplashScreen = ({ progress }: SplashScreenProps) => {
  return (
    <div className="splash-root" role="presentation">
      <div className="splash-texture" />
      <div className="splash-content">
        <div className="art-frame">
          <div className="art-line line-left" />
          <div className="art-line line-right" />
          <div className="art-line line-top" />
          <div className="art-line line-bottom" />
          <div className="art-logo">
            <img
              className="logo-image"
              src="/assets/logos/wutongshenchu.png"
              alt="梧桐深处 Logo"
            />
            <span className="logo-rays" />
          </div>
        </div>
        <h1>有记忆、有温度的上海老洋房社区</h1>
        <p>梧桐导览员正在唤醒历史故事...</p>
        <div className="progress-wrapper" aria-label="加载进度">
          <div className="progress-track">
            <div
              className="progress-bar"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

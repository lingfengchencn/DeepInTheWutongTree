import { type ReactNode } from 'react';
import './MiniAppChrome.css';

interface MiniAppChromeProps {
  children: ReactNode;
}

export const MiniAppChrome = ({ children }: MiniAppChromeProps) => {
  return (
    <div className="mini-app-shell">
      <header className="shell-header">
        <div className="signal-dot" />
        <div className="signal-dot" />
        <div className="signal-dot" />
        <span className="title">梧桐深处 · WeChat Mini Demo</span>
        <span className="badge">Demo Mode</span>
      </header>
      <main className="shell-content">{children}</main>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { RefreshCw, Clock } from 'lucide-react';

const STATUS_TONE = {
  READY: 'neutral',
  RUNNING: 'green',
  PAUSED: 'amber',
  COMPLETED: 'blue',
};

export default function Header({ state }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const t = (n) => String(n).padStart(2, '0');
  const wall = `${t(now.getHours())}:${t(now.getMinutes())}:${t(now.getSeconds())}`;

  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-mark">
            <RefreshCw size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div className="brand-name">SYNCFLOW</div>
            <div className="brand-sub">OS LAB SIMULATOR</div>
          </div>
        </div>

        <h1 className="header-title">Producer–Consumer Synchronization</h1>

        <div className="header-right">
          <div className="clock" title="Simulation steps / wall clock">
            <Clock size={13} />
            <span>T+{String(state.tick).padStart(3, '0')}</span>
            <span className="clock-sep">|</span>
            <span>{wall}</span>
          </div>
          <span className={`badge badge-${STATUS_TONE[state.status]} badge-lg`}>
            <span className={`dot ${state.status === 'RUNNING' ? 'pulse' : ''}`} />
            {state.status}
          </span>
        </div>
      </div>
    </header>
  );
}

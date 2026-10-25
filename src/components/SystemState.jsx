import { CAPACITY, bufferCount, actorStatus } from '../sim/engine';
import { Activity } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const label = (s) => (s === 'ACTIVE' ? 'RUNNING' : s);
const tone = (s) => (s === 'WAITING' ? 'amber' : s === 'ACTIVE' ? 'green' : 'neutral');

export default function SystemState({ state }) {
  const p = actorStatus(state, 'producer');
  const c = actorStatus(state, 'consumer');
  const count = bufferCount(state);

  const rows = [
    ['Producer', label(p), tone(p)],
    ['Consumer', label(c), tone(c)],
    ['Buffer', `${count} / ${CAPACITY}`, count === CAPACITY ? 'red' : 'neutral'],
    ['Empty Semaphore', state.empty, state.empty === 0 ? 'red' : 'green'],
    ['Full Semaphore', state.full, state.full === 0 ? 'amber' : 'blue'],
    ['Mutex', state.mutex ? `LOCKED (${state.mutex})` : 'AVAILABLE', state.mutex ? 'blue' : 'green'],
    ['Processed', pad(state.stats.consumed), 'neutral'],
    ['Waiting', pad(count), 'neutral'],
  ];

  return (
    <section className="panel">
      <div className="panel-head">
        <h3 className="panel-title"><Activity size={14} /> SYSTEM STATE</h3>
        <span className="muted mono small">LIVE</span>
      </div>
      <dl className="state-list">
        {rows.map(([k, v, t]) => (
          <div key={k} className="state-row">
            <dt>{k}</dt>
            <dd className={`mono val-${t}`}>{typeof v === 'number' ? pad(v) : v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

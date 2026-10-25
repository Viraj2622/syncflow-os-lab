import { Lock, Unlock, ShieldCheck } from 'lucide-react';
import { CAPACITY } from '../sim/engine';

/* Counting-semaphore card: shows the live value as pips. */
function SemaphoreCard({ name, value, desc, tone, note }) {
  return (
    <article className={`panel sem sem-${tone}`}>
      <div className="panel-head">
        <h3 className="panel-title">{name}</h3>
        <span className="badge badge-neutral mono">SEMAPHORE</span>
      </div>
      <div className="sem-value mono" key={value}>
        <span className="muted small">VALUE:</span> {value}
      </div>
      <div className="pips">
        {Array.from({ length: CAPACITY }).map((_, i) => (
          <span key={i} className={`pip ${i < value ? 'pip-on' : ''}`} />
        ))}
        <span className="muted mono small">{value} / {CAPACITY}</span>
      </div>
      <p className="desc">{desc}</p>
      <p className="note mono">{note}</p>
    </article>
  );
}

export function EmptySemaphore({ state }) {
  const v = state.empty;
  return (
    <SemaphoreCard
      name="EMPTY"
      value={v}
      tone={v === 0 ? 'red' : 'green'}
      desc="Available buffer slots"
      note={v === 2 ? 'Both slots free' : v === 1 ? 'One slot free' : 'No free slot → buffer full'}
    />
  );
}

export function FullSemaphore({ state }) {
  const v = state.full;
  return (
    <SemaphoreCard
      name="FULL"
      value={v}
      tone={v === 0 ? 'amber' : 'blue'}
      desc="Vehicles currently waiting"
      note={v === 0 ? 'No vehicle → buffer empty' : v === 1 ? 'One vehicle waiting' : 'Two vehicles waiting'}
    />
  );
}

export function MutexCard({ state }) {
  const owner = state.mutex;
  const label = owner ? `LOCKED BY ${owner}` : 'AVAILABLE';
  return (
    <article className={`panel mutex ${owner ? `mutex-locked mutex-${owner.toLowerCase()}` : 'mutex-free'}`}>
      <div className="panel-head">
        <h3 className="panel-title">MUTEX</h3>
        <span className="badge badge-neutral mono">LOCK</span>
      </div>
      <div className="mutex-body">
        <div className="lock-ico" key={label}>{owner ? <Lock size={26} /> : <Unlock size={26} />}</div>
        <div>
          <div className="muted small mono">STATUS:</div>
          <div className="mutex-status mono">{label}</div>
        </div>
      </div>
      <p className="desc">Guards the shared buffer</p>
      <p className="note mono">{owner ? 'Other thread must wait' : 'Free to acquire'}</p>
    </article>
  );
}

/* Critical section: safety doors close while one thread is inside. */
export function CriticalSection({ state }) {
  const owner = state.mutex;
  return (
    <article className={`panel cs ${owner ? `cs-on cs-${owner.toLowerCase()}` : ''}`}>
      <div className="panel-head">
        <h3 className="panel-title">CRITICAL SECTION</h3>
        <ShieldCheck size={16} className="muted" />
      </div>
      <div className="vault">
        <div className="vault-core">
          <div className="cs-title mono">SHARED BUFFER</div>
          {owner ? (
            <div key={owner + state.tick} className="cs-actor mono">{owner}</div>
          ) : (
            <div className="cs-empty mono">NO THREAD INSIDE</div>
          )}
          <div className="cs-rule">Only ONE thread here</div>
        </div>
        <div className="door door-l" />
        <div className="door door-r" />
        {owner && <div className="vault-label mono"><Lock size={12} /> DOORS LOCKED · {owner} INSIDE</div>}
      </div>
      <p className="note mono">{owner ? `${owner} → ENTERED CRITICAL SECTION` : 'Doors open — section is free'}</p>
    </article>
  );
}

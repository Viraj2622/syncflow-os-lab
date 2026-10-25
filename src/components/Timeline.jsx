const STAGES = [
  { key: 'PRODUCE', label: 'PRODUCE', hint: 'Create vehicle' },
  { key: 'WAIT', label: 'WAIT / CHECK', hint: 'wait(empty) / wait(full)' },
  { key: 'LOCK', label: 'LOCK', hint: 'wait(mutex)' },
  { key: 'ACCESS', label: 'ACCESS BUFFER', hint: 'Insert / remove' },
  { key: 'UNLOCK', label: 'UNLOCK', hint: 'signal(mutex)' },
  { key: 'CONSUME', label: 'CONSUME', hint: 'Process vehicle' },
];

export default function Timeline({ state }) {
  const cur = state.stage;
  return (
    <section className="panel">
      <div className="panel-head">
        <h3 className="panel-title">SYNCHRONIZATION TIMELINE</h3>
        <span className="muted mono small">
          {cur ? `${cur.actor} → ${cur.name}${cur.blocked ? ' (BLOCKED)' : ''}` : 'NO ACTIVE STAGE'}
        </span>
      </div>
      <ol className="timeline">
        {STAGES.map((s, i) => {
          const active = cur && cur.name === s.key;
          const tone = active ? (cur.blocked ? 'amber' : cur.actor === 'PRODUCER' ? 'blue' : 'green') : '';
          return (
            <li key={s.key} className={`tl-step ${active ? `tl-active tl-${tone}` : ''}`}>
              <span className="tl-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="tl-label">{s.label}</span>
              <span className="tl-hint mono">{s.hint}</span>
              {active && <span className="tl-actor mono">{cur.actor}</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

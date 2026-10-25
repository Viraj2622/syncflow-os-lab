import { useEffect, useRef } from 'react';
import { Trash2, Terminal } from 'lucide-react';

export default function EventLog({ state, onClear }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [state.log.length]);

  return (
    <section className="panel log-panel">
      <div className="panel-head">
        <h3 className="panel-title"><Terminal size={14} /> SYSTEM EVENT LOG</h3>
        <button className="btn btn-sm" onClick={onClear}><Trash2 size={13} /> Clear Log</button>
      </div>
      <div className="log" ref={ref}>
        {state.log.length === 0 ? (
          <div className="log-empty mono">$ waiting for events… press START or STEP</div>
        ) : (
          state.log.map((e) => (
            <div key={e.id} className={`log-row log-${e.tone}`}>
              <span className="log-time">{e.time}</span>
              <span className={`log-cat cat-${e.cat.toLowerCase()}`}>{e.cat}</span>
              <span className="log-msg">{e.msg}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

import { Minimize2, ArrowDownToLine, ArrowUpFromLine, ShieldCheck, Check, X, ListChecks } from 'lucide-react';
import { CAPACITY, bufferCount, actorStatus, verify } from '../sim/engine';

/**
 * VERIFICATION BOARD — the four required conditions side by side, each with
 * its rule, the live evidence and a verified tick, plus four independent
 * invariant checks recomputed from the raw simulation state.
 */
export default function Conditions({ state }) {
  const v = verify(state);
  const count = bufferCount(state);
  const fullOn = state.producer.blocked;
  const emptyOn = state.consumer.blocked;

  const items = [
    {
      n: '01', title: 'SMALL BUFFER', icon: <Minimize2 size={16} />,
      result: 'ACTIVE', tone: 'blue', trig: false,
      rule: 'Capacity restricted to 2 slots.',
      evidence: `${count} / ${CAPACITY} slots used`,
      ok: v.bounds.ok,
    },
    {
      n: '02', title: 'BUFFER FULL', icon: <ArrowDownToLine size={16} />,
      result: fullOn ? 'TRIGGERED' : 'NORMAL', tone: fullOn ? 'red' : 'neutral', trig: fullOn,
      rule: 'empty = 0 → producer waits.',
      evidence: `empty = ${state.empty} · producer ${actorStatus(state, 'producer')}`,
      ok: !fullOn || state.empty === 0,
      extra: `Triggered ${state.stats.timesFull}×`,
    },
    {
      n: '03', title: 'BUFFER EMPTY', icon: <ArrowUpFromLine size={16} />,
      result: emptyOn ? 'TRIGGERED' : 'NORMAL', tone: emptyOn ? 'amber' : 'neutral', trig: emptyOn,
      rule: 'full = 0 → consumer waits.',
      evidence: `full = ${state.full} · consumer ${actorStatus(state, 'consumer')}`,
      ok: !emptyOn || state.full === 0,
      extra: `Triggered ${state.stats.timesEmpty}×`,
    },
    {
      n: '04', title: 'RACE CONDITION', icon: <ShieldCheck size={16} />,
      result: 'PROTECTED', tone: 'green', trig: false,
      rule: 'Mutex allows one thread inside.',
      evidence: state.mutex ? `held by ${state.mutex}` : 'mutex free',
      ok: v.mutex.ok,
      extra: `${state.stats.races} race conditions`,
    },
  ];

  const invariants = [
    { label: 'Buffer within bounds', rule: '0 ≤ items ≤ 2', ...v.bounds },
    { label: 'Mutual exclusion', rule: '≤ 1 thread in critical section', ...v.mutex },
    { label: 'Semaphore balance', rule: 'empty + full + in-flight = 2', ...v.tokens },
    { label: 'No vehicle lost', rule: 'produced − consumed = buffer + in-hand', ...v.conserve },
  ];
  const passed = invariants.filter((i) => i.ok).length + items.filter((i) => i.ok).length;
  const total = invariants.length + items.length;

  return (
    <section className="panel vboard">
      <div className="panel-head">
        <h3 className="panel-title"><ListChecks size={14} /> SYNCHRONIZATION CONDITIONS · LIVE VERIFICATION</h3>
        <span className={`badge ${passed === total ? 'badge-green' : 'badge-red'} mono`}>
          {passed} / {total} CHECKS PASSING
        </span>
      </div>

      <div className="vgrid">
        {items.map((c) => (
          <article key={c.n} className={`vcard vcard-${c.tone} ${c.trig ? 'vcard-trig' : ''}`}>
            <div className="cond-top">
              <span className="muted mono small">CONDITION {c.n}</span>
              <span className="cond-ico">{c.icon}</span>
            </div>
            <h4 className="cond-title">{c.title}</h4>
            <span className={`badge badge-${c.tone} mono`} key={c.result}>{c.result}</span>
            <div className="vrow"><span>RULE</span><b>{c.rule}</b></div>
            <div className="vrow"><span>LIVE</span><b className="mono">{c.evidence}</b></div>
            <div className={`vresult ${c.ok ? 'vok' : 'vbad'}`}>
              {c.ok ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
              {c.ok ? 'VERIFIED' : 'VIOLATION'}
              {c.extra && <em>{c.extra}</em>}
            </div>
          </article>
        ))}
      </div>

      <div className="vsub">INDEPENDENT INVARIANT CHECKS</div>
      <div className="vgrid">
        {invariants.map((i) => (
          <div key={i.label} className={`inv ${i.ok ? 'inv-ok' : 'inv-bad'}`}>
            <div className="inv-top">
              <b>{i.label}</b>
              <span className="inv-tick">{i.ok ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}</span>
            </div>
            <span className="inv-rule">{i.rule}</span>
            <span className="inv-val mono" key={i.value}>{i.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

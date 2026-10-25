const pad = (n) => String(n).padStart(2, '0');

export default function Summary({ state }) {
  const s = state.stats;
  const items = [
    ['Total Produced', pad(s.produced), 'neutral'],
    ['Total Consumed', pad(s.consumed), 'neutral'],
    ['Times Buffer Full', pad(s.timesFull), 'red'],
    ['Times Buffer Empty', pad(s.timesEmpty), 'amber'],
    ['Producer Waits', pad(s.producerWaits), 'amber'],
    ['Consumer Waits', pad(s.consumerWaits), 'amber'],
    ['Race Conditions', `${s.races} prevented`, 'green'],
  ];
  return (
    <section>
      <div className="section-head">
        <h3 className="panel-title">DASHBOARD SUMMARY</h3>
      </div>
      <div className="summary">
        {items.map(([k, v, t]) => (
          <div key={k} className="panel sum-item">
            <span className="muted small">{k}</span>
            <b className={`mono sum-${t}`} key={v}>{v}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

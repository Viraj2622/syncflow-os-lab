/* Small project-themed SVG illustrations (parking gate, car, server rack). */

export function CarArt({ size = 44, className = '' }) {
  return (
    <svg className={`car-art ${className}`} viewBox="0 0 56 28" width={size} height={size / 2} aria-hidden="true">
      <path
        d="M3 20v-5c0-1 .7-1.8 1.7-2l6-1.4 5-6c.5-.6 1.2-1 2-1h15c.8 0 1.5.3 2 .9l6.3 6.1 8.2 1.5c1 .2 1.8 1 1.8 2V20c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1z"
        fill="currentColor"
      />
      <path d="M18 8.5h8v5H13zM28 8.5h6.5l4.5 5H28z" fill="#fff" opacity=".85" />
      <circle cx="16" cy="21" r="4.2" fill="#1b2433" />
      <circle cx="16" cy="21" r="1.6" fill="#cbd5e1" />
      <circle cx="42" cy="21" r="4.2" fill="#1b2433" />
      <circle cx="42" cy="21" r="1.6" fill="#cbd5e1" />
    </svg>
  );
}

/** Entry gate: barrier arm lifts when open; light shows green / red / amber. */
export function GateArt({ open, light }) {
  return (
    <svg className="gate-art" viewBox="0 0 200 90" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <rect x="0" y="74" width="200" height="16" className="g-road" />
      <line x1="0" y1="82" x2="200" y2="82" className="g-dash" />
      {/* booth */}
      <rect x="122" y="22" width="50" height="8" rx="3" className="g-roof" />
      <rect x="126" y="30" width="42" height="44" rx="4" className="g-booth" />
      <rect x="134" y="38" width="26" height="14" rx="2" className="g-window" />
      <circle cx="147" cy="14" r="5.5" className={`g-light g-${light}`} />
      {/* barrier arm */}
      <g className={`g-arm ${open ? 'g-arm-open' : ''}`} style={{ transformOrigin: '126px 56px' }}>
        <rect x="52" y="53" width="74" height="6" rx="3" className="g-armbar" />
        <rect x="62" y="53" width="8" height="6" className="g-stripe" />
        <rect x="80" y="53" width="8" height="6" className="g-stripe" />
        <rect x="98" y="53" width="8" height="6" className="g-stripe" />
      </g>
      <circle cx="126" cy="56" r="4" className="g-pivot" />
    </svg>
  );
}

/** Parking management server rack with blinking LEDs and a scan line. */
export function ServerArt({ active, waiting }) {
  const cls = active ? 'srv-on' : waiting ? 'srv-wait' : '';
  return (
    <svg className={`server-art ${cls}`} viewBox="0 0 200 90" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <rect x="0" y="82" width="200" height="8" className="g-road" />
      <rect x="62" y="6" width="76" height="76" rx="6" className="s-body" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="70" y={13 + i * 23} width="60" height="18" rx="3" className="s-unit" />
          <circle cx="79" cy={22 + i * 23} r="2.6" className="s-led" style={{ animationDelay: `${i * 0.25}s` }} />
          <rect x="88" y={19 + i * 23} width="34" height="3" rx="1.5" className="s-bar" />
          <rect x="88" y={24 + i * 23} width="22" height="3" rx="1.5" className="s-bar" />
        </g>
      ))}
      <rect x="66" y="10" width="68" height="3" className="s-scan" />
    </svg>
  );
}

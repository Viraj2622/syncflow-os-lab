import { ParkingSquare, Server, Car, Lock, Ticket } from 'lucide-react';
import { CAPACITY, vid, bufferCount, actorStatus } from '../sim/engine';
import { CarArt, GateArt, ServerArt } from './Illustrations';

/* ------------------------------ helpers ------------------------------ */

function VehicleChip({ id, className = '' }) {
  return (
    <span className={`vehicle ${className}`}>
      <Car size={15} />
      {vid(id)}
    </span>
  );
}

function StatusBadge({ status, waitingText, activeText }) {
  if (status === 'WAITING')
    return <span className="badge badge-amber"><span className="dot pulse" />{waitingText}</span>;
  if (status === 'ACTIVE')
    return <span className="badge badge-blue"><span className="dot pulse" />{activeText}</span>;
  return <span className="badge badge-neutral"><span className="dot" />IDLE</span>;
}

/* ------------------------------ PRODUCER ----------------------------- */

export function ProducerCard({ state }) {
  const st = actorStatus(state, 'producer');
  const p = state.producer;

  // Gate opens once the producer was granted a free slot (wait(empty) passed).
  const gateOpen = !p.blocked && ['lock', 'insert', 'unlock'].includes(p.phase);
  const light = p.blocked ? 'red' : gateOpen ? 'green' : 'amber';

  let carCls = null;
  if (p.vehicle && p.phase !== 'idle' && !p.done) {
    if (p.blocked) carCls = 'car-wait';
    else if (p.phase === 'check') carCls = 'car-arrive';
    else if (p.phase === 'lock') carCls = 'car-gate';
    else carCls = 'car-pass';
  }

  return (
    <article className={`panel node node-${st.toLowerCase()}`}>
      <div className="node-head">
        <div className="node-icon"><ParkingSquare size={20} /></div>
        <div>
          <div className="eyebrow">PRODUCER</div>
          <h2 className="node-title">SMART PARKING GATE</h2>
        </div>
      </div>

      <StatusBadge status={st} waitingText="WAITING — BUFFER FULL" activeText="PRODUCING" />

      <div className="scene">
        <GateArt open={gateOpen} light={light} />
        {carCls && (
          <div key={`${p.vehicle}-${carCls}`} className={`lane-car ${carCls}`}>
            <CarArt size={46} />
            <em>{vid(p.vehicle)}</em>
          </div>
        )}
        <span className={`gate-tag gate-tag-${light}`}>
          {p.blocked ? 'BARRIER CLOSED' : gateOpen ? 'BARRIER OPEN' : 'READY'}
        </span>
      </div>

      <div className="node-body">
        <div className="field-label">Current vehicle</div>
        <div className="vehicle-slot">
          {p.vehicle ? <VehicleChip id={p.vehicle} className={p.blocked ? 'vehicle-wait' : ''} /> : <span className="empty-hint">— none —</span>}
        </div>
        <div className="field-label">Generate Vehicle</div>
        <div className={`activity ${st === 'ACTIVE' ? 'activity-on' : ''} ${st === 'WAITING' ? 'activity-wait' : ''}`}><i /></div>
      </div>

      <div className="node-foot">
        <span>PRODUCED</span>
        <b key={state.stats.produced}>{String(state.stats.produced).padStart(2, '0')}</b>
      </div>
    </article>
  );
}

/* ------------------------------ CONSUMER ----------------------------- */

export function ConsumerCard({ state }) {
  const st = actorStatus(state, 'consumer');
  const c = state.consumer;
  const showing = c.vehicle && (c.phase === 'unlock' || c.phase === 'process' || c.phase === 'check') ? c.vehicle : null;
  const processing = c.phase === 'process' && c.vehicle;

  return (
    <article className={`panel node node-${st.toLowerCase()}`}>
      <div className="node-head">
        <div className="node-icon"><Server size={20} /></div>
        <div>
          <div className="eyebrow">CONSUMER</div>
          <h2 className="node-title">PARKING MANAGEMENT SYSTEM</h2>
        </div>
      </div>

      <StatusBadge status={st} waitingText="WAITING — BUFFER EMPTY" activeText="PROCESSING" />

      <div className="scene">
        <ServerArt active={st === 'ACTIVE'} waiting={st === 'WAITING'} />
        {processing && (
          <div key={`t-${c.vehicle}`} className="ticket">
            <Ticket size={13} /> {vid(c.vehicle)} PARKED
          </div>
        )}
        <span className={`gate-tag ${st === 'WAITING' ? 'gate-tag-amber' : st === 'ACTIVE' ? 'gate-tag-green' : ''}`}>
          {st === 'WAITING' ? 'AWAITING REQUEST' : st === 'ACTIVE' ? 'HANDLING REQUEST' : 'STANDBY'}
        </span>
      </div>

      <div className="node-body">
        <div className="field-label">Current vehicle</div>
        <div className="vehicle-slot">
          {showing ? <VehicleChip id={showing} /> : <span className="empty-hint">— none —</span>}
        </div>
        <div className="field-label">Processing</div>
        <div className={`activity ${st === 'ACTIVE' ? 'activity-on' : ''} ${st === 'WAITING' ? 'activity-wait' : ''}`}><i /></div>
      </div>

      <div className="node-foot">
        <span>CONSUMED</span>
        <b key={state.stats.consumed}>{String(state.stats.consumed).padStart(2, '0')}</b>
      </div>
    </article>
  );
}

/* ------------------------------ BUFFER ------------------------------- */

export function BufferPanel({ state }) {
  const count = bufferCount(state);
  const isFull = count === CAPACITY;
  const isEmpty = count === 0;
  const locked = state.mutex !== null;

  let banner = { text: 'BUFFER NORMAL — SPACE FOR MORE', tone: 'neutral' };
  if (isFull && state.producer.blocked) banner = { text: 'BUFFER FULL — PRODUCER WAITING', tone: 'red' };
  else if (isFull) banner = { text: 'BUFFER FULL', tone: 'red' };
  else if (isEmpty && state.consumer.blocked) banner = { text: 'BUFFER EMPTY — CONSUMER WAITING', tone: 'amber' };
  else if (isEmpty) banner = { text: 'BUFFER EMPTY', tone: 'neutral' };

  const showNotice = state.notice && state.tick - state.notice.tick < 3;
  const anim = state.anim;

  return (
    <article className={`panel buffer ${isFull ? 'buffer-full' : ''} ${isEmpty ? 'buffer-empty' : ''} ${locked ? 'buffer-locked' : ''}`}>
      <div className="buffer-head">
        <div>
          <div className="eyebrow">SHARED RESOURCE · PARKING BAYS</div>
          <h2 className="node-title">SHARED BUFFER</h2>
        </div>
        <span className="badge badge-neutral mono">CAPACITY: {CAPACITY}</span>
      </div>

      <div className="slots">
        {isFull && <div className="stamp" key="stamp">FULL</div>}
        {state.slots.map((v, i) => {
          const leaving = anim && anim.kind === 'remove' && anim.slot === i && v === null;
          const justIn = anim && anim.kind === 'insert' && anim.slot === i && v !== null;
          return (
            <div key={i} className={`slot ${v ? 'slot-on' : ''}`}>
              {justIn && <span key={`rip-${anim.seq}`} className="ripple" />}
              <span className="slot-index">BAY {i + 1}</span>
              <span className={`sensor ${v ? 'sensor-busy' : 'sensor-free'}`}>
                <i />{v ? 'OCCUPIED' : 'FREE'}
              </span>
              <div className="slot-pointers">
                {state.inIdx === i && <span className="ptr ptr-in">IN</span>}
                {state.outIdx === i && <span className="ptr ptr-out">OUT</span>}
              </div>
              {v ? (
                <div key={`${i}-${v}`} className="bay-car bay-in">
                  <CarArt size={54} />
                  <b>{vid(v)}</b>
                </div>
              ) : leaving ? (
                <div key={`leave-${anim.seq}`} className="bay-car bay-out">
                  <CarArt size={54} />
                  <b>{vid(anim.vehicle)}</b>
                </div>
              ) : (
                <span className="empty-hint">EMPTY BAY</span>
              )}
              {locked && <Lock size={12} className="slot-lock" />}
            </div>
          );
        })}
      </div>

      <div className="buffer-meter">
        <div className="meter-row">
          <b className="mono">{count} / {CAPACITY} OCCUPIED</b>
          <span className="muted mono">{Math.round((count / CAPACITY) * 100)}% UTILIZATION</span>
        </div>
        <div className="bar"><i style={{ width: `${(count / CAPACITY) * 100}%` }} className={isFull ? 'bar-red' : ''} /></div>
      </div>

      <div className={`banner banner-${banner.tone}`}>{banner.text}</div>
      <div className="notice-row">
        {showNotice && (
          <span key={state.notice.seq} className={`notice notice-${state.notice.tone}`}>{state.notice.text}</span>
        )}
      </div>
    </article>
  );
}

/* ----------------------------- CONNECTORS ---------------------------- */

/** Road between nodes. The car only appears when the engine emits a real insert/remove event. */
export function Connector({ state, kind, running }) {
  const a = state.anim;
  return (
    <div className={`connector ${running ? 'connector-on' : ''}`} aria-hidden="true">
      <div className="track" />
      {a && a.kind === kind && (
        <span key={a.seq} className="packet">
          <Car size={13} />
          <em>{vid(a.vehicle)}</em>
        </span>
      )}
    </div>
  );
}

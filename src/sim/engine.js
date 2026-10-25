/**
 * SYNCFLOW SIMULATION ENGINE
 * ---------------------------------------------------------------------------
 * A pure, deterministic state machine for the bounded-buffer
 * Producer–Consumer problem. Every call to `step()` executes exactly ONE
 * micro-step of ONE actor (the Producer or the Consumer), so the UI can show
 * each synchronization event individually.
 *
 *   PRODUCER micro-steps            CONSUMER micro-steps
 *   1. create vehicle   (PRODUCE)   1. wait(full)          (WAIT)
 *   2. wait(empty)      (WAIT)      2. wait(mutex)         (LOCK)
 *   3. wait(mutex)      (LOCK)      3. remove from buffer  (ACCESS)
 *   4. insert in buffer (ACCESS)    4. signal(mutex)       (UNLOCK)
 *   5. signal(mutex)    (UNLOCK)       + signal(empty)
 *      + signal(full)               5. process vehicle     (CONSUME)
 *
 * Semaphores: empty (init = CAPACITY), full (init = 0), mutex (null = free).
 */

export const CAPACITY = 2;
export const TOTAL_VEHICLES = 10;

// A fixed "scheduler" pattern. It makes the demo reproducible:
//   fill the buffer -> producer blocks -> consumer frees ONE slot ->
//   producer continues -> consumer drains everything -> consumer blocks.
const PATTERN = [
  ...Array(12).fill('P'),
  ...Array(5).fill('C'),
  ...Array(5).fill('P'),
  ...Array(12).fill('C'),
];

const pad = (n) => String(n).padStart(2, '0');
export const vid = (n) => `V${pad(n)}`;
const clock = (ms) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const bufferCount = (s) => s.slots.filter((v) => v !== null).length;

export function createInitialState() {
  return {
    status: 'READY', // READY | RUNNING | PAUSED | COMPLETED
    tick: 0,
    patternIdx: 0,
    seq: 0,
    lastActor: null,

    // ---- shared resource + synchronization primitives ----
    slots: Array(CAPACITY).fill(null), // circular buffer
    inIdx: 0,
    outIdx: 0,
    empty: CAPACITY, // counting semaphore: free slots
    full: 0, // counting semaphore: occupied slots
    mutex: null, // null | 'PRODUCER' | 'CONSUMER'

    nextId: 1,
    producer: { phase: 'idle', vehicle: null, blocked: false, done: false },
    consumer: { phase: 'check', vehicle: null, blocked: false },

    stage: null, // {name, actor, blocked}
    anim: null, // {kind:'insert'|'remove', vehicle, slot, seq}
    tip: null,
    notice: null,
    log: [],
    stats: {
      produced: 0,
      consumed: 0,
      timesFull: 0,
      timesEmpty: 0,
      producerWaits: 0,
      consumerWaits: 0,
      races: 0, // never increments: the mutex guarantees mutual exclusion
    },
  };
}

/* ------------------------------ helpers ------------------------------ */

function clone(s) {
  return {
    ...s,
    slots: [...s.slots],
    producer: { ...s.producer },
    consumer: { ...s.consumer },
    stats: { ...s.stats },
    log: [...s.log],
  };
}

export function addLog(s, now, cat, msg, tone = 'info') {
  s.seq += 1;
  s.log.push({ id: s.seq, time: clock(now), cat, msg, tone });
  if (s.log.length > 80) s.log.shift();
}

// Teaching tips; higher priority tips are not overwritten by minor ones too quickly.
function setTip(s, text, tone, prio) {
  if (s.tip && s.tip.prio > prio && s.tick - s.tip.tick < 4) return;
  s.seq += 1;
  s.tip = { text, tone, prio, seq: s.seq, tick: s.tick };
}

function setNotice(s, text, tone) {
  s.seq += 1;
  s.notice = { text, tone, seq: s.seq, tick: s.tick };
}

function setAnim(s, kind, vehicle, slot) {
  s.seq += 1;
  s.anim = { kind, vehicle, slot, seq: s.seq };
}

/* --------------------------- PRODUCER LOGIC --------------------------- */

function producerStep(s, now) {
  const p = s.producer;
  if (p.done) return false;

  switch (p.phase) {
    case 'idle': {
      if (s.nextId > TOTAL_VEHICLES) {
        p.done = true;
        p.vehicle = null;
        s.stage = null;
        addLog(s, now, 'PRODUCER', 'All vehicles dispatched', 'info');
        return true;
      }
      p.vehicle = s.nextId++;
      p.phase = 'check';
      s.stage = { name: 'PRODUCE', actor: 'PRODUCER' };
      addLog(s, now, 'PRODUCER', `${vid(p.vehicle)} created`, 'info');
      return true;
    }

    case 'check': {
      // wait(empty): is there a free slot?
      if (s.empty === 0) {
        if (p.blocked) return false; // already sleeping, nothing new to show
        p.blocked = true;
        s.stats.timesFull += 1;
        s.stats.producerWaits += 1;
        s.stage = { name: 'WAIT', actor: 'PRODUCER', blocked: true };
        addLog(s, now, 'STATUS', 'BUFFER FULL', 'danger');
        addLog(s, now, 'PRODUCER', `${vid(p.vehicle)} waiting for empty slot`, 'warn');
        setTip(
          s,
          'Both buffer slots are occupied. The producer is blocked until the consumer frees a slot.',
          'danger',
          3
        );
        return true;
      }
      s.empty -= 1;
      p.blocked = false;
      p.phase = 'lock';
      s.stage = { name: 'WAIT', actor: 'PRODUCER' };
      addLog(s, now, 'SEMAPHORE', `wait(empty) → empty = ${s.empty}`, 'info');
      return true;
    }

    case 'lock': {
      // wait(mutex): enter the critical section (only if nobody is inside)
      if (s.mutex !== null) return false; // mutual exclusion: cannot enter
      s.mutex = 'PRODUCER';
      p.phase = 'insert';
      s.stage = { name: 'LOCK', actor: 'PRODUCER' };
      addLog(s, now, 'MUTEX', 'Locked by PRODUCER', 'active');
      setTip(
        s,
        'The shared buffer is inside a critical section. Another thread must wait before accessing it.',
        'active',
        1
      );
      return true;
    }

    case 'insert': {
      // ---- CRITICAL SECTION: only the mutex owner is here ----
      const slot = s.inIdx;
      s.slots[slot] = p.vehicle;
      s.inIdx = (s.inIdx + 1) % CAPACITY;
      s.stats.produced += 1;
      p.phase = 'unlock';
      s.stage = { name: 'ACCESS', actor: 'PRODUCER' };
      setAnim(s, 'insert', p.vehicle, slot);
      addLog(s, now, 'BUFFER', `${vid(p.vehicle)} inserted into slot ${slot + 1}`, 'success');
      return true;
    }

    case 'unlock': {
      // signal(mutex) then signal(full)
      s.mutex = null;
      s.full += 1;
      p.phase = 'idle';
      s.stage = { name: 'UNLOCK', actor: 'PRODUCER' };
      addLog(s, now, 'MUTEX', 'Released', 'success');
      addLog(s, now, 'SEMAPHORE', `signal(full) → full = ${s.full}`, 'info');
      if (s.consumer.blocked) {
        s.consumer.blocked = false; // wake up the consumer
        addLog(s, now, 'CONSUMER', 'Woken up — vehicle available', 'success');
        setNotice(s, 'VEHICLE AVAILABLE', 'success');
      }
      return true;
    }
    default:
      return false;
  }
}

/* --------------------------- CONSUMER LOGIC --------------------------- */

function consumerStep(s, now) {
  const c = s.consumer;

  switch (c.phase) {
    case 'check': {
      // Nothing left to ever consume
      if (s.producer.done && s.stats.consumed === TOTAL_VEHICLES) return false;
      // wait(full): is there a vehicle?
      if (s.full === 0) {
        if (c.blocked) return false;
        c.blocked = true;
        s.stats.timesEmpty += 1;
        s.stats.consumerWaits += 1;
        s.stage = { name: 'WAIT', actor: 'CONSUMER', blocked: true };
        addLog(s, now, 'STATUS', 'BUFFER EMPTY', 'warn');
        addLog(s, now, 'CONSUMER', 'Waiting for vehicle', 'warn');
        setTip(s, 'No vehicle is available. The consumer must wait.', 'warn', 3);
        return true;
      }
      s.full -= 1;
      c.blocked = false;
      c.phase = 'lock';
      s.stage = { name: 'WAIT', actor: 'CONSUMER' };
      addLog(s, now, 'SEMAPHORE', `wait(full) → full = ${s.full}`, 'info');
      return true;
    }

    case 'lock': {
      if (s.mutex !== null) return false; // mutual exclusion
      s.mutex = 'CONSUMER';
      c.phase = 'remove';
      s.stage = { name: 'LOCK', actor: 'CONSUMER' };
      addLog(s, now, 'MUTEX', 'Locked by CONSUMER', 'active');
      setTip(
        s,
        'The shared buffer is inside a critical section. Another thread must wait before accessing it.',
        'active',
        1
      );
      return true;
    }

    case 'remove': {
      // ---- CRITICAL SECTION: only the mutex owner is here ----
      const slot = s.outIdx;
      const v = s.slots[slot];
      s.slots[slot] = null;
      s.outIdx = (s.outIdx + 1) % CAPACITY;
      c.vehicle = v;
      c.phase = 'unlock';
      s.stage = { name: 'ACCESS', actor: 'CONSUMER' };
      setAnim(s, 'remove', v, slot);
      addLog(s, now, 'CONSUMER', `${vid(v)} removed from slot ${slot + 1}`, 'success');
      return true;
    }

    case 'unlock': {
      // signal(mutex) then signal(empty)
      s.mutex = null;
      s.empty += 1;
      c.phase = 'process';
      s.stage = { name: 'UNLOCK', actor: 'CONSUMER' };
      addLog(s, now, 'MUTEX', 'Released', 'success');
      addLog(s, now, 'SEMAPHORE', `signal(empty) → empty = ${s.empty}`, 'info');
      if (s.producer.blocked) {
        s.producer.blocked = false; // wake up the producer
        addLog(s, now, 'STATUS', 'Slot available', 'success');
        addLog(s, now, 'PRODUCER', 'Woken up — resuming', 'success');
        setNotice(s, 'SPACE AVAILABLE', 'success');
        setTip(s, 'The consumer freed a slot. The producer can continue.', 'success', 2);
      }
      if (bufferCount(s) === 0) addLog(s, now, 'STATUS', 'Buffer is now empty', 'info');
      return true;
    }

    case 'process': {
      s.stats.consumed += 1;
      c.phase = 'check';
      s.stage = { name: 'CONSUME', actor: 'CONSUMER' };
      addLog(s, now, 'CONSUMER', `${vid(c.vehicle)} processed`, 'success');
      return true;
    }
    default:
      return false;
  }
}

/* ------------------------------- STEP -------------------------------- */

/** Executes exactly one synchronization event. */
export function step(state, now) {
  if (state.status === 'COMPLETED') return state;
  const s = clone(state);

  // The scheduler picks the next actor from the pattern. If that actor has
  // nothing observable to do (e.g. it is already asleep), move on to the next.
  for (let i = 0; i < PATTERN.length; i++) {
    const who = PATTERN[s.patternIdx];
    s.patternIdx = (s.patternIdx + 1) % PATTERN.length;
    const acted = who === 'P' ? producerStep(s, now) : consumerStep(s, now);
    if (acted) {
      s.tick += 1;
      s.lastActor = who === 'P' ? 'PRODUCER' : 'CONSUMER';
      break;
    }
  }

  if (s.producer.done && s.stats.consumed === TOTAL_VEHICLES) {
    s.status = 'COMPLETED';
    s.stage = null;
    s.lastActor = null;
    addLog(s, now, 'SYSTEM', `Simulation completed — ${TOTAL_VEHICLES} vehicles processed`, 'success');
    setTip(s, 'All vehicles were produced and consumed with zero race conditions.', 'success', 5);
  }
  return s;
}

/* ------------------------------ selectors ----------------------------- */

/** 'WAITING' | 'ACTIVE' | 'IDLE' for 'producer' or 'consumer'. */
export function actorStatus(s, who) {
  const a = s[who];
  if (a.blocked) return 'WAITING';
  if (s.status === 'COMPLETED' || s.status === 'READY') return 'IDLE';
  if (who === 'producer' && a.done) return 'IDLE';
  return s.lastActor === who.toUpperCase() ? 'ACTIVE' : 'IDLE';
}

/* ------------------------------ reducer ------------------------------- */

export function reducer(state, action) {
  switch (action.type) {
    case 'START': {
      let base = state.status === 'COMPLETED' ? createInitialState() : { ...state };
      if (base.status === 'READY') {
        base = clone(base);
        addLog(base, action.now, 'SYSTEM', 'Simulation started', 'info');
      }
      return { ...base, status: 'RUNNING' };
    }
    case 'PAUSE':
      return state.status === 'RUNNING' ? { ...state, status: 'PAUSED' } : state;
    case 'RESET':
      return createInitialState();
    case 'TICK':
      return state.status === 'RUNNING' ? step(state, action.now) : state;
    case 'STEP': {
      if (state.status === 'COMPLETED') return state;
      const base = state.status === 'RUNNING' ? state : { ...state, status: 'PAUSED' };
      return step(base, action.now);
    }
    case 'CLEAR_LOG':
      return { ...state, log: [] };
    default:
      return state;
  }
}

/* ------------------------- LIVE VERIFICATION -------------------------- */

/**
 * Independent invariant checks, recomputed from the raw state on every render.
 * They do NOT trust the engine's own flags, so a PASS here is real evidence.
 */
export function verify(s) {
  const count = bufferCount(s);
  const p = s.producer;
  const c = s.consumer;

  const pInside = p.phase === 'insert' || p.phase === 'unlock';
  const cInside = c.phase === 'remove' || c.phase === 'unlock';
  const mutexOk =
    !(pInside && cInside) &&
    (!pInside || s.mutex === 'PRODUCER') &&
    (!cInside || s.mutex === 'CONSUMER');

  const inflight =
    (['lock', 'insert', 'unlock'].includes(p.phase) ? 1 : 0) +
    (['lock', 'remove', 'unlock'].includes(c.phase) ? 1 : 0);
  const sum = s.empty + s.full + inflight;

  const held = c.phase === 'unlock' || c.phase === 'process' ? 1 : 0;
  const diff = s.stats.produced - s.stats.consumed;

  return {
    bounds: { ok: count >= 0 && count <= CAPACITY, value: `${count} of ${CAPACITY} slots used` },
    mutex: {
      ok: mutexOk,
      value: pInside || cInside ? `${s.mutex || '?'} inside · other blocked` : 'nobody inside',
    },
    tokens: { ok: sum === CAPACITY, value: `${s.empty} + ${s.full} + ${inflight} = ${sum}` },
    conserve: { ok: diff === count + held, value: `${s.stats.produced} − ${s.stats.consumed} = ${count} + ${held}` },
  };
}

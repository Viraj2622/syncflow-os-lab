import { useCallback, useEffect, useReducer, useState } from 'react';
import { createInitialState, reducer } from './engine';

export const BASE_TICK_MS = 1000;

/**
 * Connects the pure engine to React: owns the clock (setInterval) and the
 * UI-only settings (speed, auto mode, teaching mode).
 */
export function useSimulation() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [speed, setSpeed] = useState(1);
  const [auto, setAuto] = useState(true);
  const [teaching, setTeaching] = useState(true);

  // Simulation clock — runs only while RUNNING and AUTO is on
  useEffect(() => {
    if (state.status !== 'RUNNING' || !auto) return undefined;
    const id = setInterval(
      () => dispatch({ type: 'TICK', now: Date.now() }),
      BASE_TICK_MS / speed
    );
    return () => clearInterval(id);
  }, [state.status, auto, speed]);

  const start = useCallback(() => {
    setAuto(true);
    dispatch({ type: 'START', now: Date.now() });
  }, []);
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const stepOnce = useCallback(() => dispatch({ type: 'STEP', now: Date.now() }), []);
  const clearLog = useCallback(() => dispatch({ type: 'CLEAR_LOG' }), []);
  const toggleAuto = useCallback(() => {
    setAuto((a) => {
      if (a) dispatch({ type: 'PAUSE' }); // switching to manual pauses the clock
      return !a;
    });
  }, []);

  return {
    state,
    speed,
    setSpeed,
    auto,
    toggleAuto,
    teaching,
    setTeaching,
    start,
    pause,
    reset,
    stepOnce,
    clearLog,
  };
}

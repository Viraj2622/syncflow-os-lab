import { Play, Pause, RotateCcw, StepForward, GraduationCap, Zap } from 'lucide-react';

export default function Controls({ sim }) {
  const { state } = sim;
  const running = state.status === 'RUNNING';
  const completed = state.status === 'COMPLETED';

  return (
    <section className="controls" aria-label="Simulation controls">
      <div className="controls-group">
        <button className="btn btn-primary" onClick={sim.start} disabled={running}>
          <Play size={15} /> {completed ? 'RESTART' : state.status === 'PAUSED' ? 'RESUME' : 'START'}
        </button>
        <button className="btn" onClick={sim.pause} disabled={!running}>
          <Pause size={15} /> PAUSE
        </button>
        <button className="btn" onClick={sim.stepOnce} disabled={completed}>
          <StepForward size={15} /> STEP
        </button>
        <button className="btn" onClick={sim.reset}>
          <RotateCcw size={15} /> RESET
        </button>
      </div>

      <div className="controls-group">
        <div className="segmented" role="group" aria-label="Speed">
          <span className="seg-label">SPEED</span>
          {[0.5, 1, 2].map((v) => (
            <button
              key={v}
              className={`seg ${sim.speed === v ? 'seg-on' : ''}`}
              onClick={() => sim.setSpeed(v)}
            >
              {v}x
            </button>
          ))}
        </div>

        <Toggle icon={<Zap size={14} />} label="AUTO SIMULATION" on={sim.auto} onClick={sim.toggleAuto} />
        <Toggle
          icon={<GraduationCap size={14} />}
          label="TEACHING MODE"
          on={sim.teaching}
          onClick={() => sim.setTeaching((t) => !t)}
        />
      </div>
    </section>
  );
}

function Toggle({ icon, label, on, onClick }) {
  return (
    <button className={`toggle ${on ? 'toggle-on' : ''}`} onClick={onClick} role="switch" aria-checked={on}>
      {icon}
      <span>{label}</span>
      <span className="switch">
        <span className="knob" />
      </span>
    </button>
  );
}

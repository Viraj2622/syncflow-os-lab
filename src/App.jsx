import { useSimulation } from './sim/useSimulation';
import Header from './components/Header';
import Explainer from './components/Explainer';
import Controls from './components/Controls';
import { ProducerCard, BufferPanel, ConsumerCard, Connector } from './components/Stage';
import TeachingConsole from './components/TeachingConsole';
import Timeline from './components/Timeline';
import { EmptySemaphore, FullSemaphore, MutexCard, CriticalSection } from './components/SyncPanel';
import Conditions from './components/Conditions';
import EventLog from './components/EventLog';
import SystemState from './components/SystemState';
import Summary from './components/Summary';

export default function App() {
  const sim = useSimulation();
  const { state } = sim;
  const running = state.status === 'RUNNING';

  return (
    <div className={`app ${running ? 'app-running' : ''}`} style={{ '--tick': `${1000 / sim.speed}ms` }}>
      <Header state={state} />

      <main className="container">
        <Explainer running={running} />
        <Controls sim={sim} />

        {/* ---- Central simulation: Producer -> Buffer -> Consumer ---- */}
        <section className="stage" aria-label="Simulation">
          <ProducerCard state={state} />
          <Connector state={state} kind="insert" running={running} />
          <BufferPanel state={state} />
          <Connector state={state} kind="remove" running={running} />
          <ConsumerCard state={state} />
        </section>

        {/* ---- All four conditions + invariants, side by side ---- */}
        <Conditions state={state} />

        <TeachingConsole state={state} enabled={sim.teaching} />

        <Timeline state={state} />

        <section className="grid-4" aria-label="Synchronization primitives">
          <EmptySemaphore state={state} />
          <FullSemaphore state={state} />
          <MutexCard state={state} />
          <CriticalSection state={state} />
        </section>

        <section className="grid-log">
          <EventLog state={state} onClear={sim.clearLog} />
          <SystemState state={state} />
        </section>

        <Summary state={state} />

        <footer className="footer">
          SYNCFLOW · Operating Systems Laboratory · Bounded-Buffer Problem with
          semaphores <code>empty</code>, <code>full</code> and <code>mutex</code>
        </footer>
      </main>
    </div>
  );
}

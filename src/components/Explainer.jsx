import { ParkingSquare, Database, Server, ArrowRight } from 'lucide-react';

export default function Explainer({ running }) {
  return (
    <section className="panel explainer">
      <div className="explainer-text">
        <div className="eyebrow">What are we simulating?</div>
        <p>
          The <b>Smart Parking Gate</b> acts as the <b>Producer</b> and the{' '}
          <b>Parking Management System</b> acts as the <b>Consumer</b>. Vehicle
          requests move through a shared buffer with limited capacity (2 slots).
        </p>
      </div>
      <div className={`flow ${running ? 'flow-on' : ''}`}>
        <div className="flow-node">
          <ParkingSquare size={16} />
          <span>Smart Parking Gate</span>
        </div>
        <ArrowRight size={16} className="flow-arrow" />
        <div className="flow-node flow-node-mid">
          <Database size={16} />
          <span>Shared Buffer</span>
        </div>
        <ArrowRight size={16} className="flow-arrow" />
        <div className="flow-node">
          <Server size={16} />
          <span>Parking Management System</span>
        </div>
      </div>
    </section>
  );
}

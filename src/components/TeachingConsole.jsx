import { GraduationCap } from 'lucide-react';

export default function TeachingConsole({ state, enabled }) {
  if (!enabled) return null;
  const tip = state.tip;
  return (
    <section className={`teach ${tip ? `teach-${tip.tone}` : ''}`} aria-live="polite">
      <GraduationCap size={18} />
      <div>
        <div className="eyebrow">TEACHING MODE</div>
        {tip ? (
          <p key={tip.seq} className="teach-text">{tip.text}</p>
        ) : (
          <p className="teach-text muted">Press START — short explanations of important events will appear here.</p>
        )}
      </div>
    </section>
  );
}

import { ExternalLink } from 'lucide-react';
import { ECOSYSTEM_SURFACES } from '../../lib/constants/ecosystemLinks';

export function SurfacesStrip() {
  return (
    <section className="panel surfaces-strip">
      <h2 className="surfaces-strip__title">One engine, several surfaces</h2>
      <p className="muted surfaces-strip__lead">
        Upload and validate here with the same JSON envelopes the worker and CLI use — pick the surface that fits your
        workflow.
      </p>
      <ul className="surfaces-strip__grid">
        {ECOSYSTEM_SURFACES.map((s) => (
          <li key={s.id} className={`surfaces-strip__card${s.id === 'web' ? ' surfaces-strip__card--here' : ''}`}>
            <div className="surfaces-strip__card-head">
              <strong>{s.label}</strong>
              {s.id === 'web' ? <span className="ok-pill">You are here</span> : null}
            </div>
            {s.description ? <p className="muted surfaces-strip__card-desc">{s.description}</p> : null}
            <div className="surfaces-strip__card-foot">
              {s.id !== 'web' ? (
                <a className="surfaces-strip__btn" href={s.href} target="_blank" rel="noopener noreferrer">
                  Open {s.label}
                  <ExternalLink size={14} aria-hidden />
                </a>
              ) : (
                <span className="surfaces-strip__btn surfaces-strip__btn--static" aria-current="page">
                  Hosted workspace
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

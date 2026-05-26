import type { SurfacesStripProps } from '../../types/surfaces/index.js';

function IconExternal(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function SurfacesStrip({
  surfaces,
  activeSurfaceId,
  activeHereLabel,
  title = 'One engine, several surfaces',
  lead = 'Upload and validate here with the same JSON envelopes the worker and CLI use — pick the surface that fits your workflow.',
}: SurfacesStripProps): JSX.Element {
  return (
    <section className="panel surfaces-strip">
      <h2 className="surfaces-strip__title">{title}</h2>
      <p className="muted surfaces-strip__lead">{lead}</p>
      <ul className="surfaces-strip__grid">
        {surfaces.map((s) => {
          const isHere = s.id === activeSurfaceId;
          return (
            <li key={s.id} className={`surfaces-strip__card${isHere ? ' surfaces-strip__card--here' : ''}`}>
              <div className="surfaces-strip__card-head">
                <strong>{s.label}</strong>
                {isHere ? <span className="ok-pill">You are here</span> : null}
              </div>
              {s.description ? <p className="muted surfaces-strip__card-desc">{s.description}</p> : null}
              <div className="surfaces-strip__card-foot">
                {!isHere ?
                  <a className="surfaces-strip__btn" href={s.href} target="_blank" rel="noopener noreferrer">
                    Open {s.label}
                    <IconExternal />
                  </a>
                : <span className="surfaces-strip__btn surfaces-strip__btn--static" aria-current="page">
                    {activeHereLabel ?? s.label}
                  </span>
                }
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

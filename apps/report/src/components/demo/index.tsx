/**
 * Demo-only UI for the hosted report subdomain (e.g. marketing / CepatEdge demo).
 *
 * **Not** embedded in normal CLI-generated HTML reports. Safe to import in custom
 * builds or remove once the demo page is finalized.
 *
 * @module components/demo
 */

export type DemoBadgePlacement = 'header' | 'footer';

export type DemoBadgeProps = {
  /** Tooltip opens below the badge in the header, above in the footer (keeps text in view). */
  placement: DemoBadgePlacement;
};

/**
 * Temporary “demo” pill with an explanatory tooltip. Used only in the demo
 * report build — remove imports from shell header/footer when the standalone
 * demo page is done.
 */
export function DemoBadge({ placement }: DemoBadgeProps): JSX.Element {
  return (
    <span
      className="demo-badge"
      data-side={placement}
      tabIndex={0}
      role="note"
      aria-label="Demo build notice"
    >
      <span className="demo-badge__label">Demo</span>
      <span className="demo-badge__tip" role="tooltip">
        Real project report data. Reset or compare against <strong>CepatEdge</strong>. This preview is served on our demo
        subdomain — it is not part of the default HTML bundle from{' '}
        <code className="mono">i18nprune report</code>.
      </span>
    </span>
  );
}


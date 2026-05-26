import { Link } from 'react-router-dom';
import { CopyPathButton } from '../../components/CopyPathButton.js';
import { OverviewShareActions } from '../../components/overview/OverviewShareActions.js';
import { CLI_NAME } from '../../constants/cli.js';
import { reportPageTitle } from '../../constants/brand.js';
import { useReport, useReportBootstrap } from '../../context/report/hooks.js';
import { inferRuntimeFamily } from '../../lib/editor/deepLinks.js';
import { printReportTable } from '../../lib/printTable.js';
import { computeRiskScore } from '../../lib/risk/index.js';
import type { ProjectReportDocument } from '../../types/index.js';

function envRow(label: string, value: string | undefined): JSX.Element {
  return (
    <div className="path-row">
      <span className="path-label">{label}</span>
      <span className="path-value">{value && value !== '' ? value : '—'}</span>
    </div>
  );
}

function PathRowCopy({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="path-row">
      <span className="path-label">{label}</span>
      <div className="path-row__row">
        <span className="path-value">{value}</span>
        <CopyPathButton text={value} />
      </div>
    </div>
  );
}

function overviewPrintRows(doc: ProjectReportDocument): string[][] {
  const { summary, project } = doc;
  const risk = computeRiskScore(summary);
  const env = project.environment;
  const rows: string[][] = [
    ['Risk score (v1)', String(risk.score)],
    ['Risk level', risk.level],
    ['Missing keys', String(summary.missingKeysCount)],
    ['Dynamic sites', String(summary.dynamicSitesCount)],
    ['Key observations', String(summary.keyObservationsCount)],
    ...(summary.sourceFilesScannedCount !== undefined
      ? [['Source files scanned (src root)', String(summary.sourceFilesScannedCount)]]
      : []),
    ['Status', summary.ok ? 'OK' : 'Action needed'],
    ['Working directory', project.cwd],
    ['Source locale file', project.sourceLocalePath],
    ['Locales directory', project.localesDir],
    ['Scan root (src)', project.srcRoot],
  ];
  if (project.sourceLocaleTag) {
    rows.push(['Source locale tag', project.sourceLocaleTag]);
  }
  if (env) {
    rows.push(['Platform', `${env.platform} (${env.arch})`]);
    rows.push(['Runtime family', inferRuntimeFamily(env) ?? '—']);
    if (env.wslDistroName) rows.push(['WSL distro name', env.wslDistroName]);
    rows.push(['Node.js', env.nodeVersion]);
    rows.push(['OS / kernel', env.osRelease]);
    if (env.distro) rows.push(['Distro', env.distro]);
  }
  return rows;
}

export function OverviewPage(): JSX.Element {
  const bootstrap = useReportBootstrap();
  const doc = useReport();
  const { summary, project } = doc;
  const risk = computeRiskScore(summary);
  const env = project.environment;
  const reportTitle = reportPageTitle(doc.toolVersion);
  const hostedId = bootstrap.source === 'worker' ? bootstrap.workerReportId : null;

  return (
    <div>
      <div className="page-title-row">
        <h1 className="page-title page-title--inline">Overview</h1>
        <div className="overview-title-actions no-print">
          <OverviewShareActions />
          <button
            type="button"
            className="theme-btn overview-action-btn"
            onClick={() =>
              printReportTable({
                reportTitle,
                sectionTitle: 'Overview',
                headers: ['Field', 'Value'],
                rows: overviewPrintRows(doc),
                metaLine: 'Overview · embedded snapshot',
              })
            }
          >
            Print…
          </button>
        </div>
      </div>

      <section className="card overview-report-meta">
        <h2 className="overview-report-meta__heading">This report</h2>
        <dl className="overview-report-meta__list">
          <div className="overview-report-meta__row">
            <dt>Generated</dt>
            <dd className="mono">{doc.generatedAt}</dd>
          </div>
          {doc.toolVersion ?
            <div className="overview-report-meta__row">
              <dt>CLI version</dt>
              <dd className="mono">{doc.toolVersion}</dd>
            </div>
          : null}
          <div className="overview-report-meta__row">
            <dt>Source</dt>
            <dd>
              {bootstrap.source === 'worker' ?
                'Hosted worker'
              : bootstrap.source === 'import' ?
                'Imported JSON'
              : 'Embedded in HTML'}
            </dd>
          </div>
          {hostedId ?
            <div className="overview-report-meta__row">
              <dt>Report id</dt>
              <dd className="mono">{hostedId}</dd>
            </div>
          : null}
        </dl>
      </section>

      <div className="grid stats">
        <div className="card">
          <h2>Risk score (v1)</h2>
          <div className="risk-line">
            <span className={`stat-value risk-${risk.level}`}>{risk.score}</span>
            <span className={`badge risk-badge risk-${risk.level}`}>{risk.level}</span>
          </div>
          <p className="risk-formula">missing×5 + dynamic×2</p>
          <Link to="/heatmap" className="mono" style={{ fontSize: '0.85rem' }}>
            View hotspots →
          </Link>
        </div>
        <div className="card">
          <h2>Missing keys</h2>
          <div className={`stat-value ${summary.ok ? 'ok' : 'bad'}`}>{summary.missingKeysCount}</div>
          <p className="card-stat-sub">
            Dotted keys used in code but missing from the configured <span className="mono">source locale</span> JSON (
            same file <span className="mono">validate</span> checks).
          </p>
        </div>
        <div className="card">
          <h2>Dynamic sites</h2>
          <div className="stat-value warn">{summary.dynamicSitesCount}</div>
          {summary.sourceFilesScannedCount != null ? (
            <p className="card-stat-sub">
              Non-literal call sites across {summary.sourceFilesScannedCount} source files under the scan root.
            </p>
          ) : null}
        </div>
        <div className="card">
          <h2>Key observations</h2>
          <div className="stat-value">{summary.keyObservationsCount}</div>
          {summary.sourceFilesScannedCount != null ? (
            <p className="card-stat-sub">
              Literal/template key usages from {summary.sourceFilesScannedCount} source files under the scan root.
            </p>
          ) : null}
        </div>
        <div className="card">
          <h2>Status</h2>
          <div className={`stat-value ${summary.ok ? 'ok' : 'bad'}`}>{summary.ok ? 'OK' : 'Action needed'}</div>
        </div>
      </div>
      <div className="card overview-paths" style={{ marginTop: '1rem' }}>
        <h2>Project paths</h2>
        <p className="overview-paths__hint">
          Paths are from the machine that ran{' '}
          <span className="mono">
            {CLI_NAME} report
          </span>{' '}
          (the working directory
          and scan roots below).
        </p>
        <div className="path-list">
          <PathRowCopy label="Working directory" value={project.cwd} />
          <PathRowCopy label="Source locale file" value={project.sourceLocalePath} />
          <PathRowCopy label="Locales directory" value={project.localesDir} />
          <PathRowCopy label="Scan root (src)" value={project.srcRoot} />
          {project.sourceLocaleTag ? <PathRowCopy label="Source locale tag" value={project.sourceLocaleTag} /> : null}
        </div>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>Environment</h2>
        {env ? (
          <div className="path-list">
            {envRow('Platform', `${env.platform} (${env.arch})`)}
            {envRow('Runtime family', inferRuntimeFamily(env) ?? '—')}
            {env.wslDistroName ? envRow('WSL distro name', env.wslDistroName) : null}
            {envRow('Node.js', env.nodeVersion)}
            {envRow('OS / kernel', env.osRelease)}
            {envRow('Distro', env.distro)}
          </div>
        ) : (
          <p className="overview-env-missing">
            Not recorded in this report file. Regenerate with a current CLI build to embed OS and runtime details.
          </p>
        )}
      </div>
    </div>
  );
}

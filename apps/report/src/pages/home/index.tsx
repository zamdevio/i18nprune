import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SurfacesStrip } from '@i18nprune/ui/react/surfaces';
import { ReportHero } from '../../components/home/ReportHero.js';
import { OpenSharedLinkPanel } from '../../components/open-shared-link/index.js';
import {
  ReportImportPanel,
  type ReportImportChooserActions,
} from '../../components/report-import/ReportImportPanel.js';
import { ShareHistorySection } from '../../components/share-history/ShareHistorySection.js';
import { REPORT_ECOSYSTEM_SURFACES } from '../../constants/ecosystemSurfaces.js';
import { useReportBootstrap } from '../../context/report/hooks.js';
import { loadDemoPayloadResult } from '../../data/loader/index.js';

function ReportLoadingPanel({ reportId }: { reportId: string }): JSX.Element {
  return (
    <div className="page-panel report-loading-panel" role="status" aria-live="polite">
      <div className="report-loading-panel__spinner" aria-hidden />
      <p className="report-loading-panel__title">Loading hosted report</p>
      <p className="report-loading-panel__id mono">{reportId}</p>
      <p className="muted report-loading-panel__hint">Fetching from your configured worker…</p>
    </div>
  );
}

export function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const bootstrap = useReportBootstrap();
  const importChooserRef = useRef<ReportImportChooserActions | null>(null);

  if (bootstrap.phase === 'loading-remote' && bootstrap.loadingReportId) {
    return (
      <div className="page page--home">
        <ReportLoadingPanel reportId={bootstrap.loadingReportId} />
      </div>
    );
  }

  return (
    <div className="page page--home">
      <SurfacesStrip
        surfaces={REPORT_ECOSYSTEM_SURFACES}
        activeSurfaceId="report"
        activeHereLabel="Hosted report"
      />

      <ReportHero
        onChooseZip={() => importChooserRef.current?.chooseZip()}
        onChooseJson={() => importChooserRef.current?.chooseJson()}
      />

      <OpenSharedLinkPanel
        onOpen={(id) => {
          bootstrap.openSharedReport(id);
          navigate({ pathname: '/', search: `?id=${encodeURIComponent(id)}` });
        }}
      />

      <section className="panel report-import-section">
        <ReportImportPanel
          onRegisterChooser={(actions) => {
            importChooserRef.current = actions;
          }}
          onLoaded={() => {
            navigate('/overview');
          }}
        />
        {import.meta.env.DEV ?
          <div className="home-demo-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const demo = loadDemoPayloadResult();
                if (demo.ok) {
                  bootstrap.setDocFromDocument(demo.doc);
                  navigate('/overview');
                }
              }}
            >
              Load demo report
            </button>
            <span className="muted">Dev only — sample overview data</span>
          </div>
        : null}
      </section>

      <ShareHistorySection />
    </div>
  );
}

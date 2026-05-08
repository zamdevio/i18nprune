import { getDocsUrl } from '@i18nprune/core';
import type { Issue } from '@i18nprune/core/types';
import { WorkspaceIssuesPanel } from '../../components/workspace/WorkspaceIssuesPanel';
import { JsonViewer } from '../../components/ui/json';

type Props = {
  resultTitle: string;
  responseDataForViewer: unknown;
  workspaceIssues: readonly Issue[];
  projectId: string;
  latestCurl: string;
};

export function Result({
  resultTitle,
  responseDataForViewer,
  workspaceIssues,
  projectId,
  latestCurl,
}: Props) {
  return (
    <section className="panel workspace-result">
      <h2 className="workspace-result__title">{resultTitle}</h2>
      {resultTitle.toLowerCase().includes('report') ? (
        <p className="muted">
          Tip: use download/copy below, then paste or import into{' '}
          <a href="https://report.i18nprune.dev" target="_blank" rel="noreferrer">
            report.i18nprune.dev
          </a>{' '}
          for full visualization. Docs:{' '}
          <a href={getDocsUrl('report/README')} target="_blank" rel="noreferrer">
            report UI
          </a>
          .
        </p>
      ) : null}
      <WorkspaceIssuesPanel issues={workspaceIssues} />
      <JsonViewer
        title="Raw JSON"
        payload={responseDataForViewer}
        collapsed
        fileName={`${projectId || 'runtime-web-result'}.json`}
        curlCommand={latestCurl}
      />
    </section>
  );
}

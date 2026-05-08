import { issueCodeDocHref } from '@i18nprune/core';
import type { Issue } from '@i18nprune/core/types';

type Props = {
  issues: readonly Issue[];
};

function documentationHref(issue: Issue): string | undefined {
  if (issue.docHref) return issue.docHref;
  if (issue.code.startsWith('i18nprune.')) return issueCodeDocHref(issue.code);
  return undefined;
}

function severityLabel(sev: Issue['severity']): string {
  if (sev === 'error') return 'Error';
  if (sev === 'warning') return 'Warning';
  return 'Info';
}

export function WorkspaceIssuesPanel({ issues }: Props) {
  if (issues.length === 0) return null;

  return (
    <div className="workspace-issues">
      <h3 className="workspace-issues__title">Structured issues</h3>
      <p className="muted workspace-issues__hint">
        Issue codes match the CLI; doc URLs use <code>@i18nprune/core</code> (<code>issueCodeDocHref</code> /{' '}
        <code>enrichIssuesWithDocHrefs</code>).
      </p>
      <ul className="workspace-issues__list">
        {issues.map((issue, i) => {
          const href = documentationHref(issue);
          return (
          <li key={`${issue.code}-${i}`} className={`workspace-issues__item workspace-issues__item--${issue.severity}`}>
            <span className="workspace-issues__sev">{severityLabel(issue.severity)}</span>
            <code className="workspace-issues__code">{issue.code}</code>
            <span className="workspace-issues__msg">{issue.message}</span>
            {issue.path ? (
              <span className="workspace-issues__path">
                <code>{issue.path}</code>
              </span>
            ) : null}
            {href ? (
              <a className="workspace-issues__doc" href={href} target="_blank" rel="noreferrer">
                Docs
              </a>
            ) : null}
          </li>
          );
        })}
      </ul>
    </div>
  );
}

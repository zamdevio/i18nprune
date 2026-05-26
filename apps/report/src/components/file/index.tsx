import React from 'react';
import { useReport } from '../../context/report/hooks.js';
import { useEditorOpener } from '../../context/editor/index.js';
import { buildEditorHref, canUseEditorDeepLinks } from '../../lib/editor/index.js';
import { toAbsolutePath } from '../../lib/paths/index.js';

type Props = {
  /** Path as in the report (relative to cwd or absolute). */
  filePath: string;
  children: React.ReactNode;
  className?: string;
};

export function FileLink({ filePath, children, className }: Props): JSX.Element {
  const { project } = useReport();
  const { opener } = useEditorOpener();
  const abs = toAbsolutePath(project.cwd, filePath);
  const allowed = canUseEditorDeepLinks(project.environment);
  const href = buildEditorHref(abs, opener, {
    wslDistroName: project.environment?.wslDistroName,
  });

  if (!allowed) {
    return (
      <span className={className} title="Editor deep links disabled — embedded environment data is insufficient for stable paths.">
        {children}
      </span>
    );
  }

  return (
    <a className={className} href={href} title={`Open in ${opener}`}>
      {children}
    </a>
  );
}

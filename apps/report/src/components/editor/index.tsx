import React from 'react';
import { useReport } from '../../context/report/index.js';
import { useEditorOpener } from '../../context/editor/index.js';
import { canUseEditorDeepLinks } from '../../lib/editor/index.js';
import { useDesktopReportChrome } from '../../lib/desktop/index.js';
import type { EditorOpener } from '../../lib/editor/index.js';
import { ToolbarDropdown } from '../ToolbarDropdown.js';

const OPTIONS: { value: EditorOpener; label: string }[] = [
  { value: 'vscode', label: 'VS Code' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'file', label: 'file://' },
];

export function EditorPreferenceDropdown(): JSX.Element {
  const desktop = useDesktopReportChrome();
  const { project } = useReport();
  const { opener, setOpener } = useEditorOpener();
  const allowed = canUseEditorDeepLinks(project.environment);

  if (!desktop) return <></>;

  if (!allowed) {
    return (
      <div
        className="editor-unavailable no-print"
        title="Open in editor is disabled because this report does not include enough environment metadata to build stable vscode:// or cursor:// links for your OS (e.g. WSL distro name missing on WSL)."
      >
        <span className="editor-unavailable__text">Editor links off</span>
      </div>
    );
  }

  return (
    <ToolbarDropdown
      prefix="Open files"
      ariaLabel="Preferred editor for file links"
      options={OPTIONS}
      value={opener}
      onChange={setOpener}
    />
  );
}

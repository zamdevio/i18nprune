import { useEditorOpener } from '../../context/editor/index.js';
import { useOptionalReport } from '../../context/report/hooks.js';
import {
  canUseEditorDeepLinks,
  EDITOR_OPENER_OPTIONS,
} from '../../lib/editor/index.js';
import { useDesktopReportChrome } from '../../lib/desktop/index.js';
import { ToolbarDropdown } from '@i18nprune/ui/react/toolbar';

type Props = {
  /** Header: compact control. Sidebar: full width with hints. */
  layout?: 'header' | 'sidebar';
};

export function EditorPreferenceDropdown({ layout = 'header' }: Props): JSX.Element {
  const desktop = useDesktopReportChrome();
  const doc = useOptionalReport();
  const { opener, setOpener } = useEditorOpener();
  const allowed = doc ? canUseEditorDeepLinks(doc.project.environment) : true;

  if (!desktop) {
    if (layout === 'sidebar') {
      return (
        <p className="muted settings-editor-hint">
          Editor deep links are only available in the desktop report shell (not in a plain browser tab).
        </p>
      );
    }
    return <></>;
  }

  if (doc && !allowed) {
    if (layout === 'header') {
      return (
        <span
          className="editor-unavailable editor-unavailable--compact"
          title="Editor links off — report metadata is insufficient for vscode:// / cursor:// URLs."
        >
          Editor off
        </span>
      );
    }
    return (
      <div
        className="editor-unavailable"
        title="Open in editor is disabled because this report does not include enough environment metadata to build stable editor deep links for your OS (e.g. WSL distro name missing on WSL)."
      >
        <span className="editor-unavailable__text">Editor links off for this report</span>
      </div>
    );
  }

  return (
    <ToolbarDropdown
      className={
        layout === 'header' ?
          'toolbar-dropdown--header-editor toolbar-dropdown--compact-header'
        : undefined
      }
      prefix={layout === 'header' ? 'Editor' : 'Open files'}
      ariaLabel="Preferred editor for file links"
      options={[...EDITOR_OPENER_OPTIONS]}
      value={opener}
      onChange={setOpener}
    />
  );
}

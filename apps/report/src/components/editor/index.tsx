import { useEditorOpener } from '../../context/editor/index.js';
import {
  EDITOR_OPENER_OPTIONS,
  linkPolicyReasonMessage,
} from '../../lib/open-in-editor/index.js';
import { useEditorLinkSession } from '../../lib/open-in-editor/hooks/useEditorLinkSession.js';
import { ToolbarDropdown } from '@i18nprune/ui/react/toolbar';

type Props = {
  /** Header: compact control. Sidebar: full width with hints. */
  layout?: 'header' | 'sidebar';
};

export function EditorPreferenceDropdown({ layout = 'header' }: Props): JSX.Element {
  const { opener, setOpener } = useEditorOpener();
  const { policy, generator } = useEditorLinkSession();

  if (!policy.allow) {
    const message = linkPolicyReasonMessage(
      policy.reason,
      generator.family === 'unsupported' ? undefined : generator.family,
    );

    if (layout === 'header') {
      return (
        <span
          className="editor-unavailable editor-unavailable--compact"
          title={message}
        >
          Editor off
        </span>
      );
    }

    return (
      <div className="editor-unavailable" title={message}>
        <span className="editor-unavailable__text">Editor links unavailable</span>
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

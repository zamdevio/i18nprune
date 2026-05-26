import React from 'react';
import { CopyPathButton } from '../CopyPathButton.js';
import { useEditorOpener } from '../../context/editor/index.js';
import { useEditorLinkSession } from '../../lib/open-in-editor/hooks/useEditorLinkSession.js';
import {
  buildOpenUri,
  copyPathForFallback,
  linkPolicyReasonMessage,
  EDITOR_OPENER_OPTIONS,
} from '../../lib/open-in-editor/index.js';

type Props = {
  /** Path as in the report (relative to cwd or absolute). */
  filePath: string;
  children: React.ReactNode;
  className?: string;
};

function editorLabel(id: string): string {
  return EDITOR_OPENER_OPTIONS.find((o) => o.value === id)?.label ?? id;
}

export function FileLink({ filePath, children, className }: Props): JSX.Element {
  const { opener } = useEditorOpener();
  const { policy, generator, cwd } = useEditorLinkSession();

  const copyText = copyPathForFallback({ cwd, payloadPath: filePath });
  const denyMessage = !policy.allow
    ? linkPolicyReasonMessage(
        policy.reason,
        generator.family === 'unsupported' ? undefined : generator.family,
      )
    : '';

  if (!policy.allow) {
    return (
      <span className={`file-link file-link--disabled${className ? ` ${className}` : ''}`}>
        <span title={denyMessage}>{children}</span>
        <CopyPathButton text={copyText} label="Copy path" />
      </span>
    );
  }

  const built = buildOpenUri({
    policy,
    generatorFamily: generator.family,
    editorId: opener,
    cwd,
    payloadPath: filePath,
  });

  if (!built.ok) {
    return (
      <span className={className} title="Editor link unavailable.">
        {children}
      </span>
    );
  }

  return (
    <a className={className} href={built.uri} title={`Open in ${editorLabel(opener)}`}>
      {children}
    </a>
  );
}

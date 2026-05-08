import { useEffect, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import { copyText, downloadJsonFile } from './helpers';

type BtnState = 'idle' | 'copied' | 'error';

type JsonViewerProps = {
  title: string;
  payload: unknown | null | undefined;
  collapsed?: boolean;
  fileName: string;
  curlCommand?: string;
};

const EMPTY_HINT = 'Processed JSON output will be displayed here after you run an operation.';

export function JsonViewer({ title, payload, collapsed = true, fileName, curlCommand }: JsonViewerProps) {
  const [open, setOpen] = useState(!collapsed);
  const [copyJsonState, setCopyJsonState] = useState<BtnState>('idle');
  const [copyCurlState, setCopyCurlState] = useState<BtnState>('idle');

  const empty = payload === null || payload === undefined;
  const jsonText = empty ? '' : JSON.stringify(payload, null, 2);
  const html = empty ? '' : Prism.highlight(jsonText, Prism.languages.json, 'json');

  useEffect(() => {
    if (copyJsonState !== 'copied' && copyJsonState !== 'error') return;
    const t = window.setTimeout(() => setCopyJsonState('idle'), 2000);
    return () => window.clearTimeout(t);
  }, [copyJsonState]);

  useEffect(() => {
    if (copyCurlState !== 'copied' && copyCurlState !== 'error') return;
    const t = window.setTimeout(() => setCopyCurlState('idle'), 2000);
    return () => window.clearTimeout(t);
  }, [copyCurlState]);

  async function onCopyJson(): Promise<void> {
    if (empty) return;
    try {
      await copyText(jsonText);
      setCopyJsonState('copied');
    } catch {
      setCopyJsonState('error');
    }
  }

  async function onCopyCurl(): Promise<void> {
    if (!curlCommand) return;
    try {
      await copyText(curlCommand);
      setCopyCurlState('copied');
    } catch {
      setCopyCurlState('error');
    }
  }

  return (
    <div className={`json-block${open ? ' json-block--open' : ''}`}>
      <button type="button" className="json-block__summary" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>{title}</span>
        <span className="muted json-block__chevron" aria-hidden>
          {open ? '▼' : '▶'}
        </span>
      </button>
      <div className="json-block__collapsible">
        <div className="json-block__collapsible-inner">
          {empty ? (
            <p className="json-block__empty muted">{EMPTY_HINT}</p>
          ) : (
            <>
              <div className="json-actions">
                <button
                  type="button"
                  className={copyJsonState === 'copied' ? 'is-done' : copyJsonState === 'error' ? 'is-error' : ''}
                  onClick={() => void onCopyJson()}
                >
                  {copyJsonState === 'copied' ? 'Copied' : copyJsonState === 'error' ? 'Copy failed' : 'Copy'}
                </button>
                <button type="button" onClick={() => downloadJsonFile(fileName, payload)}>
                  Download
                </button>
                <button
                  type="button"
                  disabled={!curlCommand}
                  className={copyCurlState === 'copied' ? 'is-done' : copyCurlState === 'error' ? 'is-error' : ''}
                  onClick={() => void onCopyCurl()}
                >
                  {copyCurlState === 'copied' ? 'cURL copied' : copyCurlState === 'error' ? 'cURL failed' : 'cURL'}
                </button>
              </div>
              <pre className="json-viewer">
                <code dangerouslySetInnerHTML={{ __html: html }} />
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

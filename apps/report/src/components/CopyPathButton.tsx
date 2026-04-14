import React, { useCallback, useState } from 'react';

type Props = {
  text: string;
  /** Short label for the button */
  label?: string;
};

export function CopyPathButton({ text, label = 'Copy' }: Props): JSX.Element {
  const [done, setDone] = useState(false);

  const onClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
    } catch {
      /* ignore */
    }
  }, [text]);

  return (
    <button type="button" className="copy-path-btn no-print" onClick={onClick} title="Copy path to clipboard">
      {done ? 'Copied' : label}
    </button>
  );
}

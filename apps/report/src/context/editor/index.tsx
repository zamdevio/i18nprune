import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  type EditorOpener,
  getStoredEditorOpener,
  setStoredEditorOpener,
} from '../../lib/editor/index.js';

const Ctx = createContext<{
  opener: EditorOpener;
  setOpener: (o: EditorOpener) => void;
} | null>(null);

export function EditorPreferenceProvider({ children }: { children: ReactNode }): JSX.Element {
  const [opener, setOpenerState] = useState<EditorOpener>(() => getStoredEditorOpener());
  const setOpener = useMemo(
    () => (o: EditorOpener) => {
      setOpenerState(o);
      setStoredEditorOpener(o);
    },
    [],
  );
  const value = useMemo(() => ({ opener, setOpener }), [opener, setOpener]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEditorOpener(): { opener: EditorOpener; setOpener: (o: EditorOpener) => void } {
  const v = useContext(Ctx);
  if (!v) throw new Error('useEditorOpener outside EditorPreferenceProvider');
  return v;
}

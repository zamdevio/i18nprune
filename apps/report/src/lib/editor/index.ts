export { canUseEditorDeepLinks, inferRuntimeFamily } from './deepLinks.js';
export type { RuntimeFamily } from './deepLinks.js';

export type EditorOpener = 'vscode' | 'cursor' | 'file';

const STORAGE_KEY = 'i18nprune-report-editor';

export function getStoredEditorOpener(): EditorOpener {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'vscode' || v === 'cursor' || v === 'file') return v;
  } catch {
    /* ignore */
  }
  return 'vscode';
}

export function setStoredEditorOpener(v: EditorOpener): void {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    /* ignore */
  }
}

/** Optional context from the embedded report + browser (WSL → Windows editor deep links). */
export type EditorLinkContext = {
  /**
   * `WSL_DISTRO_NAME` from the machine that ran `i18nprune report` (e.g. `Ubuntu`).
   * When set and the user opens the HTML in a **Windows** browser, `vscode://` / `cursor://` use `\\wsl$\…` form
   * so the Windows app can open WSL filesystem paths.
   */
  wslDistroName?: string;
};

/** True when the report UI likely runs in a Windows desktop browser (not WSL Linux browser). */
export function isLikelyWindowsDesktopBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (navigator.platform === 'Win32') return true;
  return /\bWindows NT\b/i.test(navigator.userAgent);
}

/**
 * UNC-style path segment for WSL: `//wsl$/Ubuntu/home/...`
 * @see https://learn.microsoft.com/en-us/windows/wsl/filesystems
 */
function wslUncPathForEditor(unixAbsolute: string, distro: string): string {
  const u = unixAbsolute.replace(/\\/g, '/');
  const tail = u.startsWith('/') ? u : `/${u}`;
  return `//wsl$/${distro}${tail}`;
}

/** Build a clickable href for opening a file in an editor or via file://. */
export function buildEditorHref(
  absolutePathPosix: string,
  opener: EditorOpener,
  ctx: EditorLinkContext = {},
): string {
  const n = absolutePathPosix.replace(/\\/g, '/');

  if (opener === 'file') {
    if (n.startsWith('/')) return `file://${n}`;
    if (/^[A-Za-z]:\//.test(n)) return `file:///${n}`;
    return `file:///${n}`;
  }

  const isWinPath = /^[A-Za-z]:\//.test(n);
  const useWslUnc =
    Boolean(ctx.wslDistroName) &&
    isLikelyWindowsDesktopBrowser() &&
    n.startsWith('/') &&
    !isWinPath;

  if (useWslUnc && ctx.wslDistroName) {
    const unc = wslUncPathForEditor(n, ctx.wslDistroName);
    if (opener === 'vscode') return `vscode://file${unc}`;
    return `cursor://file${unc}`;
  }

  const pathPart = n.startsWith('/') ? n : `/${n}`;
  if (opener === 'vscode') return `vscode://file${pathPart}`;
  return `cursor://file${pathPart}`;
}

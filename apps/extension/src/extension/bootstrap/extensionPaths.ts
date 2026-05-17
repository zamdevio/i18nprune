import path from 'node:path';

/** Set from {@link vscode.ExtensionContext.extensionPath} during activate. */
let extensionInstallRoot = '';

export function setExtensionInstallRoot(fsPath: string): void {
  extensionInstallRoot = fsPath;
}

/**
 * `jiti` needs a real filesystem anchor; bundled `out/extension.js` may not expose a stable `__filename`.
 * Using `package.json` next to the compiled extension entry is reliable in VS Code.
 */
export function getJitiImportParentFilename(): string {
  if (extensionInstallRoot) {
    return path.resolve(extensionInstallRoot, 'package.json');
  }
  return path.resolve(process.cwd(), 'package.json');
}

import { existsRuntimeFsSync, readRuntimeFsTextSync } from '../../runtime/helpers/sync/index.js';
import type { InitFilesystemHost } from '../../types/init/index.js';
import type { InitPackageJsonSignals } from '../../types/init/index.js';

/**
 * Read **`package.json`** at **`projectRoot`** and return dependency maps.
 *
 * @returns **`null`** when the file is missing or JSON is invalid.
 */
export function readInitPackageJson(host: InitFilesystemHost, projectRoot: string): InitPackageJsonSignals | null {
  const pkgPath = host.path.join(projectRoot, 'package.json');
  if (!existsRuntimeFsSync(pkgPath, host.fs)) return null;
  try {
    const raw = readRuntimeFsTextSync(pkgPath, host.fs);
    const parsed = JSON.parse(raw) as { dependencies?: unknown; devDependencies?: unknown };
    const dependencies =
      parsed.dependencies && typeof parsed.dependencies === 'object' && parsed.dependencies !== null
        ? (parsed.dependencies as Record<string, string>)
        : {};
    const devDependencies =
      parsed.devDependencies && typeof parsed.devDependencies === 'object' && parsed.devDependencies !== null
        ? (parsed.devDependencies as Record<string, string>)
        : {};
    return { dependencies, devDependencies };
  } catch {
    return null;
  }
}

function hasDep(pkg: InitPackageJsonSignals | null, name: string): boolean {
  if (!pkg) return false;
  return Object.hasOwn(pkg.dependencies, name) || Object.hasOwn(pkg.devDependencies, name);
}

/** Whether **`name`** appears in **`dependencies`** or **`devDependencies`**. */
export function initPackageDeclares(pkg: InitPackageJsonSignals | null, name: string): boolean {
  return hasDep(pkg, name);
}

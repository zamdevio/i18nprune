export type PackageManager = 'npm' | 'pnpm' | 'bun' | 'yarn';

export const PACKAGE_MANAGERS: PackageManager[] = ['npm', 'pnpm', 'bun', 'yarn'];

export type InstallTarget = {
  packageName: string;
  version: string;
  global?: boolean;
};

export function inferGlobalInstall(installSnippet: string, packageName: string): boolean {
  if (/\s-g\s|global\s+add/i.test(installSnippet)) return true;
  return packageName === 'i18nprune';
}

export function buildInstallSnippets(target: InstallTarget): Record<PackageManager, string> {
  const spec = `${target.packageName}@${target.version}`;
  if (target.global) {
    return {
      npm: `npm install -g ${spec}`,
      pnpm: `pnpm add -g ${spec}`,
      bun: `bun add -g ${spec}`,
      yarn: `yarn global add ${spec}`,
    };
  }
  return {
    npm: `npm install ${spec}`,
    pnpm: `pnpm add ${spec}`,
    bun: `bun add ${spec}`,
    yarn: `yarn add ${spec}`,
  };
}

export function installTargetFromRelease(npm: {
  package: string;
  installSnippet: string;
}, version: string): InstallTarget {
  return {
    packageName: npm.package,
    version,
    global: inferGlobalInstall(npm.installSnippet, npm.package),
  };
}

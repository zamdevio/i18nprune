import os from 'node:os';
import type { ReportEnvironmentSnapshot } from '@i18nprune/core';
import type { Context } from '@/types/core/context/index.js';

function runtimeFamily(): 'windows' | 'darwin' | 'linux' | 'linux-wsl' {
  if (process.platform === 'win32') return 'windows';
  if (process.platform === 'darwin') return 'darwin';
  if (process.env.WSL_DISTRO_NAME) return 'linux-wsl';
  return 'linux';
}

function readLinuxDistro(fsPort: Context['adapters']['fs']): string | undefined {
  if (process.platform !== 'linux') return undefined;
  try {
    const raw = fsPort.readText('/etc/os-release');
    if (typeof raw !== 'string') return undefined;
    const line = raw
      .split('\n')
      .find((x) => x.startsWith('PRETTY_NAME=') || x.startsWith('NAME='));
    if (!line) return undefined;
    const v = line.split('=')[1] ?? '';
    return v.replace(/^"|"$/g, '').trim() || undefined;
  } catch {
    return undefined;
  }
}

/** Probe `process.*` and `os.*` to build the environment snapshot for the report document. */
export function buildReportEnvironmentSnapshot(fsPort: Context['adapters']['fs']): ReportEnvironmentSnapshot {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    osRelease: os.release(),
    distro: readLinuxDistro(fsPort),
    runtimeFamily: runtimeFamily(),
    ...(process.env.WSL_DISTRO_NAME
      ? { wslDistroName: process.env.WSL_DISTRO_NAME }
      : {}),
  };
}

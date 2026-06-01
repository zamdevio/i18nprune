import os from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Context } from '@/types/core/context/index.js';
import { buildReportEnvironmentSnapshot } from '../build.js';

const originalPlatform = process.platform;
const originalArch = process.arch;
const originalVersion = process.version;
const originalWsl = process.env.WSL_DISTRO_NAME;

function fsPort(readText: () => string): Context['adapters']['fs'] {
  return { readText } as unknown as Context['adapters']['fs'];
}

afterEach(() => {
  Object.defineProperty(process, 'platform', { value: originalPlatform });
  Object.defineProperty(process, 'arch', { value: originalArch });
  Object.defineProperty(process, 'version', { value: originalVersion });
  vi.restoreAllMocks();
  if (originalWsl === undefined) {
    delete process.env.WSL_DISTRO_NAME;
  } else {
    process.env.WSL_DISTRO_NAME = originalWsl;
  }
});

describe('buildReportEnvironmentSnapshot', () => {
  it('records process.platform, arch, node version, and os.release()', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    Object.defineProperty(process, 'arch', { value: 'x64' });
    Object.defineProperty(process, 'version', { value: 'v22.0.0' });
    vi.spyOn(os, 'release').mockReturnValue('10.0.26100');
    delete process.env.WSL_DISTRO_NAME;

    const snap = buildReportEnvironmentSnapshot(
      fsPort(() => {
        throw new Error('not used on win32');
      }),
    );

    expect(snap).toEqual({
      platform: 'win32',
      arch: 'x64',
      nodeVersion: 'v22.0.0',
      osRelease: '10.0.26100',
      runtimeFamily: 'windows',
    });
  });

  it('reads linux distro from /etc/os-release when on linux', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    Object.defineProperty(process, 'arch', { value: 'arm64' });
    Object.defineProperty(process, 'version', { value: 'v20.12.0' });
    vi.spyOn(os, 'release').mockReturnValue('6.6.0');
    delete process.env.WSL_DISTRO_NAME;

    const snap = buildReportEnvironmentSnapshot(fsPort(() => 'PRETTY_NAME="Ubuntu 24.04.1 LTS"\n'));

    expect(snap.platform).toBe('linux');
    expect(snap.osRelease).toBe('6.6.0');
    expect(snap.distro).toBe('Ubuntu 24.04.1 LTS');
    expect(snap.runtimeFamily).toBe('linux');
  });

  it('tags WSL via WSL_DISTRO_NAME and linux-wsl runtime family', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    Object.defineProperty(process, 'arch', { value: 'x64' });
    Object.defineProperty(process, 'version', { value: 'v20.0.0' });
    vi.spyOn(os, 'release').mockReturnValue('6.6.87.2-microsoft-standard-WSL2');
    process.env.WSL_DISTRO_NAME = 'Ubuntu';

    const snap = buildReportEnvironmentSnapshot(fsPort(() => 'PRETTY_NAME="Ubuntu"\n'));

    expect(snap.runtimeFamily).toBe('linux-wsl');
    expect(snap.wslDistroName).toBe('Ubuntu');
    expect(snap.osRelease).toBe('6.6.87.2-microsoft-standard-WSL2');
  });
});

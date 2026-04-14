import { describe, it, expect } from 'vitest';
import { canUseEditorDeepLinks, inferRuntimeFamily } from '../editor/deepLinks.js';
import type { ProjectReportEnvironment } from '../../types/index.js';

function env(partial: Partial<ProjectReportEnvironment> & Pick<ProjectReportEnvironment, 'platform'>): ProjectReportEnvironment {
  return {
    arch: 'x64',
    nodeVersion: '20.0.0',
    osRelease: 'test',
    ...partial,
  };
}

describe('canUseEditorDeepLinks', () => {
  it('returns false when environment is missing', () => {
    expect(canUseEditorDeepLinks(undefined)).toBe(false);
  });

  it('returns false when platform is missing', () => {
    expect(canUseEditorDeepLinks(env({ platform: '' }))).toBe(false);
  });

  it('allows win32 and darwin', () => {
    expect(canUseEditorDeepLinks(env({ platform: 'win32' }))).toBe(true);
    expect(canUseEditorDeepLinks(env({ platform: 'darwin' }))).toBe(true);
  });

  it('allows native linux without WSL markers', () => {
    expect(canUseEditorDeepLinks(env({ platform: 'linux', runtimeFamily: 'linux' }))).toBe(true);
    expect(
      canUseEditorDeepLinks(env({ platform: 'linux', runtimeFamily: undefined, wslDistroName: undefined })),
    ).toBe(true);
  });

  it('blocks linux-wsl without wslDistroName', () => {
    expect(canUseEditorDeepLinks(env({ platform: 'linux', runtimeFamily: 'linux-wsl' }))).toBe(false);
    expect(canUseEditorDeepLinks(env({ platform: 'linux', wslDistroName: undefined }))).toBe(true);
  });

  it('allows WSL when wslDistroName is set', () => {
    expect(
      canUseEditorDeepLinks(
        env({ platform: 'linux', runtimeFamily: 'linux-wsl', wslDistroName: 'Ubuntu' }),
      ),
    ).toBe(true);
  });
});

describe('inferRuntimeFamily', () => {
  it('prefers embedded runtimeFamily', () => {
    expect(inferRuntimeFamily(env({ platform: 'linux', runtimeFamily: 'linux-wsl' }))).toBe('linux-wsl');
  });

  it('infers from platform and wslDistroName', () => {
    expect(inferRuntimeFamily(env({ platform: 'win32' }))).toBe('windows');
    expect(inferRuntimeFamily(env({ platform: 'darwin' }))).toBe('darwin');
    expect(inferRuntimeFamily(env({ platform: 'linux' }))).toBe('linux');
    expect(inferRuntimeFamily(env({ platform: 'linux', wslDistroName: 'Ubuntu' }))).toBe('linux-wsl');
  });
});

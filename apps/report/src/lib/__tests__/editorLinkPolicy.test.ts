import { describe, it, expect } from 'vitest';
import { resolveGeneratorEnvironment } from '../open-in-editor/generator/resolve.js';
import { detectViewerEnvironment } from '../open-in-editor/viewer/detect.js';
import { evaluateEditorLinkPolicy } from '../open-in-editor/policy/evaluate.js';
import { evaluateEditorLinkPolicyFromPayload } from '../open-in-editor/policy/evaluate.js';
import { policyForMissingEnvironment } from '../open-in-editor/policy/evaluate.js';
import type { ProjectReportEnvironment } from '../../types/index.js';
import type { ViewerSignals } from '../open-in-editor/viewer/detect.js';

function env(partial: Partial<ProjectReportEnvironment> & Pick<ProjectReportEnvironment, 'platform'>): ProjectReportEnvironment {
  return {
    arch: 'x64',
    nodeVersion: '20.0.0',
    osRelease: 'test',
    ...partial,
  };
}

function viewer(overrides: Partial<ViewerSignals> = {}): ReturnType<typeof detectViewerEnvironment> {
  return detectViewerEnvironment({
    platform: 'Linux',
    userAgent: 'Linux',
    isCoarsePointer: false,
    isNarrowViewport: false,
    ...overrides,
  });
}

function winViewer(): ReturnType<typeof detectViewerEnvironment> {
  return viewer({ platform: 'Win32', userAgent: 'Windows NT 10.0' });
}

function macViewer(): ReturnType<typeof detectViewerEnvironment> {
  return viewer({ platform: 'MacIntel', userAgent: 'Macintosh; Intel Mac OS X' });
}

function mobileViewer(): ReturnType<typeof detectViewerEnvironment> {
  return viewer({ isCoarsePointer: true, isNarrowViewport: true });
}

const REAL_CWD = '/home/dev/my-project';

describe('resolveGeneratorEnvironment', () => {
  it('returns unsupported when environment is missing', () => {
    expect(resolveGeneratorEnvironment(undefined).family).toBe('unsupported');
  });

  it('blocks browser and cloudflare worker platforms', () => {
    expect(resolveGeneratorEnvironment(env({ platform: 'browser' })).family).toBe('unsupported');
    expect(resolveGeneratorEnvironment(env({ platform: 'cloudflare-worker' })).family).toBe('unsupported');
    expect(resolveGeneratorEnvironment(env({ platform: 'cloudflare-workers' })).family).toBe('unsupported');
  });

  it('classifies WSL before native linux', () => {
    expect(
      resolveGeneratorEnvironment(
        env({ platform: 'linux', runtimeFamily: 'linux-wsl', wslDistroName: 'Ubuntu' }),
      ).family,
    ).toBe('linux-wsl');
    expect(
      resolveGeneratorEnvironment(env({ platform: 'linux', wslDistroName: 'Ubuntu' })).family,
    ).toBe('linux-wsl');
  });

  it('classifies native linux without WSL markers', () => {
    expect(resolveGeneratorEnvironment(env({ platform: 'linux', runtimeFamily: 'linux' })).family).toBe(
      'linux',
    );
  });
});

describe('evaluateEditorLinkPolicy matrix', () => {
  const cases: Array<{
    name: string;
    platform: ProjectReportEnvironment;
    cwd: string;
    v: ReturnType<typeof viewer>;
    allow: boolean;
    reason?: string;
  }> = [
    {
      name: 'windows × windows',
      platform: env({ platform: 'win32' }),
      cwd: REAL_CWD,
      v: winViewer(),
      allow: true,
    },
    {
      name: 'linux × linux',
      platform: env({ platform: 'linux', runtimeFamily: 'linux' }),
      cwd: REAL_CWD,
      v: viewer(),
      allow: true,
    },
    {
      name: 'darwin × darwin',
      platform: env({ platform: 'darwin' }),
      cwd: REAL_CWD,
      v: macViewer(),
      allow: true,
    },
    {
      name: 'windows × linux',
      platform: env({ platform: 'win32' }),
      cwd: REAL_CWD,
      v: viewer(),
      allow: false,
      reason: 'viewer-environment-incompatible',
    },
    {
      name: 'linux × windows',
      platform: env({ platform: 'linux', runtimeFamily: 'linux' }),
      cwd: REAL_CWD,
      v: winViewer(),
      allow: false,
      reason: 'viewer-environment-incompatible',
    },
    {
      name: 'linux-wsl × windows (v1 hard disable)',
      platform: env({ platform: 'linux', runtimeFamily: 'linux-wsl', wslDistroName: 'Ubuntu' }),
      cwd: REAL_CWD,
      v: winViewer(),
      allow: false,
      reason: 'wsl-cross-host-unsupported',
    },
    {
      name: 'linux-wsl × linux',
      platform: env({ platform: 'linux', runtimeFamily: 'linux-wsl', wslDistroName: 'Ubuntu' }),
      cwd: REAL_CWD,
      v: viewer(),
      allow: false,
      reason: 'wsl-cross-host-unsupported',
    },
    {
      name: 'linux-wsl without distro',
      platform: env({ platform: 'linux', runtimeFamily: 'linux-wsl' }),
      cwd: REAL_CWD,
      v: viewer(),
      allow: false,
      reason: 'missing-runtime-metadata',
    },
    {
      name: 'browser generator',
      platform: env({ platform: 'browser' }),
      cwd: REAL_CWD,
      v: viewer(),
      allow: false,
      reason: 'generator-environment-unsupported',
    },
    {
      name: 'synthetic cwd',
      platform: env({ platform: 'linux', runtimeFamily: 'linux' }),
      cwd: '/project',
      v: viewer(),
      allow: false,
      reason: 'synthetic-cwd',
    },
    {
      name: 'mobile viewer',
      platform: env({ platform: 'linux', runtimeFamily: 'linux' }),
      cwd: REAL_CWD,
      v: mobileViewer(),
      allow: false,
      reason: 'mobile-browser',
    },
    {
      name: 'unknown viewer',
      platform: env({ platform: 'linux', runtimeFamily: 'linux' }),
      cwd: REAL_CWD,
      v: viewer({ platform: '', userAgent: 'Custom' }),
      allow: false,
      reason: 'viewer-environment-incompatible',
    },
  ];

  for (const c of cases) {
    it(c.name, () => {
      const policy = evaluateEditorLinkPolicyFromPayload({
        environment: c.platform,
        cwd: c.cwd,
        viewer: c.v,
      });
      expect(policy.allow).toBe(c.allow);
      if (!c.allow && c.reason) {
        expect(policy.allow).toBe(false);
        if (!policy.allow) expect(policy.reason).toBe(c.reason);
      }
    });
  }
});

describe('missing project.environment', () => {
  it('always denies with missing-runtime-metadata for real cwd', () => {
    const policy = policyForMissingEnvironment(REAL_CWD);
    expect(policy).toEqual({ allow: false, reason: 'missing-runtime-metadata' });
  });

  it('denies synthetic cwd before missing metadata message path', () => {
    const policy = policyForMissingEnvironment('/project');
    expect(policy).toEqual({ allow: false, reason: 'synthetic-cwd' });
  });

  it('payload helper denies when environment omitted', () => {
    const policy = evaluateEditorLinkPolicyFromPayload({
      environment: undefined,
      cwd: REAL_CWD,
      viewer: viewer(),
    });
    expect(policy).toEqual({ allow: false, reason: 'missing-runtime-metadata' });
  });
});

describe('evaluateEditorLinkPolicy direct', () => {
  it('native pair allows native bridge', () => {
    const policy = evaluateEditorLinkPolicy({
      generator: resolveGeneratorEnvironment(env({ platform: 'linux', runtimeFamily: 'linux' })),
      viewer: viewer(),
      cwd: REAL_CWD,
    });
    expect(policy).toEqual({ allow: true, bridge: 'native' });
  });
});

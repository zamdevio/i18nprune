import { describe, expect, it } from 'vitest';
import { archiveHostedReportEnvironment } from '../archiveEnvironment.js';

describe('archiveHostedReportEnvironment', () => {
  it('uses cloudflare-workers for worker archive ingest', () => {
    expect(archiveHostedReportEnvironment('worker-archive')).toEqual({
      platform: 'cloudflare-workers',
      arch: '',
      nodeVersion: '',
      osRelease: '',
      runtimeFamily: 'edge-worker',
    });
  });

  it('uses browser for web zip import', () => {
    expect(archiveHostedReportEnvironment('web')).toMatchObject({
      platform: 'browser',
      runtimeFamily: 'edge-worker',
      osRelease: '',
    });
  });

  it('defaults to cloudflare-workers when prepare host is omitted', () => {
    expect(archiveHostedReportEnvironment().platform).toBe('cloudflare-workers');
  });
});

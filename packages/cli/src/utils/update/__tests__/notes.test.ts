import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderStreamNotes } from '../notes.js';
import { fetchReleaseNotes, releaseNotesUrl, type ReleaseNotes } from '../releases.js';

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

const notes: ReleaseNotes = {
  schemaVersion: 1,
  stream: 'cli',
  version: '1.1.1',
  date: '2026-10-18',
  status: 'stable',
  summary: 'cleanup uncertain-prefix fixes',
  sections: {
    added: [],
    changed: [],
    fixed: ['fixed one', 'fixed two'],
    removed: [],
    breaking: ['broke one'],
    security: [],
    performance: [],
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('renderStreamNotes', () => {
  it('renders header, summary, and only non-empty sections', () => {
    const plain = renderStreamNotes(notes).map(stripAnsi);
    expect(plain[0]).toBe('CLI v1.1.1 — 2026-10-18');
    expect(plain[1]).toBe('  cleanup uncertain-prefix fixes');

    const text = plain.join('\n');
    expect(text).toContain('    • broke one');
    expect(text).toContain('    • fixed one');
    expect(text).toContain('https://releases.i18nprune.dev/cli/1.1.1');
    expect(text).not.toContain('Added');
    expect(text).not.toContain('Performance');
  });

  it('orders breaking before fixed', () => {
    const text = renderStreamNotes(notes).map(stripAnsi).join('\n');
    expect(text.indexOf('Breaking')).toBeLessThan(text.indexOf('Fixed'));
  });

  it('labels core and desktop streams', () => {
    expect(stripAnsi(renderStreamNotes({ ...notes, stream: 'core' })[0])).toContain('Core v1.1.1');
    expect(stripAnsi(renderStreamNotes({ ...notes, stream: 'desktop' })[0])).toContain(
      'Desktop v1.1.1',
    );
  });
});

describe('releaseNotesUrl', () => {
  it('points at the human portal route', () => {
    expect(releaseNotesUrl('core', '1.1.1')).toBe(
      'https://releases.i18nprune.dev/core/1.1.1',
    );
  });
});

describe('fetchReleaseNotes', () => {
  it('returns the record on 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(notes), { status: 200 })),
    );
    await expect(fetchReleaseNotes('cli', '1.1.1')).resolves.toMatchObject({ version: '1.1.1' });
  });

  it('returns null on 404 (version not published)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not found', { status: 404 })));
    await expect(fetchReleaseNotes('cli', '9.9.9')).resolves.toBeNull();
  });

  it('returns null when the network throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    await expect(fetchReleaseNotes('cli', '1.1.1')).resolves.toBeNull();
  });
});

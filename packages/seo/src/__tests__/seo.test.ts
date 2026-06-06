import { describe, expect, it } from 'vitest';

import {
  CANONICAL_HOSTS,
  buildLandingGraph,
  buildReleasesPortalGraph,
  cloudflareDefaultHostRedirect,
  cloudflareDefaultHostRedirectFor,
  defaultProductMetaSnapshot,
  parseMetaV1ForSeo,
  renderRobotsTxtPreset,
  serializeJsonLd,
  serializeJsonLdScript,
} from '../index.js';

describe('parseMetaV1ForSeo', () => {
  it('maps a valid meta body', () => {
    expect(
      parseMetaV1ForSeo({
        ok: true,
        github: { owner: 'zamdevio', repo: 'i18nprune', stars: 0, error: null },
        npm: { cli: { version: '0.1.2' }, core: { version: '0.1.2' } },
      }),
    ).toEqual({
      cliVersion: '0.1.2',
      coreVersion: '0.1.2',
      githubStars: 0,
      githubOwner: 'zamdevio',
      githubRepo: 'i18nprune',
    });
  });

  it('returns null for non-ok payloads', () => {
    expect(parseMetaV1ForSeo({ ok: false })).toBeNull();
  });
});

describe('buildLandingGraph', () => {
  it('includes software version and stable product @id', () => {
    const graph = buildLandingGraph(defaultProductMetaSnapshot('0.1.2'));
    expect(graph['@graph']).toHaveLength(2);
    const software = graph['@graph'].find((node) => node['@type'] === 'SoftwareApplication');
    expect(software).toMatchObject({
      '@id': 'https://i18nprune.dev/#software',
      softwareVersion: '0.1.2',
      applicationCategory: 'DeveloperApplication',
    });
  });
});

describe('cloudflareDefaultHostRedirect', () => {
  it('redirects pages.dev to the custom domain', () => {
    expect(
      cloudflareDefaultHostRedirect(
        'https://docs-i18nprune.pages.dev/commands/?q=1',
        CANONICAL_HOSTS.docs,
        '.pages.dev',
      ),
    ).toBe('https://docs.i18nprune.dev/commands/?q=1');
  });

  it('redirects workers.dev to the custom domain', () => {
    expect(
      cloudflareDefaultHostRedirectFor(
        'https://worker-i18nprune.foo.workers.dev/docs',
        'worker',
        '.workers.dev',
      ),
    ).toBe('https://worker.i18nprune.dev/docs');
  });

  it('returns null on canonical hosts', () => {
    expect(
      cloudflareDefaultHostRedirect('https://i18nprune.dev/', CANONICAL_HOSTS.landing, '.pages.dev'),
    ).toBeNull();
  });
});

describe('serializeJsonLdScript', () => {
  it('escapes closing script sequences', () => {
    const script = serializeJsonLdScript({ '@context': 'https://schema.org', name: '<test>' });
    expect(script).toContain('\\u003c');
    expect(script.startsWith('<script type="application/ld+json">')).toBe(true);
  });

  it('round-trips through JSON.parse inside the script tag', () => {
    const graph = buildLandingGraph(defaultProductMetaSnapshot());
    const script = serializeJsonLdScript(graph);
    const json = script.replace(/^<script type="application\/ld\+json">/, '').replace(/<\/script>$/, '');
    expect(JSON.parse(json)).toEqual(JSON.parse(serializeJsonLd(graph)));
  });
});

describe('buildReleasesPortalGraph', () => {
  it('links releases portal to the product @id', () => {
    const graph = buildReleasesPortalGraph(defaultProductMetaSnapshot('0.1.2'));
    const software = graph['@graph'].find((node) => node['@type'] === 'SoftwareApplication');
    expect(software).toMatchObject({ softwareVersion: '0.1.2' });
  });
});

describe('renderRobotsTxtPreset', () => {
  it('includes ASCII art and sitemap for landing', () => {
    const txt = renderRobotsTxtPreset('landing');
    expect(txt).toContain('Dear robot');
    expect(txt).toContain('Sitemap: https://i18nprune.dev/sitemap.xml');
    expect(txt).toContain('Disallow: /og.svg');
  });

  it('includes sitemap for git analytics', () => {
    const txt = renderRobotsTxtPreset('git');
    expect(txt).toContain('Sitemap: https://git.i18nprune.dev/sitemap.xml');
  });
});

describe('buildSiteWebManifest', () => {
  it('writes root-relative icons and surface-specific shortcuts', async () => {
    const { buildSiteWebManifest } = await import('../manifest.js');
    const manifest = buildSiteWebManifest('report');
    expect(manifest.name).toContain('report');
    expect(manifest.icons[0]?.src).toBe('/favicon-16x16.png');
    expect(manifest.shortcuts.some((s) => s.url.startsWith('https://'))).toBe(true);
    expect(manifest.theme_color).toBe('#04140f');
  });
});

describe('renderOgSvg', () => {
  it('shows early GitHub copy for zero stars without double-escaped entities', async () => {
    const { renderOgSvg } = await import('../og/ogCard.js');
    const svg = renderOgSvg({ kind: 'live', stars: 0, repoLabel: 'zamdevio/i18nprune' }, '0.1.2');
    expect(svg).toContain('Early');
    expect(svg).toContain('zamdevio/i18nprune');
    expect(svg).toContain('&#183;');
    expect(svg).not.toContain('&amp;#183;');
    expect(svg).not.toContain('&#8594;');
    expect(svg).toContain('cx="110"');
    expect(svg).toContain('translate(872, 26)');
    expect(svg).toContain('M0 -8 L2.4');
  });
});

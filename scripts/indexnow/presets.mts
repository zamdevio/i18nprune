import {
  buildSitemapIndexNowUrlList,
  INDEXNOW_PRESET_HOSTS,
  indexNowPresetOrigin,
  type IndexNowPresetId,
} from '@i18nprune/seo';

import { urlsFromReleaseStreams, type ReleasesIndexNowUrls } from './urls-from-releases.mts';

export const INDEXNOW_PRESETS = ['releases', 'docs', 'landing', 'git'] as const satisfies readonly IndexNowPresetId[];

export function isIndexNowPreset(value: string): value is IndexNowPresetId {
  return (INDEXNOW_PRESETS as readonly string[]).includes(value);
}

export function defaultHostForPreset(preset: string | null): string {
  if (preset && isIndexNowPreset(preset)) return INDEXNOW_PRESET_HOSTS[preset];
  return INDEXNOW_PRESET_HOSTS.releases;
}

export type ResolveIndexNowPresetInput = {
  preset: IndexNowPresetId;
  version: string | null;
  streams: readonly string[];
};

export type ResolveIndexNowPresetResult = {
  host: string;
  urlList: string[];
  skipped?: ReleasesIndexNowUrls['skipped'];
  included?: ReleasesIndexNowUrls['included'];
};

export function resolveIndexNowPreset(input: ResolveIndexNowPresetInput): ResolveIndexNowPresetResult {
  const { preset, version, streams } = input;

  if (preset === 'releases') {
    const { urlList, skipped, included } = urlsFromReleaseStreams(streams, version);
    if (skipped.length > 0) {
      const detail = skipped.map((row) => `${row.stream}@${row.version}`).join(', ');
      console.warn(`indexnow: skipped release stream(s) with no YAML: ${detail}`);
    }
    const pageUrls = urlList.filter(
      (url) => !url.endsWith('/sitemap.xml') && !url.endsWith('/feed.xml'),
    );
    if (pageUrls.length === 0) {
      throw new Error(
        'No release pages to ping — all requested streams were skipped (missing YAML). Check --stream and --version.',
      );
    }
    return {
      host: INDEXNOW_PRESET_HOSTS.releases,
      urlList,
      skipped,
      included,
    };
  }

  return {
    host: INDEXNOW_PRESET_HOSTS[preset],
    urlList: buildSitemapIndexNowUrlList(indexNowPresetOrigin(preset)),
  };
}

import type {
  HostedIngestProcessorContext,
  IngestRouteKind,
  KnownIngestRouteKind,
  KnownPayloadProcessorSurface,
  MetadataScalar,
  PayloadProcessorSurface,
} from '../types/project/metadata.js';
import { SDK_VERSION } from '../shared/constants/sdk.js';
import { METADATA_DASH } from '../types/project/metadata.js';

type SurfacePreset = {
  surfaceLabel: string;
  prepareSummary: string;
  sdk: string;
};

const SURFACE_PRESETS: Record<KnownPayloadProcessorSurface, SurfacePreset> = {
  cli: {
    surfaceLabel: 'i18nprune CLI',
    prepareSummary: 'Prepared on disk via CLI (SDK host)',
    sdk: 'i18nprune-cli',
  },
  web: {
    surfaceLabel: 'i18nprune Web',
    prepareSummary: 'Prepared in the browser via web app',
    sdk: 'i18nprune-web',
  },
  worker: {
    surfaceLabel: 'Cloudflare Worker',
    prepareSummary: 'Prepared on edge via POST /archive',
    sdk: 'i18nprune-worker',
  },
};

const ROUTE_LABELS: Record<KnownIngestRouteKind, string> = {
  prepared: 'Prepared JSON ingest (POST /v1/projects or /v1/reports)',
  archive: 'Archive upload (POST /v1/projects/archive or /v1/reports/archive)',
};

function isKnownSurface(surface: PayloadProcessorSurface): surface is KnownPayloadProcessorSurface {
  return surface === 'cli' || surface === 'web' || surface === 'worker';
}

function isKnownRoute(route: IngestRouteKind): route is KnownIngestRouteKind {
  return route === 'prepared' || route === 'archive';
}

export function normalizeIngestRoute(route: string | undefined, fallback: KnownIngestRouteKind): IngestRouteKind {
  if (route === 'prepared' || route === 'archive' || route === 'custom') return route;
  if (typeof route === 'string' && route.trim().length > 0) return route.trim();
  return fallback;
}

export function defaultSurfaceForRoute(route: IngestRouteKind, prepareHost?: string): PayloadProcessorSurface {
  if (route === 'archive' || prepareHost === 'worker-archive') return 'worker';
  if (prepareHost === 'web') return 'web';
  if (prepareHost === 'cli-share') return 'cli';
  if (route !== 'prepared' && route !== 'archive' && route !== 'custom') return 'custom';
  return 'cli';
}

export function resolveProcessorSurface(
  processorContext: HostedIngestProcessorContext | undefined,
  prepareHost: string | undefined,
  ingestRoute: IngestRouteKind,
): PayloadProcessorSurface {
  const explicit = processorContext?.surface?.trim();
  if (explicit) {
    if (
      explicit === 'cli' ||
      explicit === 'web' ||
      explicit === 'worker' ||
      explicit === 'custom'
    ) {
      return explicit;
    }
    return explicit;
  }
  return defaultSurfaceForRoute(ingestRoute, prepareHost);
}

function labelOrDash(value: string | undefined): MetadataScalar {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : METADATA_DASH;
}

export function resolveProcessorPresentation(input: {
  ingestRoute: IngestRouteKind;
  prepareHost?: string;
  processorContext?: HostedIngestProcessorContext;
}): {
  surface: PayloadProcessorSurface;
  surfaceLabel: MetadataScalar;
  route: IngestRouteKind;
  routeLabel: MetadataScalar;
  prepareHost: MetadataScalar;
  toolVersion: MetadataScalar;
  sdk: MetadataScalar;
  sdkVersion: MetadataScalar;
  prepareSummary: MetadataScalar;
} {
  const route = normalizeIngestRoute(
    input.processorContext?.route,
    input.ingestRoute === 'archive' ? 'archive' : 'prepared',
  );
  const prepareHost =
    input.prepareHost ??
    (route === 'archive' ? 'worker-archive' : input.processorContext?.surface === 'web' ? 'web' : 'cli-share');
  const surface = resolveProcessorSurface(input.processorContext, prepareHost, route);

  const preset = isKnownSurface(surface) ? SURFACE_PRESETS[surface] : null;

  const surfaceLabel =
    input.processorContext?.surfaceLabel?.trim() ??
    preset?.surfaceLabel ??
    (surface === 'custom' ? 'Custom SDK host' : surface);

  let routeLabel: string;
  if (input.processorContext?.routeLabel?.trim()) {
    routeLabel = input.processorContext.routeLabel.trim();
  } else if (isKnownRoute(route)) {
    routeLabel = ROUTE_LABELS[route];
  } else if (route === 'custom') {
    routeLabel = 'Custom ingest route (SDK)';
  } else {
    routeLabel = route;
  }

  const sdk = input.processorContext?.sdk?.trim() ?? preset?.sdk ?? METADATA_DASH;
  const sdkVersion = input.processorContext?.sdkVersion?.trim() ?? SDK_VERSION;

  const prepareSummary =
    input.processorContext?.prepareSummary?.trim() ??
    preset?.prepareSummary ??
    `Prepared by host surface "${String(surface)}"`;

  return {
    surface,
    surfaceLabel: labelOrDash(surfaceLabel),
    route,
    routeLabel: labelOrDash(routeLabel as string),
    prepareHost: labelOrDash(prepareHost),
    toolVersion: labelOrDash(input.processorContext?.toolVersion),
    sdk: labelOrDash(typeof sdk === 'string' ? sdk : undefined),
    sdkVersion: labelOrDash(sdkVersion),
    prepareSummary: labelOrDash(prepareSummary),
  };
}

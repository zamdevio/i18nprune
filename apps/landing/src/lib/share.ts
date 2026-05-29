import { SITE_URL } from '../constants/site';

const SHARE_TITLE = 'i18nprune — Compiler-grade i18n infrastructure';
const SHARE_TEXT =
  'The ESLint for production i18n. Validate, sync, generate, and prune translations in CI.';

export function sharePageUrl(): string {
  if (typeof window !== 'undefined' && window.location?.href) {
    return window.location.href.split('#')[0] ?? SITE_URL;
  }
  return SITE_URL;
}

export function twitterShareUrl(pageUrl = SITE_URL): string {
  const q = new URLSearchParams({
    url: pageUrl,
    text: SHARE_TEXT,
    via: 'zamdevio',
  });
  return `https://twitter.com/intent/tweet?${q}`;
}

export function linkedInShareUrl(pageUrl = SITE_URL): string {
  const q = new URLSearchParams({ url: pageUrl });
  return `https://www.linkedin.com/sharing/share-offsite/?${q}`;
}

export function mastodonShareHint(pageUrl = SITE_URL): string {
  return `${SHARE_TITLE}\n${pageUrl}`;
}

export { SHARE_TITLE, SHARE_TEXT };

/**
 * Default curated URLs embedded in `/v1/meta` `links`.
 * Override via worker env in `services/links.ts` when you add binding support.
 */
export const DEFAULT_LINKS: Record<string, string> = {
  githubRepo: "https://github.com/zamdevio/i18nprune",
  docs: "https://docs.i18nprune.dev",
  npmCli: "https://www.npmjs.com/package/i18nprune",
  npmCore: "https://www.npmjs.com/package/@i18nprune/core",
  webApp: "https://web.i18nprune.dev",
  workerDocs: "https://worker.i18nprune.dev/docs",
  report: "https://report.i18nprune.dev",
  gitAnalytics: "https://git.i18nprune.dev",
  sandbox: "https://codesandbox.io/p/sandbox/ltw939",
  license: "https://github.com/zamdevio/i18nprune/blob/main/LICENSE",
  twitter: "https://twitter.com/zamdevio",
  vscodeMarketplace: "https://marketplace.visualstudio.com/items?itemName=zamdevio.i18nprune",
  openVsx: "https://open-vsx.org/extension/zamdevio/i18nprune",
};

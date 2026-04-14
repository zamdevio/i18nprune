/**
 * Docs-related constants and re-exports from the canonical CLI module (`packages/cli/src/constants/docs.ts`).
 * URL composition helpers live in `lib/docs.ts`.
 */
export {
  type GetDocsUrlOptions,
  appendNextraReadmeIndexIfNeeded,
  docsCommandUrl,
  getDocsUrl,
  normalizeNextraPublicPath,
} from "../../../../packages/cli/src/constants/docs.ts";
export { DOCS_SITE_BASE } from "../../../../packages/cli/src/constants/links.ts";

/** Stable fragment on JSON output docs (report file vs `validate --json`). */
export const DOCS_JSON_REPORT_VS_CLI_ANCHOR = "report-json-on-disk-vs-cli-json-stdout" as const;

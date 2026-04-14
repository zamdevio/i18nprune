import {
  DOCS_JSON_REPORT_VS_CLI_ANCHOR,
  getDocsUrl,
} from "../constants/docs";
import type { GetDocsUrlOptions } from "../constants/docs";

export function docsUrl(path: string, options?: GetDocsUrlOptions): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  return getDocsUrl(p, options);
}

export function docsJsonReportVsCliUrl(): string {
  return `${docsUrl("json/README")}#${DOCS_JSON_REPORT_VS_CLI_ANCHOR}`;
}

import type { TerminalLine } from "../../../types/terminal";

/** End-to-end pipeline narrative — only on /workflow (not duplicated on /api). */
export const workflowPipelineTerminal: TerminalLine[] = [
  { kind: "comment", text: "# Detect drift, align locales, re-check (illustrative)" },
  { kind: "prompt", text: "i18nprune validate --json" },
  { kind: "prompt", text: "i18nprune missing --yes" },
  { kind: "prompt", text: "i18nprune sync --dry-run && i18nprune sync --yes" },
  { kind: "prompt", text: "i18nprune validate --json" },
  { kind: "ok", text: "✔ Same primitives in CI and locally — pipe or file, your choice" },
];

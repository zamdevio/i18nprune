import type { TerminalLine } from "../../../types/terminal";

export const featuresValidateTerminal: TerminalLine[] = [
  { kind: "comment", text: "# Literal keys vs source locale; dynamic sites surfaced" },
  { kind: "prompt", text: "i18nprune validate" },
  { kind: "out", text: "→ human summary; non-zero when policy says fail" },
  { kind: "prompt", text: "i18nprune validate --json" },
  { kind: "ok", text: "✔ Same scan — machine envelope for gates" },
];

export const featuresSyncTerminal: TerminalLine[] = [
  { kind: "comment", text: "# Parity + preserve rules — preview first" },
  { kind: "prompt", text: "i18nprune sync --dry-run" },
  { kind: "out", text: "→ planned merges/prunes per policies.preserve" },
  { kind: "prompt", text: "i18nprune sync --yes" },
  { kind: "ok", text: "✔ Locale files match source shape" },
];

export const featuresReportTerminal: TerminalLine[] = [
  { kind: "comment", text: "# Evidence for humans + automation" },
  { kind: "prompt", text: "i18nprune report --format html --out dist/report.html" },
  { kind: "out", text: "→ portable HTML; global --json adds stdout envelope" },
  { kind: "ok", text: "✔ Same payload shape your scripts already parse" },
];

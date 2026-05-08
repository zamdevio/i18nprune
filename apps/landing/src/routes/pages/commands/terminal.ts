import type { TerminalLine } from "../../../types/terminal";

/** Narrative strip for `validate` on the commands page (illustrative). */
export const commandsPageValidateTerminal: TerminalLine[] = [
  { kind: "comment", text: "# Scan src/ for translation calls vs source locale JSON" },
  { kind: "prompt", text: "npx i18nprune validate" },
  { kind: "out", text: "→ missing literal keys, dynamic key sites, human-readable summary" },
  { kind: "prompt", text: "npx i18nprune validate --json" },
  { kind: "ok", text: "✔ Single envelope on stdout — wire CI gates & dashboards" },
];

/** Illustrative `sync --dry-run` (commands page). */
export const commandsPageSyncTerminal: TerminalLine[] = [
  { kind: "comment", text: "# Preview shape alignment — no writes" },
  { kind: "prompt", text: "i18nprune sync --dry-run" },
  { kind: "out", text: "→ would write … lines per target locale (subject to preserve rules)" },
  { kind: "prompt", text: "i18nprune sync --json" },
  { kind: "ok", text: "✔ One envelope — writtenFiles, files[], dynamicKeySites" },
];

/** Illustrative `doctor` for CI (commands page). */
export const commandsPageDoctorTerminal: TerminalLine[] = [
  { kind: "comment", text: "# Read-only: Node, rg, resolved paths" },
  { kind: "prompt", text: "i18nprune doctor --json | jq -e '.ok'" },
  { kind: "out", text: "→ findings[] with id, severity, title; exit 0 when clean" },
];

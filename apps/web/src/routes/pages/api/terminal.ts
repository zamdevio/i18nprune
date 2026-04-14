import type { TerminalLine } from "../../../types/terminal";

/** CI / automation angle — distinct from the commands-page validate strip. */
export const apiPageCiJsonTerminal: TerminalLine[] = [
  { kind: "comment", text: "# One envelope per run — gate on ok + kind + issues[]" },
  { kind: "prompt", text: "i18nprune validate --json > .ci/validate.json" },
  { kind: "out", text: "→ exit code matches domain outcome; stdout is only JSON (when supported)" },
  { kind: "prompt", text: "i18nprune validate --json | jq -e '.ok'" },
  { kind: "ok", text: "✔ No log scraping — stable contract (see docs: JSON output)" },
];

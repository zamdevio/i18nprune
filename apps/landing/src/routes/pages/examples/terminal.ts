import type { TerminalLine } from "../../../types/terminal";

/** Illustrative only — not a live shell */
export const examplesPowerChainingTerminal: TerminalLine[] = [
  { kind: "comment", text: "# targets.json lists { \"targets\": [\"ar\", \"de\"] }" },
  { kind: "prompt", text: "$ jq -r '.targets[]' targets.json | head -1" },
  { kind: "out", text: "ar" },
  { kind: "prompt", text: "$ i18nprune generate --target ar --json | jq -c '{ok, kind}'" },
  { kind: "out", text: '{"ok":true,"kind":"generate"}' },
];

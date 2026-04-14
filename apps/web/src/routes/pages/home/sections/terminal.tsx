import { motion } from "motion/react";
import Terminal from "../../../../components/terminal";
import type { TerminalLine } from "../../../../types/terminal";

const SESSIONS = [
  {
    id: "validate",
    label: "validate",
    command: "i18nprune validate",
    lines: [
      { kind: "prompt", text: "i18nprune validate" },
      { kind: "comment", text: "╭────────────────────────────────────────────────╮" },
      { kind: "comment", text: "│ ⚡ Validate — code ↔ source locale JSON        │" },
      { kind: "comment", text: "╰────────────────────────────────────────────────╯" },
      { kind: "out", text: "[i18nprune] [info] Scanning source files..." },
      { kind: "out", text: "[i18nprune] [info] Comparing with locales/en.json..." },
      { kind: "out", text: "Found 12 missing keys across 5 locales." },
      { kind: "out", text: "Found 4 unused keys in locales/en.json." },
      { kind: "comment", text: "" },
      { kind: "out", text: "✖ 12 missing keys", color: "#f87171" },
      { kind: "out", text: "⚠ 4 unused keys", color: "#fbbf24" },
      { kind: "comment", text: "" },
      { kind: "out", text: "[i18nprune] [info] validate · ok · 11ms" },
    ] as TerminalLine[],
  },
  {
    id: "sync",
    label: "sync",
    command: "i18nprune sync",
    lines: [
      { kind: "prompt", text: "i18nprune sync" },
      { kind: "comment", text: "╭────────────────────────────────────────────────╮" },
      { kind: "comment", text: "│ ⚡ Sync — merge + prune to source              │" },
      { kind: "comment", text: "╰────────────────────────────────────────────────╯" },
      { kind: "out", text: "[i18nprune] [info] sync · ok · 28ms" },
      { kind: "out", text: "  files: 9" },
      { kind: "out", text: "  written: 5" },
      { kind: "out", text: "  dynamic: 0" },
      { kind: "comment", text: "" },
      { kind: "comment", text: "  ── Sync summary ──" },
      { kind: "out", text: "  Source: ./locales/en.json" },
      { kind: "ok", text: "  · ./locales/ar.json (synced)", className: "underline decoration-emerald-400/30 underline-offset-4" },
      { kind: "ok", text: "  · ./locales/fr.json (synced)" },
      { kind: "ok", text: "  · ./locales/ja.json (synced)" },
    ] as TerminalLine[],
  },
  {
    id: "generate",
    label: "generate",
    command: "i18nprune generate --target ar --json",
    lines: [
      { kind: "prompt", text: "i18nprune generate --target ar --json | jq -c '{ok, kind}'" },
      { kind: "json", text: '{"ok":true,"kind":"generate"}' },
      { kind: "comment", text: "" },
      { kind: "comment", text: "# Real-time translation generated for Arabic" },
    ] as TerminalLine[],
  },
  {
    id: "report",
    label: "report",
    command: "i18nprune report",
    lines: [
      { kind: "prompt", text: "i18nprune report --out ./reports/i18n-report.html" },
      { kind: "comment", text: "╭────────────────────────────────────────────────────────╮" },
      { kind: "comment", text: "│ ⚡ Report — project report SPA (html) · json/csv/text  │" },
      { kind: "comment", text: "╰────────────────────────────────────────────────────────╯" },
      { kind: "ok", text: "✔ Wrote ./reports/i18n-report.html" },
      { kind: "comment", text: "" },
      { kind: "comment", text: "# Open and share the generated HTML file as needed" },
    ] as TerminalLine[],
  },
];

export function TerminalSection() {
  return (
    <section className="bg-background py-24">
      <div className="container mx-auto max-w-5xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Terminal 
            sessions={SESSIONS} 
            title="i18nprune — interactive demo"
          />
        </motion.div>
      </div>
    </section>
  );
}

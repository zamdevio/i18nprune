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
      { kind: "out", text: "[i18nprune] [info] 9 target file(s) · 0 dynamic key site(s)" },
      { kind: "out", text: "[i18nprune] [info] Updated: 5 · Unchanged: 4" },
      { kind: "comment", text: "  ✓ ./locales/ar.json (written)" },
      { kind: "comment", text: "  · ./locales/fr.json (unchanged)" },
      { kind: "comment", text: "  · ./locales/ja.json (unchanged)" },
      { kind: "out", text: "[i18nprune] [info] summary: files=9 · written=5 · dynamic=0" },
      { kind: "out", text: "[i18nprune] [info] sync · ok · 28ms" },
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
    <section className="bg-background py-32 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] max-w-4xl bg-primary/5 blur-[100px] pointer-events-none rounded-full" />
      <div className="container relative mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl overflow-hidden border border-border/50 bg-card/40 backdrop-blur-3xl shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
          <Terminal 
            sessions={SESSIONS} 
            title="i18nprune — interactive demo"
            className="border-none shadow-none bg-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
}

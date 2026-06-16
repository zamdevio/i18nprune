# Phase — AST tier (opt-in typed assist)

**Tier:** `extractor.depth: 'typed'`  
**Status:** planned — ships **after** v2 heuristic phases ([`hoc.md`](./hoc.md), [`light-dataflow.md`](./light-dataflow.md), [`cross-file.md`](./cross-file.md), [`finite-keys.md`](./finite-keys.md))  
**Blocks:** VS Code extension GA · [`provider-registry.md`](./provider-registry.md) (on hold until typed + extension stable)  
**Architecture:** [`architecture.md`](./architecture.md) · **Guardrails:** [`guardrails.md`](./guardrails.md) · **Perf budget:** [`README.md`](./README.md)

---

## Goal

Optional **TypeScript/SWC AST assist** layered on the regex-first default — not a rewrite of Tier 0.

Use cases:

- Hook return destructuring where presets are insufficient
- Narrow same-file assignment chains regex cannot see
- Typed union / enum key hints (overlap with [`finite-keys.md`](./finite-keys.md) Track B)

---

## Rules

1. **Opt-in only** — `extractor.depth: 'typed'` (or equivalent config knob); default users pay **zero** AST cost.
2. **Tier 0 must still work** — validate/cleanup/sync with typed tier disabled; parity snapshots unchanged.
3. **No `tsc` program by default** — per-file or bounded scope; document cost when whole-file parse is required.
4. **Issue codes frozen** — AST may add metadata; do not rename existing codes.

---

## Dependencies

- Shipped C.1 + E.1–E.6 + D.1 ([`README.md`](./README.md))
- v2 tiers that extend regex constmap / presets first (HOC, light-dataflow)

---

## Exit criteria

- [ ] Config flag documented in SDK init template when knob ships
- [ ] Benchmark: reference project documented with typed tier on vs off
- [ ] Negative fixtures — AST must not increase prose false positives
- [ ] Extension can consume same envelopes without forked scan logic

---

## Non-goals

- AST on every file for all users
- Full program typechecker integration
- Non-JS languages (see [`provider-registry.md`](./provider-registry.md) — after this phase + extension)

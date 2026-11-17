# Phase — AST / typed (opt-in)

**Tier:** `extractor.depth: 'typed'`  
**Status:** planned — heuristic v2 is shipped; this is the next extractor vertical after serve.  
**Unblocks:** [`registry.md`](./registry.md) (TS/JS typed path must be solid before non-JS providers).  
**Architecture:** [`architecture.md`](./architecture.md) · **Guardrails:** [`guardrails.md`](./guardrails.md) · **Hub:** [`README.md`](./README.md)

---

## Goal

Optional **TypeScript AST assist** on top of the regex-first default — not a rewrite of `fast`.

Primary payoff: **finite-keys Track B** — `candidateKeys` with `confidence: 'type_inferred'` from string unions / `as const` (never proven; `provenKeys` unchanged).

Also: narrow same-file patterns regex cannot see when types already constrain the hole.

---

## Rules

1. **Opt-in only** — default users pay **zero** AST cost.
2. **`fast` / parity frozen** — Tier 0 still works; parity snapshots stay `fast`-identical.
3. **Issue codes frozen** — AST may add metadata; do not rename existing codes.
4. **Candidates never become proven** — same discipline as Track A (`locale_inferred`).

---

## Slice 1 — MVP (first implementable cut)

| Item | Detail |
|------|--------|
| Config | `extractor.depth: 'fast' \| 'balanced' \| 'typed'` (default `fast`) |
| `balanced` | Alias of `fast` until a real escalation engine ships (document that) |
| Adapter | Isolated module (e.g. `extractor/typed/`); lazy / gated so `fast` never loads program APIs on the cold path |
| Scope | **Same-file only** — `type X = 'a' \| 'b'`, string-literal aliases, `as const` object keys |
| Wire | After locale Track A enrich when `depth === 'typed'`; dedupe by key, prefer `type_inferred` over `locale_inferred` |
| Packaging | Promote `typescript` out of core `devDependencies` (or optional peer) when typed ships |

Exit for MVP:

- [ ] Config + user docs (`docs/config/extractor.md`) + init `--rich` comment
- [ ] Unit + analysis fixtures; `provenKeys` unchanged; parity green on `fast`
- [ ] Negative fixtures — no prose FP increase
- [ ] Receipt under `shipped/extractor/`

---

## Later in this track (after MVP)

| Item | Why parked in MVP |
|------|-------------------|
| Full TS **Program** / cross-file symbols | Cost + isolation from `fast` |
| Real **`balanced`** escalation | Needs trigger/cap/merge spec first |
| JSX / cross-file typed prop tracing | Dataflow creep |
| Deeper multi-hop typed dataflow | Same |

---

## Non-goals

- AST on every file for all users
- Promoting candidates to proven keys
- Non-JS languages — see [`registry.md`](./registry.md)

---

## Suggested ship shape

1. MVP (same-file Track B + `depth` knob)
2. Program / `balanced` / JSX as follow-up PRs in the same vertical
3. Then open registry (Python first)

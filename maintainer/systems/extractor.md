# Extractor subsystem (maintainer map)

**Audience:** Maintainers and agents changing `packages/core/src/extractor/**` or call-site behavior.  
**User-facing mirror:** `docs/extractor/README.md` (behavior, limits, examples).  
**Phase sequencing:** `maintainer/phases/extractor.md` (design reference; Session **C.1** shipped).

---

## Responsibility

The extractor answers: **what the source text suggests** about translation helpers (literal keys, template keys, dynamic sites, import bindings). It is **regex-first** — no AST, no whole-program dataflow.

**Session C.1 (shipped):** bindings scan + `functions` expansion in `keySites` / `dynamic` orchestrators, prose first-arg filter in `shared/calls.ts`, commented-call parity tests, edge-case rows in `docs/edge-cases/unsolved/inventory.md`, and this page + `docs/extractor/README.md`.

---

## Per-file pipeline (post–C.1.2)

```txt
config.functions ────────────────────────────────┐
                                                  ↓
readFile → scanImportBindings → expandFunctionsWithBindings → effectiveFunctions
         ├ commentRanges / const map (orchestrator-specific)
         └ findTranslationCallSites(text, effectiveFunctions)
                    ├─→ keySites (scanKeyObservations, …)
                    └─→ dynamic (findDynamicKeySitesRaw / providers, …)
```

---

## Submodules (current)

| Area | Role |
| :--- | :--- |
| `extractor/bindings/` | Per-file import binding scan + `functions[]` expansion (aliases, module members, bracket/optional forms). |
| `extractor/shared/` | Cross-cutting utilities: project source scan (`projectScan.ts`), JS/TS-like lexical ranges (`jslikeTextRanges.ts`), literal key collection (`literals.ts`), translation call matching (`calls.ts`, `pattern.ts`), template prefix roots (`template.ts`), template used-root hints (`roots.ts`). |
| `extractor/constmap/` | `const` string map for template prefix substitution. |
| `extractor/dynamic/` | Dynamic key heuristics and JS-like providers. |
| `extractor/keySites/` | Literal / template key observations. |

---

## Intentionally **out of scope** (document; do not “fix” with regex alone)

- **Variable propagation:** `const tt = t`, `const fn = cond ? t : g`, passing `t` as a value, `const { t } = useTranslation()` return shapes, `const { t } = i18n` after a namespace import — needs dataflow or framework hooks.
- **Non-literal module specifiers:** `require(expr)`, `import(dynamicId)` when `expr` is not a string literal.
- **Guaranteed soundness inside every string/template:** bindings blank **literal interiors** (between quotes / backticks) plus comments before import regexes; **delimiters are preserved** so `from './m'` stays matchable. Imports authored only inside a template `${ … }` hole share the template interior treatment.
- **Compiler-only / rare forms** unless justified by fixtures: e.g. `import { default as x }` is supported; other edge forms stay explicitly listed in `docs/extractor/README.md` when added or deferred.

---

## Parity / API discipline

- User-facing issue codes and `--json` parity for shipped commands: see workspace rules and `tests/parity/`.
- Internal extractor modules remain **pure** in core (no `console.*`, no `process.*`).

---

## Cross-links

- Types: `packages/core/src/types/extractor/bindings/index.ts` (`ImportBinding`, `ImportBindingSource`).
- Blank ranges used before binding scan: `importBindingScanBlankRanges` in `packages/core/src/extractor/shared/jslikeTextRanges.ts`.
- Unresolved / deferred behavior: `docs/edge-cases/unsolved/inventory.md` (filter scope, reassignment aliases, hook destructuring).

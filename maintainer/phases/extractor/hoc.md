# Phase HOC — Hooks, one-hop aliases, and component passing

**Depth:** `fast` (hooks/alias); prop/HOC tracing **opt-in** within `fast` or via `balanced` escalation  
**Perf budget:** hooks/alias +0–150 ms cold · prop tracing **off** by default  
**Prerequisite:** E.1–E.6 + D.1 shipped — [`README.md`](./README.md)  
**Guardrails:** [`guardrails.md`](./guardrails.md) § HOC and hook detection · § Primary rule

Covers **helper indirection**: hook destructuring, renamed locals, and `t` passed via props / HOC wrappers.

---

## A. Hooks, one-hop aliases, destructuring

### Problem

Import-binding expansion finds `t` from **imports** only. It does **not** connect:

```ts
const { t } = useTranslation();   // hook return — local `t` invisible
const tt = t; tt('key');          // one-hop rename
const translate = i18n.t; translate('key');
```

Inventory: `extractor-reassignment-alias`, `extractor-hook-return-destructuring`.

### Target behavior

| Pattern | Classification | Proven key? |
|---------|----------------|-------------|
| `useTranslation()` → local `t` | Treat `t` as configured helper **when preset matches** | Same rules as direct `t('…')` |
| `const tt = t` (1-hop, same file) | Expand `tt` into effective `functions` | Same |
| `const { t } = useTranslation()` | Link destructured `t` to preset | Same |
| `const fn = cond ? t : g` | `non_literal` / dynamic — no promotion | No |
| Multi-hop `const a = t; const b = a; b('x')` | Tier 2 / opt-in only | No |

### Implementation (speed-safe)

1. **Framework preset table** (static JSON in core, keyed by init preset / config):
   - `next-i18next`: `useTranslation` from `next-i18next` → binds `t`
   - `react-i18next`: `useTranslation` from `react-i18next` → binds `t`
   - `next-intl`: `useTranslations` → binds `t` (namespace-aware later)

2. **Per-file scan** (no cross-file):
   - After `scanImportBindings`, regex-scan for `const { t } = useTranslation(` when import binding exists.
   - Build `localHelperAliases: Set<string>` from expanded import names + one-hop `const IDENT = t`.

3. **Wire into `findTranslationCallSites`** — `effectiveFunctions ∪ localHelperAliases`.

4. **Lazy:** skip if file has no hook import and no `= t` assignment pattern.

**No TypeScript program. No hook runtime simulation.**

### Non-goals (section A)

- `useTranslation('ns')` namespace propagation (hint only).
- Reassigned `t` across files.
- `const { t: translate } = useTranslation()` — phase 2 unless trivial regex add.

---

## B. HOC, props, and callback passing

### Problem

```tsx
function Row({ t }: { t: TFunction }) {
  return <span>{t('row.label')}</span>;
}
<Row t={t} />
const withT = (C) => (props) => <C {...props} t={t} />;
```

Regex sees `t('row.label')` but cannot know prop `t` is the i18n helper without **conventions** or **cross-component dataflow** (expensive).

### Target behavior (tiered)

| Tier | Work | Cost |
|------|------|------|
| **1** | `functions: ['t', 'translate']` + docs; optional `extractor.hoc.propNames` | Cheap |
| **2** | Same-file `function Foo({ t }` + `t('…')` in body when module uses hook preset | Medium |
| **3** | JSX `<Row t={t} />` prop trace | Expensive · opt-in only (not default `fast`) |

### Watch-outs (section B)

- **False positives:** unrelated props named `t`.
- **Recommendation:** automatic tracing only with `extractor.hoc.enabled: true`.

---

## Acceptance

- `useTranslation` + `t('a.b')` → literal observation.
- `const tt = t; tt('x')` → literal observation.
- Opt-in: `{ t }` prop component with `functions` includes `t` → keys found.
- Negative: local `function t() {}` shadow without import evidence.
- **Perf:** tier 1 hooks ≤ 750 ms cold on web benchmark; section B off by default.

---

## Related

- [`light-dataflow.md`](./light-dataflow.md) — `const k = …; t(k)` chains
- [`cross-file.md`](./cross-file.md) — shared `NS` constants

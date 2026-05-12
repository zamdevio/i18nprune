# Translation providers + progress — remaining work

**Status:** **Session A baseline + Phases 1–2 + most of Phase 3 are shipped.** This file now lists **only what is left** plus a minimal “done” receipt for tracking. Detailed historical write-ups live in PRs / `shipped-slices.md`.

**User docs:** [Translation config](../../docs/config/translate.md) · [Issues — translate](../../docs/issues/translate.md) · [Issues — generate](../../docs/issues/generate.md)  
**Commands:** [generate](../../docs/commands/generate/README.md) (**`--resume`**)

**Code anchors:** `packages/core/src/shared/translator/` · `packages/core/src/shared/translator/utils/orchestration.ts` · `packages/cli/src/shared/translator/resolveProvider.ts` · `packages/cli/src/shared/cursor/`

---

## Shipped (do not reopen)

- **Session A baseline:** core progress types + ticks, CLI stderr bar (rich + minimal), **`generate`** / **`generate --resume`** orchestration ticks, **`TRANSLATE_WORKERS_CAP`**.
- **Phase 1 — concurrency:** **`translate.providers[].rateLimit.maxConcurrency`** is honored; effective resolver + cap warnings in **`generate`** (including **`--resume`**).
- **Phase 2 — pacing:** per-provider start-rate gate (**`rpm` / `rps` / `intervalMs`**); merge order **provider row → core defaults**.
- **Provider defaults:** **`DEFAULT_PROVIDER_RATE_LIMITS`** exported from core; `init` templates pull from it.
- **`translate.policy.throttle` removed** (no compat); per-provider `rateLimit` is the only knob.
- **Routing — `auto` (basic):** ordered chain (`primary` first, then enabled rows; CLI/env pin pushes that id to the front but does **not** disable fallback in `auto`).
- **Auto fallback execution:** retryable failures (`429` / network) advance to the next provider **without restarting**; partial in-memory locale JSON is reused (**`TranslateRunInterruptedError`** carries **`partialLocaleJson`**).
- **Per-target route reporting:** **`providerAttempts[]`**, **`winnerProviderId`**, **`fallbackCount`** in JSON payloads; concise route line in human logs.
- **Failure surfacing:** structured issue codes for rate-limit / network failures; MyMemory **NEXT AVAILABLE IN …** parsed and surfaced.
- **`i18nprune providers`** is read-only (no config init side effects).
- **Cursor / progress UX:** centralized **`shared/cursor`** (lift policy + presets + stderr block clear). Progress finish/fail and provider/failure logs use one policy.
- **Confidence rounding:** values clamped to **2 decimals** on read & write paths.
- **Terminology:** user-facing **English-identical → source-identical** copy across CLI + docs + landing (stable JSON keys preserved).

---

## Remaining

### Phase 2 (optional)

- [ ] Respect server hints (**`Retry-After`**, MyMemory wait window) for **adaptive** wait tuning, not just constant `intervalMs`.

### Phase 3 — routing depth

- [ ] **Interactive mid-run handoff (TTY only).** On retryable failure, prompt the user to pick another **eligible** provider without restarting. Non-TTY / `--json` keeps deterministic auto fallback.
- [ ] **Per-run provider blacklist** state for richer route diagnostics (e.g. provider already 429-locked this run).
- [ ] **Failure-policy matrix.** Shared classifier with **`auth` / `quota` / `malformed` / `unknown` hard-stop** taxonomy in addition to current `rate_limited` / `network_error` / `non_retryable_error`.
- [ ] **Deterministic route summary** in JSON envelope / `run.*` events (final winner, attempts, skip reasons) — extends what we already emit per target.

### Policy block expansion (next active slice)

- [ ] **Plan locked** in **[`translate-policy.md`](./translate-policy.md)** — outcome → action verbs (`retry` / `backoff` / `fallback` / `prompt` / `abort` / `flag`), per-leaf marker via `needsTranslationAgain` (gated by `--metadata`), `ProviderHealthMonitor` for `backoff`, full `handoff` picker spec. **No backwards compat** with the current `'backoff' | 'fail'` / `'retry' | 'fail'` enums — clean rewrite.

### Post-policy slice — collapse `fill` into `generate --resume`

- [ ] After the policy plan ships, fold **`fill`** into **`generate --resume`**. One central translation consumer in CLI; tidier core; simpler third-party SDK story. Spec in **[`translate-policy.md`](./translate-policy.md) §10**.

---

## Cleanup when finished

- [ ] When everything above is shipped, replace this file with a one-liner pointer in **`active-phase.md`** and move historical bullets to **`shipped-slices.md`**.

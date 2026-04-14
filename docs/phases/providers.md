# Phase — Translation providers (`generate` / `fill`)

**Status:** **Planned** — **do not start** until the tracks ahead of it are in a good place (see §1).  
**User-facing docs (when shipped):** [commands/generate](../commands/generate/README.md), [commands/fill](../commands/fill/README.md), [behavior / JSON](../behavior/json-long.md).

This file is **development-only** (maintainer execution order).

---

## 1. When to schedule this work (gate)

Implement **after** the locked CLI tracks ahead of it are stable (envelopes + shared translate path), so provider choice does not fight half-finished surfaces:

| Prerequisite | Why |
|--------------|-----|
| **[locales](./locales.md)**, **`generate` + `fill`** — **completed** (`list` / JSON / **`targetResults`** / identity streak) | Stable CLI contract; provider id and per-target stats extend **one** envelope design ([generate.md](./generate.md), [fill.md](./fill.md)). |
| **`review` uplift** ([review.md](./review.md)) — **in progress** | Prefer **`review --json`** settled before adding **`provider`** to **`generate`/`fill`** payloads if both touch the same release window. |
| **[key-sites](./key-sites.md)** (at least: no blocking churn on shared `core` translate path) | Optional overlap is OK if provider work does not refactor `keySites` mid-flight. |
| **[patching](./patching/README.md)** loader / **locales edit** readiness | **Not** a hard code dependency for `Translator`; schedule **after** patching if you want fewer parallel CLI surface changes. |

**Rule of thumb:** start **providers** when **`generate`/`fill`** shared JSON + human summaries are stable enough that adding **`provider`** (and optional **model**) to **`data`** / logs is a small, documented delta.

---

## 2. Goals

| Goal | Description |
|------|-------------|
| **`--provider`** | Add **`--provider <id>`** to **`i18nprune generate`** and **`i18nprune fill`** (same flag name and semantics on both). |
| **Default** | **`google`** (current behavior: unofficial `gtx`-style HTTP translator) remains the **default** when **`--provider` is omitted**, for backward compatibility. |
| **`ai`** | Add an **AI** backend (exact vendor TBD: OpenAI / Anthropic / …) that implements the same **`Translator`** contract as Google. |
| **Extensibility** | Design a **small registry** (e.g. `google` \| `ai` \| future IDs) so additional providers (**DeepL**, **Azure Translator**, **LibreTranslate**, etc.) are **add provider module + id + docs**, not a third command shape. |
| **Config / secrets** | Non-Google providers use **env** (and optionally **config**) for API keys and model names — never commit secrets; document required vars per provider. |
| **Envelope / logs** | **`--json`**: include **`provider`** (and for **`ai`**, optional **`model`** if set) in **`generate`/`fill`** payload or **`meta`** as agreed when shared **`targetResults`** work lands — do not invent a second envelope; extend the same types. |

---

## 3. Non-goals (this phase)

- Replacing **`mask` / `restore` / `validateRestored`** for `{{…}}` placeholders — already in **`packages/cli/src/core/placeholders`** and **`translateLeaf`**. This phase may add **stricter** validation later (see §7).  
- Asking the model to emit **whole locale JSON** — **generate**/**fill** keep walking string leaves and writing JSON via code paths.  
- Choosing a single vendor for **AI** in this doc — pick at implementation time; the plan stays vendor-agnostic behind **`ai`**.

---

## 4. Architecture (fits current code)

Today:

- **`Translator`**: `{ translate(text, sourceLang, targetLang) => Promise<string> }` — **`packages/cli/src/types/core/translator`**.
- **`createTranslator()`** returns Google only — **`packages/cli/src/core/translator/init.ts`**.
- **`translateLeaf`** applies **mask → translate → restore → validateRestored** — **`packages/cli/src/core/translator/index.ts`**.

**Plan:**

1. **Registry** — Map **`--provider`** string → factory **`createTranslator(options)`** (options: locale pair, optional model, run context for logging).  
2. **Implementations** — `google` (existing), `ai` (new HTTP/SDK module), stubs or thin wrappers for future IDs.  
3. **CLI** — Parse **`--provider`**, default **`google`**, validate id early with a clear **`USAGE`** error.  
4. **Retries** — Keep **`translateLeaf`** retry loop; AI may need different backoff (document in provider module).  
5. **Rate / cost** — Document per-provider; optional **batching** of leaves is a **later** optimization (not required for v1 **`ai`**).

---

## 5. Provider IDs (illustrative)

| ID | Role |
|----|------|
| **`google`** | Current default; no API key in typical `gtx` usage. |
| **`ai`** | LLM-backed translation; requires env for API key + optional model override. |
| **Future** | e.g. **`deepl`**, **`azure`**, **`libretranslate`** — same flag and registry pattern. |

Exact enum / validation list lives in code + [issue codes](../json/issue-codes.md) if new failure modes appear.

---

## 6. CLI surface (illustrative)

- **`generate`** / **`fill`**: **`--provider <id>`** (optional; default **`google`**).  
- **Help text**: list supported ids and “see docs for env vars”.  
- **`--json`**: non-interactive runs must not prompt for provider; invalid id → **`issues[]`** / **`USAGE`** per existing rules ([prompts](../prompts/README.md)).

---

## 7. Safety follow-ups (can trail implementation)

Tracked here so they are not forgotten; not all must ship in the first PR.

| Follow-up | Intent |
|-----------|--------|
| **Placeholder hardening** | Stricter checks that **`{{…}}`** multiset matches after MT/LLM (beyond current **`validateRestored`**). |
| **Locale JSON validation** | After writes, optional **re-parse** / schema check of target JSON files (align with [patching](./patching/README.md) if schema lands). |
| **AI prompt contract** | System instructions that **must not** alter **`__I18NPRUNE_*`** sentinels produced by **`mask`**. |

---

## 8. Documentation updates (when shipping)

- [commands/generate](../commands/generate/README.md), [commands/fill](../commands/fill/README.md) — **`--provider`**, defaults, env vars.  
- [json/README.md](../json/README.md) or command JSON sections — new envelope fields.  
- [issue codes](../json/issue-codes.md) — new codes for provider errors if needed.

---

## 9. Checklist (implementer)

- [ ] **Gate:** confirm §1 prerequisites (or document intentional early start).  
- [ ] **CLI:** **`--provider`** on **`generate`** and **`fill`**; default **`google`**.  
- [ ] **Core:** registry + **`createTranslator`** dispatch; keep **`translateLeaf`** unchanged unless fixing a shared bug.  
- [ ] **Google:** path preserved as today when **`--provider google`**.  
- [ ] **AI:** implement **`ai`** with env-based auth + documented model id.  
- [ ] **JSON:** extend shared **`generate`/`fill`** types for **`provider`** (and optional **`model`**) consistently with [generate.md](./generate.md) § Planning.  
- [ ] **Tests:** unit tests for registry + at least one AI mock path; integration optional.  
- [ ] **Docs:** user + JSON docs updated (§8).

---

## See also

- [active-phase.md](./active-phase.md) — execution order (**review** → **key-sites** → **patching**; **`locales` / `generate` / `fill`** done).  
- [active-phase.md](./active-phase.md) — sprint hub.  
- [generate.md](./generate.md), [fill.md](./fill.md) — shared **`targetResults`** / progress (shipped).

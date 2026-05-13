# v1 release — consolidated work plan (~1 week)

**Single hub:** Ordered **sessions** below.  
**Sprint tweaks:** [`active-phase.md`](./active-phase.md).

**Shipped (do not reopen):** [`shipped-slices.md`](./shipped-slices.md)

**Location:** Maintainer-only under **`maintainer/`**. **`phases/`** detail is **not** mirrored to **`apps/docs`** (`pnpm docs:sync` reads only **`docs/**`**).

**Pre-publish:** **[`final.md`](./final.md)** holds the one-time gate (hygiene + ADR polish); **Sessions G–H** below walk it. Delete **`final.md`** per its footer after Session **H**.

---

## Session A — Translation progress + providers (**shipped**)

**Shipped.** Core architecture phases 1–3, translate-policy steps 1–10, `fill` → `generate --resume` collapse, provider orchestration. See [`shipped-slices.md`](./shipped-slices.md).

---

## Session A.2 — Core-op migrations (**shipped**)

All ops shipped — see [`shipped-slices.md`](./shipped-slices.md).

| # | command | status |
|---|---------|--------|
| 1 | `validate` → `runValidate` | **Shipped** |
| 2 | `report` → `runReport` | **Shipped** |
| 3 | `doctor` → `runDoctor` | **Shipped** |
| 4 | `locales dynamic` → `runDynamic` | **Shipped** |
| 5 | `locales list/edit/delete` | **Shipped** |

---

## Session B — **`review`** command (**shipped**)

**Shipped.** Stable `--json`; filters landed. See [`shipped-slices.md`](./shipped-slices.md).

---

## Session C — **Extractor hardening (keySites follow-ups)**

**Docs:** [`extractor.md`](./extractor.md) (§0), [`docs/regex/key-sites-and-dynamic.md`](../../docs/regex/key-sites-and-dynamic.md).

- Bounded PR: prose false positives (`t (or vice versa)`-style) + tests. **`keySites`** / **`KeyObservation`** surface is **shipped** in **`i18nprune/core`**—Session C is for remaining edge cases, not greenfield design.

---

## Session D — **Patching** (remaining backlog)

**Refs:** [`docs/patching/README.md`](../../docs/patching/README.md) (maintainer backlog section).

---

## Session E — **Docs friction (paths / copy)**

- Deferred bullets from prior planning (catalog `shared/languages`, command layout paths).
- Keep `docs/architecture/topology/*.md` in sync with landed architecture slices (mark planned vs shipped honestly during Sessions A–D).

---

## Session F — **`docs/` tree flattening (single-file dirs)**

Before release polish: audit **`docs/**/*.md`** for directories that contain **only** `README.md` (no sibling files). **Rule:** If a folder exists only as a stub index, folding to **`topic.md`** beside the parent avoids pointless nesting; **`README.md` keeps acting as directory index only when there are sibling pages** (`foo/a.md`, `foo/b.md`).

- Candidates to review: **`docs/architecture/tree`**, **`docs/architecture/languages`**, similar `*/README`-only dirs.
- **Sync impact:** **`apps/docs/scripts/sync.js`** maps `README.md` → `index.md` — rewrite **internal links** (`../sibling/README` patterns) after any move.
- **Deliverable:** short note in **`docs/README.md`** (or **`docs/contributors/`**) documenting the convention so agents do not regress.

---

## Session G — **ADR files & pre-publish polish**

Execute **[`final.md`](./final.md)** §§**1–2** (phase hygiene + ADR rename / docs sync). Do **not** delete **`final.md`** until **after** Session **H** succeeds—then run **`final.md`** §**3** (remove the checklist file).

---

## Session H — **Release gates**

- `pnpm typecheck`, `pnpm test`, smoke: `validate`, `generate`, `sync` on fixture.
- Version/changelog: [`docs/versioning/README.md`](../../docs/versioning/README.md).
- Complete **`final.md`** §**3** — delete **`maintainer/phases/final.md`** once the release is tagged / checklist is obsolete.

---

## Post-v1 (do not block)

| Item | Pointer |
|------|---------|
| `translate.policy.routing: 'auto'` advanced posture (`onQuotaExceeded`, `onAuthFailure`, mid-run handoff) | post-v1 optional tail |
| Worker bundle **`node:`** CI | [`docs/runtime/README.md`](../../docs/runtime/README.md) |
| VitePress `@next`, **`docs/exports` → `docs/core`** | post-v1 docs |
| Extractor — non-JS/TS languages, external plugins | [`extractor.md`](./extractor.md) §1–2 |

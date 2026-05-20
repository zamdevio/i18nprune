# Apps phase — core catch-up, sharing, hosted surfaces (**active next — Session C.3+**)

**Status:** **Active next** — **locales (H)**, **cache (H-cache) Phases 0–4**, and **translate-cache (H.1)** are **shipped**. Implement per [`V1-RELEASE.md`](./V1-RELEASE.md) Session **C.3**. **Phase 4** invalidate cleanup is already shipped.  
**Hub:** [`V1-RELEASE.md`](./V1-RELEASE.md) Session **C.3** · **Active narrative:** [`active-phase.md`](./active-phase.md) § Apps catch-up.  
**Related:** [`cache.md`](./cache.md) (disk cache + `share.json` placement) · [`locales.md`](./locales.md) (upload enumeration) · [`standard-toolkit.md`](./standard-toolkit.md) (CLI TTY / `--json`).

**For agents:** read this file before touching `apps/web`, `apps/report`, `apps/workers/i18nprune`, or `packages/core/src/share/`.

---

## Decisions (locked)

| Topic | Decision |
|-------|----------|
| **Share ownership** | **Core op** under `packages/core/src/share/**` — orchestration, payload build, re-upload policy, `share.json` I/O, structured logs/links. **CLI / web / report** are hosts only (prompts, HTTP upload, routing). |
| **Worker** | **One worker** (`workers.i18nprune.dev`) — **two storage kinds**: existing **project** rows (`POST /v1/projects`) and new **report** rows (`POST /v1/reports`). Same **7-day idle TTL** and `hex16Id()` style IDs. |
| **No duplicate storage** | Web/report “Share” when the session **already came from the worker** → **copy link only** (no re-upload). |
| **Privacy** | Upload **prepared project snapshot** (sanitized zip) or **report JSON only** — never opaque full-repo upload. Core emits a **manifest** before upload. |
| **Cache coupling** | `share.json` lives beside `files.json` / `analysis.json` under `cache/projects/<cacheProjectId>/`. Honors **`--no-cache`**, `cache.enabled`, `cache.mode`, `cache.dir` — same rules as analysis cache. |
| **CLI shape** | Parent `share` shows help when invoked bare (same pattern as `locales`). Subcommands: **`share list`**, **`share view`**, **`share delete`**. Default upload entry: **`share`** with `--project` / `--report`. |
| **Remote row GET (no `/metadata`)** | **`GET /v1/projects/:id`** and **`GET /v1/reports/:id`** return **metadata only** (mirror today’s project route). Full bodies: **`GET /v1/projects/:id/snapshot`**, **`GET /v1/reports/:id/document`**. **`share view`** uses the metadata GETs. |
| **`share.json` self-heal** | Core **loads safely**: auto-restore missing/corrupt files, strip unknown fields, drop invalid entries, **warn** once (do not fail silently; tell user not to hand-edit). |
| **Worker failures** | Core maps predictable worker errors (404/eviction, payload too large, validation, 5xx) → stable **`issues[]`** codes; CLI / web / report show the same guidance. |
| **Confirm gate** | After core builds payload + emits manifest logs → host asks **upload?** unless **`--yes`**, **`--json`**, or **non-TTY** (auto-**Y**). |
| **Parity** | Refactors must not change existing CLI `--json` envelopes / issue codes on parity fixtures; **new** `share --json` gets its own snapshots. |

---

## Scope

| In scope | Out of scope (v1) |
|----------|-------------------|
| `apps/web`, `apps/report`, `apps/workers/i18nprune` | `apps/landing`, `apps/workers/meta` |
| `packages/core/src/share/**` | `apps/extension` share UI (may open links later) |
| CLI `i18nprune share` (+ `list` / `view` / `delete`) | Accounts, ACL, private teams |
| `@i18nprune/host-snapshot` (or core `share/buildZip`) — dedupe zip parse | CLI disk `analysis.json` inside worker DO |

---

## Sequencing

```txt
translate-cache (H.1) shipped
    ↓
C.3a — core share op + share.json + host-snapshot dedupe
    ↓
C.3b — worker /v1/reports + project share idempotency hooks
    ↓
Share-1 — CLI share (project + report) + list/view/delete
    ↓
Share-2 — web /p/:projectId + Share (no re-upload when remote)
    ↓
Share-3 — report /s/:reportId + shell UI + Share (no re-upload when from worker)
    ↓
Session D — user docs (`docs/commands/share/`)
```

---

## 1. Core op — `packages/core/src/share/`

### 1.1 Layout (target)

```txt
packages/core/src/share/
├── index.ts              # barrel → runShare, runShareList, runShareView, runShareDelete
├── run.ts                # runShare — main upload orchestration
├── list.ts               # runShareList
├── view.ts               # runShareView — GET /v1/{projects|reports}/:id (+ merge local share.json)
├── delete.ts             # runShareDelete (local metadata + optional worker DELETE)
├── buildProjectPayload.ts  # prepared zip bytes + manifest
├── buildReportPayload.ts   # ProjectReportDocument (+ hash)
├── policy.ts             # shouldReupload?, read/write share.json
├── remote.ts             # mapWorkerShareResponse, classify worker HTTP/errors
├── io/
│   └── shareJson.ts      # read/write + Zod + self-heal share.json
├── links.ts              # web / report / worker URL builders (constants from core/links)
└── types/                # ShareKind, ShareManifest, ShareRunResult, ShareCacheEntry
```

Re-export from `packages/core/src/index.ts` and `packages/core/src/namespaces/share.ts` (mirror other ops).

### 1.2 `runShare` contract

**Inputs (`ShareRunOptions`):**

| Field | Meaning |
|-------|---------|
| `kind` | `'project'` \| `'report'` — required when host cannot infer |
| `source` | `'build'` (default) \| `'document'` (report JSON already built) \| `'worker-ref'` (link-only; no payload) |
| `workerRef` | When `source: 'worker-ref'`: `{ kind, workerBaseUrl, workerProjectId?, workerReportId? }` |
| `reportDocument` | Pre-built doc when `kind: 'report'` and skipping scan |
| `force` | Bypass re-upload policy (still builds manifest) |
| `workerBaseUrl` | Target API base (host resolves env default) |

**Host hooks (`ShareHostHooks`):**

| Hook | Owner | Role |
|------|-------|------|
| `emit` | Core → host | `run.share.manifest`, `run.share.skipped`, `run.share.uploaded`, `run.share.links` |
| `uploadProject` | CLI | `POST /v1/projects` multipart |
| `uploadReport` | CLI | `POST /v1/reports` JSON |
| `deleteRemote` | CLI | optional `DELETE` for `share delete` |
| `fetchRemoteRow` | CLI / web / report | `GET /v1/projects/:id` or `GET /v1/reports/:id` (metadata). Report app full import: `GET …/document`. |
| `confirmUpload` | **CLI only** | TTY confirm after manifest; core **never** calls `console.*` |

**Output (`ShareRunResult`):**

```ts
{
  action: 'uploaded' | 'skipped' | 'link-only';
  kind: 'project' | 'report';
  manifest: ShareManifest;       // always when built
  links: ShareLinks;             // web + report + worker URLs
  workerIds: { projectId?: string; reportId?: string };
  cacheEntry?: ShareCacheEntry;  // written when cache enabled
  issues: Issue[];
}
```

### 1.3 Manifest + logs (core-emitted, host prints)

Core emits structured events (host maps to stderr lines), e.g.:

- File count, byte size, top-level paths included (project)
- Excludes applied (`node_modules`, `.git`, …)
- `payloadContentHash` / `configHash`
- **Re-upload decision:** `skipped: unchanged payload (hash abc…)` vs `upload: new or forced`
- **Links after upload:** `https://web.i18nprune.dev/p/{id}`, `https://report.i18nprune.dev/s/{id}`, worker metadata URL

CLI flow:

1. `runShare` → manifest events on stderr (always, including `--json` runs — mirror `report` / `validate` human hints policy: decorative only when not `--json`).
2. If `needsUpload && canAsk && !--yes` → `confirm({ message: 'Upload this snapshot to …?', default: true })`.
3. If non-TTY or `--yes` or `--json` → **auto upload** (non-TTY = default **Y**).
4. Host calls `uploadProject` / `uploadReport`, then core finalizes `share.json` + link events.

### 1.4 `share.json` (disk cache metadata)

**Path:** `{cache.projectDir}/share.json` (same `projectDir` as `files.json` — [`cache/setup/paths.ts`](../../packages/core/src/cache/setup/paths.ts)).

**When disabled:** `--no-cache`, `cache.enabled: false`, read-only cache, or cache init failure → **no `share.json` writes**; re-upload policy falls back to **always upload** (or host may pass `force`).

**Schema (v1):**

```ts
type ShareJsonFile = {
  version: 1;
  entries: ShareCacheEntry[];
};

type ShareCacheEntry = {
  kind: 'project' | 'report';
  workerBaseUrl: string;
  workerProjectId?: string;   // project kind
  workerReportId?: string;    // report kind
  payloadContentHash: string; // sha256 of zip bytes or canonical report JSON
  configHash?: string;        // project only — from normalized config
  byteSize: number;
  uploadedAt: string;         // ISO
  lastUsedAt: string;         // ISO — updated on successful share skip or list
  links: {
    web?: string;
    report?: string;
    worker?: string;
  };
};
```

**Re-upload policy (`shouldReupload`):**

| Condition | Action |
|-----------|--------|
| No `share.json` or no matching entry | Upload |
| `payloadContentHash` (and `configHash` for project) **unchanged** vs last entry for same `workerBaseUrl` + `kind` | **Skip upload** — refresh `lastUsedAt`, return stored `worker*Id` + links |
| Hash changed or `force: true` | Upload (new worker id for project; new report id for report) |
| `share delete` removed entry | Next share uploads fresh |
| Hash match but worker **404** on probe | **Upload** (treat remote as gone); prune stale `share.json` entry; warn |

**Skip probe (v1):** before returning `action: 'skipped'`, core calls `fetchRemoteRow` (metadata GET). **404** → force re-upload path + heal local cache entry.

### 1.4b `share.json` load / self-heal (locked)

Implemented in `share/io/shareJson.ts` — **never throw** on local file problems; return `{ file, heal: ShareJsonHealReport, warnings: Issue[] }`.

| Situation | Behavior |
|-----------|----------|
| **Missing file** | Treat as `{ version: 1, entries: [] }`; optional write empty file when cache writable. |
| **Invalid JSON** | Rename to `share.json.bak.<timestamp>` when possible; start fresh `version: 1` entries `[]`. |
| **Wrong `version`** | Reset to v1 (or forward-migrate when we add v2 later); warn with old/new version. |
| **Unknown top-level keys** | Strip (Zod `.strip()`); warn: `Removed unknown share.json fields: …` |
| **Invalid `entries[]` rows** | Drop bad rows; keep valid; warn count + first reason. |
| **Duplicate worker ids** | Keep newest `lastUsedAt`; warn. |

**User-facing warning (single logger warn per run, CLI host):**

> `share.json` was missing or invalid — i18nprune repaired it automatically. Do not edit this file by hand; use \`i18nprune share list\` / \`share delete\` instead.

Core emits issue code **`share_json_repaired`** (severity `warning`) on any heal action. **`--json`** includes `heal` object in payload when applicable.

**When cache disabled:** skip read/write; no heal; policy always upload unless `worker-ref` link-only.

### 1.5 Worker remote errors (core-owned)

`share/remote.ts` normalizes worker `ApiResponse` / HTTP status into **`ShareRemoteError`** + stable issue codes (add to `packages/core` issue catalog + docs):

| Worker signal | Core issue code | Typical cause |
|---------------|-----------------|---------------|
| `404` + `PROJECT_NOT_FOUND` | `share_remote_project_not_found` | Unknown id or **7-day idle eviction** |
| `404` + `REPORT_NOT_FOUND` | `share_remote_report_not_found` | Same for report rows |
| `400` + `UPLOAD_ZIP_TOO_LARGE` / `UPLOAD_TOO_MANY_FILES` / `UPLOAD_TEXT_LIMIT_EXCEEDED` | `share_remote_payload_too_large` | Prepared zip exceeds worker limits |
| `400` + `REPORT_PAYLOAD_TOO_LARGE` / `REPORT_PAYLOAD_INVALID` | `share_remote_report_rejected` | Report JSON size / schema |
| `400` + other `UPLOAD_*` | `share_remote_upload_rejected` | Config/zip processing |
| `502` / `503` / network | `share_remote_unavailable` | Worker down / timeout |
| Unmapped 4xx/5xx | `share_remote_error` | Fallback with worker message |

**`runShare` / `runShareView` / skip policy** consume these — never leak raw fetch errors without an issue code.

**Re-upload after 404:** when skip policy matched hash but probe returned `share_remote_*_not_found`, core sets `action: 'uploaded'` path (or `needsUpload: true`), removes dead cache entry, warns that the old link expired.

### 1.6 `runShareList` / `runShareView` / `runShareDelete`

**`runShareList`:**

- Reads `share.json` for current project cache dir (respects cache disabled → empty list + warning issue).
- Filter: `--project <workerProjectId>` or `--report <workerReportId>` → single entry (worker-hosted id, not cache dir id).
- Returns `{ entries: ShareCacheEntry[], issues }` for CLI envelope / table.

**`runShareView`:**

- **Purpose:** show useful facts about a **hosted** share without downloading zip or full report document.
- **Inputs:** `kind: 'project' | 'report'` + `workerId` + `workerBaseUrl` (required on non-TTY).
- **Host:** `fetchRemoteRow` → **`GET /v1/projects/:id`** or **`GET /v1/reports/:id`** (see §3 — metadata only).
- **Merge:** when cache enabled, overlay local `share.json` entry (payload hash, lastUsedAt, cached links) on top of remote row.
- **Output (`ShareViewResult`):** `{ kind, workerId, remote, local?: ShareCacheEntry, links: ShareLinks, issues }`.
- **404:** `share_remote_project_not_found` / `share_remote_report_not_found` — message explains **7-day idle eviction** or wrong id; suggest re-share from CLI or re-open from web upload.
- **No upload, no mutate** — read-only; metadata GET **touches worker TTL** (same as today’s project GET).

**TTY:** `share view` with neither `--project` nor `--report` id → `select()` over `share.json` entries (if any), else prompt for worker id + kind.

**`runShareDelete`:**

- `--project <workerProjectId>` — delete matching cache entry; optional remote `DELETE /v1/projects/:id` or `/v1/reports/:id` via host hook.
- No flag + TTY → `select()` over known entries (show kind, id, uploadedAt, links).
- No flag + non-TTY → error: require `--project <workerProjectId>`.
- Does not delete worker row unless `--remote` (locked flag name) — default **local metadata only** vs **local + remote** TBD at implementation (recommend **`--remote`** opt-in to avoid accidental data loss).

---

## 2. CLI — `i18nprune share`

### 2.1 Command tree (mirror `locales`)

```txt
i18nprune share              → prints shareCmd.help() (no upload)
i18nprune share --help       → same

i18nprune share [upload]     → default upload entry (options below)
i18nprune share list [--project <workerId>] [--json]
i18nprune share view (--project <workerId> | --report <workerId>) [--json]
i18nprune share delete [--project <workerId>] [--remote] [--json]
```

**`share view` flags:**

| Flag | Effect |
|------|--------|
| `--project <workerProjectId>` | `GET /v1/projects/:id` |
| `--report <workerReportId>` | `GET /v1/reports/:id` |
| *(neither id)* + TTY | `select()` from `share.json` entries, then fetch |
| *(neither id)* + non-TTY | **Error** — require `--project` or `--report` |
| `--worker-url <url>` | Override worker base |
| `--json` | Envelope with `remote` + optional `local` + `links` |

Human output (non-JSON): compact table — ids, kind, `uploadedAt`, `lastAccessedAt`, byte size, schema/tool versions (report), extraction counts (project), share URLs, TTL hint (7-day idle).

Register in `packages/cli/bin/cli.ts` like `localesCmd`.

### 2.2 Upload flags

| Flag | Effect |
|------|--------|
| `--project` | Share **prepared project snapshot** (zip upload route) |
| `--report` | Share **report JSON** (report upload route) |
| *(neither)* + TTY | `select()` — “Project snapshot” vs “Report JSON” |
| *(neither)* + non-TTY | **Error** — must pass `--project` or `--report` |
| `--from <file>` | Report JSON path (report kind only) |
| `--worker-url <url>` | Override worker base |
| `--yes` | Skip upload confirm (still show manifest unless `--json`) |
| `--json` | `CliJsonEnvelope` with manifest + links + ids; **auto-upload** |
| `--force` | Ignore hash-based skip |
| Global `--no-cache` | No `share.json` read/write |

**TTY confirm:** `canAsk(run) && !getCliYesFlag()` → confirm after core manifest; default **true**.

**Non-TTY:** `shouldSkipInteractivePrompts()` → treat as **--yes** for upload gate.

### 2.3 Upload pipelines

**Project (`--project`):**

1. `resolveContext` + readiness (same preset family as `report` / `validate`).
2. `runShare` builds zip via shared **prepared snapshot** builder (config + locale JSON + `src` scan paths; shared ignore list with web).
3. Policy → upload or skip.
4. Print / envelope links.

**Report (`--report`):**

1. Load doc: `--from` or in-process `runReport` (same as `report --format json` body).
2. Validate `projectReportDocumentSchema` (`@i18nprune/report`).
3. `POST /v1/reports` with `{ document }`.
4. Link: `https://report.i18nprune.dev/s/{reportId}`.

---

## 3. Worker API

### 3.1 Existing — project storage

| Route | Role |
|-------|------|
| `POST /v1/projects` | Upload zip → `projectId` |
| `GET /v1/projects/:id` | Touch TTL + **metadata only** (today — unchanged) |
| `GET /v1/projects/:id/snapshot` | Full cached snapshot (heavy) |
| `DELETE /v1/projects/:id` | Evict → `PROJECT_NOT_FOUND` on later GET |

**No `/metadata` suffix** — the metadata GET **is** `GET /v1/projects/:id`.

**Project GET payload:** `projectId`, `projectHash`, `uploadedAt`, `lastAccessedAt`, `zipBytes`, `fileCount`, `textFileCount`, `detectedConfigPath`, `localeTags[]`, `extraction` summary — **no** zip bytes, **no** full preview arrays.

Limits: [`PROJECT_LIMITS`](../../apps/workers/i18nprune/src/lib/constants/project.ts) (50MB zip, etc.).

### 3.2 New — report storage (mirror project pattern)

| Route | Body | Validation |
|-------|------|------------|
| `POST /v1/reports` | `{ document: ProjectReportDocument }` | `projectReportDocumentSchema` + `REPORT_SHARE_MAX_BYTES` |
| `GET /v1/reports/:id` | — | Touch TTL; return **metadata only** (parallel to `GET /v1/projects/:id`) |
| `GET /v1/reports/:id/document` | — | Touch TTL; return **full** `{ document }` (report app import) |
| `DELETE /v1/reports/:id` | — | Evict → `REPORT_NOT_FOUND` on later GET |

**No `/metadata` route** — use `GET /v1/reports/:id` for metadata; **`/document`** for the heavy body (parallel to `/snapshot`).

**Report row shape (Durable Object):**

```ts
type ReportStoreRow = {
  reportId: string;
  payloadContentHash: string;
  byteSize: number;
  storedAt: string;
  lastAccessedAt?: string;
  document: ProjectReportDocument; // returned only by GET …/document
};
```

**`GET /v1/reports/:id` response** (metadata — same fields `share view` needs):

```ts
{
  reportId: string;
  payloadContentHash: string;
  byteSize: number;
  storedAt: string;
  lastAccessedAt: string;
  schemaVersion: number;
  toolVersion: string;
  generatedAt: string;
  summary: { missingKeysCount; dynamicSitesCount; keyObservationsCount; ok };
  project: { sourceLocalePath; localesDir; srcRoot; sourceLocaleTag? };
}
```

Storage: same `ProjectStoreDO` with key prefix `report:{id}` **or** parallel prefix map — implementation choice; **one retention sweep**.

**Distinct from** `POST /v1/projects/:id/report` (live report from cached extraction). Stored report = **exact CLI JSON** for `report.i18nprune.dev`.

### 3.3 Shared utilities

Extract duplicated zip logic from `apps/workers/.../lib/project.ts` and `apps/web/.../projectZip.ts` into **`@i18nprune/host-snapshot`** (or `core/share/zip.ts` if we avoid a new package — prefer **small workspace package** imported by core share builder + worker + web).

Worker **project report route** should call **`runReport`** with edge adapters (C.3 alignment).

---

## 4. `apps/web` — project sharing

### 4.1 URL

- Canonical: `https://web.i18nprune.dev/p/{workerProjectId}`
- SPA fallback on Cloudflare Pages (`/* → /index.html`).

### 4.2 Share action (workspace)

| Session | Behavior |
|---------|----------|
| `mode: 'remote'` with `projectId` | **Link-only:** `runShare({ source: 'worker-ref', kind: 'project', workerRef })` — copy existing link; toast cites 7-day TTL |
| `mode: 'local'` | Prompt upload → `POST /v1/projects` → then link |
| Open `/p/:id` | `GET /v1/projects/:id` → on success hydrate remote workspace; on **404** show eviction banner (below) |

### 4.3 Worker error UX (web)

Use core **`mapWorkerShareError`** (or shared TS helper exported for apps) — **do not** fork messages in web-only strings.

| Case | UX |
|------|-----|
| **`GET /v1/projects/:id` → 404** | Full-page / banner: link expired or project unknown (7-day idle eviction). Actions: **Upload again**, **Change worker URL** (settings), link to docs. Clear `session` + `snapHold` for dead id. |
| **Upload → payload too large** | Show `share_remote_payload_too_large` copy + limits (50MB zip / file counts). |
| **Upload → other 400** | Map `UPLOAD_*` codes; keep zip in browser for retry. |
| **5xx / network** | Retry hint + worker health link (settings test). |

**TTY / non-TTY:** N/A in browser; always show explicit UI (no silent failure). Same codes whether user opened `/p/:id` or was already in remote workspace.

### 4.4 Core integration

Web calls **`runShare`** for manifest text in UI modals. Upload + GET wrappers route HTTP through shared error mapper. Reuse existing `isWorkerProjectNotFoundError` — align with new stable issue codes.

---

## 5. `apps/report` — report sharing

### 5.1 URL

- Canonical: `https://report.i18nprune.dev/s/{workerReportId}`

### 5.2 Load paths

| Payload source | Load | Share |
|----------------|------|-------|
| Paste / file | `validatePayloadString` | Build doc → `POST /v1/reports` → link |
| `GET /v1/reports/:id/document` | Fetch full document + validate | **Link-only** share if session already bound to that `reportId` |
| `GET /v1/reports/:id` | Metadata only (`share view`, optional status chip) | — |
| Worker project report preview | Optional: import `POST .../projects/:id/report` JSON then share as report kind | Prefer report storage routes for share |

### 5.3 Worker error UX (report)

| Case | UX |
|------|-----|
| **`GET …/document` → 404** | `ErrorScreen`: report link expired / not found (7-day rule). CTA: import local JSON or run `i18nprune share report`. |
| **POST upload too large / invalid** | Schema/size message from worker code; do not claim import succeeded. |
| **5xx / network** | Retry + worker URL setting (dev). |

Track `source: 'worker' | 'paste' | 'file'` in report context so Share button uses **link-only** when `source === 'worker'`.

### 5.4 UI catch-up

Align shell with web/landing (header, theme, `getDocsUrl` links). Add “Open shared link” to import panel. Worker URL setting for dev (mirror web settings pattern).

---

## 6. C.3 — core alignment (pre-sharing)

| Task | Notes |
|------|-------|
| **`runReport` on worker** | Replace hand-built doc in `routes/report/index.ts` |
| **Locale / layout** | Keep `buildLocaleJsonByTagFromArchive` — already aligned |
| **Segment index** | After cache Phase 5 — optional worker/web convergence ([`cache.md` § Phase 5](./cache.md)) |
| **Types** | `@i18nprune/report` only for report DTOs |

---

## 7. Privacy & transparency

Core **`ShareManifest`** must include:

- `includedPathCount`, `byteSize`, `excludedPatterns[]`
- `kinds: ['config', 'locales', 'src-scan']` for project
- `reportOnly: true` for report kind
- `neverIncludes: ['node_modules', '.git', 'env-secrets-by-policy']` (wording in user docs)

CLI / web / report surfaces repeat the same bullets before confirm.

---

## 8. Implementation tracker

| # | Slice | Status |
|---|-------|--------|
| 0 | `packages/core/src/share/` types + **`share.json` I/O + self-heal** + `remote.ts` | **Shipped** |
| 1 | `runShare` project payload + manifest events | **Todo** |
| 2 | `runShare` report payload + validation | **Todo** |
| 3 | `runShareList` / `runShareView` / `runShareDelete` | **Todo** |
| 4 | `@i18nprune/host-snapshot` — dedupe zip parse (worker + web) | **Todo** |
| 5 | Worker reports CRUD — **`GET /v1/reports/:id`** (metadata) + **`GET …/document`** | **Todo** |
| 6 | CLI `share` + `list` / `view` / `delete` + worker error envelopes | **Todo** |
| 7 | Web `/p/:id` + Share + **404 / too-large UX** | **Todo** |
| 8 | Report `/s/:id` + **`/document` load** + Share + error UX | **Todo** |
| 9 | Worker `runReport` alignment | **Todo** |
| 10 | User docs `docs/commands/share/` + OpenAPI | **Todo** |

**PR discipline:** one row per PR; `pnpm typecheck` + `pnpm test`; parity unchanged except new `share --json` fixtures.

---

## 9. Testing

| Layer | Focus |
|-------|-------|
| `share/io.test.ts` | Missing/corrupt/unknown fields → heal + `share_json_repaired` |
| `share/remote.test.ts` | Maps 404/413/400/5xx → stable issue codes |
| `share/policy.test.ts` | Hash skip/miss; `--no-cache`; worker 404 → force re-upload |
| CLI | TTY confirm; non-TTY auto-upload; `view` 404 message |
| Worker | `GET :id` metadata vs `GET :document` body; oversize POST codes |
| Web/report | 404 banner; payload too large; link-only when worker-sourced |

---

## 10. Open questions (resolve at slice start)

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | `share delete` default remote delete? | **Local metadata only**; `--remote` deletes worker row |
| 2 | Path vs hash URLs | **Path** `/p/:id`, `/s/:id` + SPA fallback |
| 3 | Worker 404 on skip | **v1:** metadata GET probe before skip; 404 → re-upload + prune cache |
| 4 | `share delete --project` id namespace | **Worker-hosted id** (`workerProjectId` / `workerReportId`), not cache `projectId` |
| 5 | List filter `--project` | Same worker id; optional `--kind report\|project` |
| 6 | `view` uses `--report <id>` vs `--project <id>` | **Separate flags** (not one `--project` for both kinds) |

---

## 11. Sharpened notes on contributor proposals

The following refinements are **accepted** and integrated above:

1. **Core-owned share** — Correct; matches `runReport` / `runValidate` model. CLI only gates TTY confirm and HTTP.
2. **Non-TTY default Y** — Explicit: skip prompt, always upload after manifest (unless `runShare` policy skips). Same family as `shouldSkipInteractivePrompts`.
3. **`--project` / `--report` + `select()`** — Non-TTY must pass a flag; avoids hung CI waiting for stdin.
4. **No re-upload in web/report when already from worker** — `source: 'worker-ref'` is the single code path; prevents duplicate DO rows and matches user expectation (“share again” = same link).
5. **`share.json` in cache dir** — Correct placement; reuse `CacheState.projectDir`. Ties re-upload to **content hash**, not CLI session.
6. **`share list` / `share delete`** — Good hygiene; `delete` should not surprise-delete remote without `--remote`.
7. **Parent `share` → help** — Matches `locales`; avoids accidental upload.

**Optional sharpening for a later slice:**

- **Canonical JSON for report hash** — stable stringify before sha256 (`buildReportPayload.ts`).
- **Web/report status chip** — `GET /v1/reports/:id` or `GET /v1/projects/:id` before loading heavy routes.

**Accepted in this plan (latest):**

- **No `/metadata` routes** — `GET /v1/reports/:id` matches `GET /v1/projects/:id`; full report via **`/document`**.
- **`share.json` self-heal** with user warning + `share_json_repaired` issue.
- **Worker 404 / too-large / validation** — core issue codes; web + report + CLI share the same semantics.
- **Skip probe on 404** — never return a stale “skipped” link when the worker row is gone.

---

## Code map (quick)

| Concern | Path |
|---------|------|
| Share op (new) | `packages/core/src/share/` |
| Cache paths | `packages/core/src/cache/setup/paths.ts` |
| Report schema | `packages/report/src/schema.ts` |
| Worker DO | `apps/workers/i18nprune/src/lib/do.ts` |
| Web workspace | `apps/web/src/pages/workspace/index.tsx` |
| Report loader | `apps/report/src/data/loader/validate.ts` |
| CLI locales pattern | `packages/cli/bin/cli.ts` (`localesCmd`) |
| CLI ask gate | `packages/cli/src/shared/ask/gate.ts` |

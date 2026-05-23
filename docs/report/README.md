# Report UI (embedded React SPA)

The **`report`** command can emit a **single self-contained HTML file** (`--format html`) that embeds a **Vite-built React application**. There is no separate `js`/`css` host: everything is inlined into one document for **offline** opening (email, CI artifacts, local file).

**Related**

- **Payload contract** (kind, `schemaVersion`, manual import): [report/payload](./payload.md)
- CLI usage, flags, and formats: [commands/report](../commands/report/README.md)
- Source entry: `apps/report/` (this document describes behavior and patterns)

---

## What ships in the HTML

1. **Bundled UI** — Output from `vite build` + `vite-plugin-singlefile` → `dist/report/index.html` (copied next to the published CLI).
2. **Embedded JSON** — The project report payload is injected as the **text content** of `<script type="application/json" id="i18nprune-inline-payload">`. The placeholder token must match `REPORT_INLINE_PAYLOAD_PLACEHOLDER` in `packages/cli/src/constants/env.ts` (`__I18NPRUNE_REPORT__`).
3. **Hash routing** — `react-router-dom` **HashRouter** so `file://` and static hosting work: `/#/`, `/#/missing`, `/#/dynamic`, `/#/observations`, `/#/heatmap`, `/#/namespaces`.

---

## Architecture (high level)

| Area | Role |
|------|------|
| **`data/loader`** | Reads `#i18nprune-inline-payload`, `JSON.parse`, validates with Zod (`@i18nprune/report-schema` / `packages/report`). **Manual import** (paste / file) uses the same validation (`validatePayloadString`). Dev server without payload uses `data/mock`. |
| **`context/report`** | Provides validated `ProjectReportDocument`; wraps editor preference, search, and pagination providers. |
| **`components/payload-import`** | Collapsible panel (collapsed by default on the main shell; open on the missing-payload screen; auto-expands on validation error): paste or choose `.json`, load with schema + version errors. |
| **`context/search`** | Global filter string; list routes use `matchesSearch` on row text. |
| **`context/pagination`** | Per-list page + page size; **rows per page** persisted in `localStorage` (`i18nprune-report-page-size`). |
| **`context/editor`** | Preferred editor for `file://` / `vscode://` / `cursor://` links (`lib/editor`, `localStorage`). |
| **Doc links in UI** | Import **`getDocsUrl`**, **`GITHUB_BASE`**, **`GITHUB_REPO`** from **`@i18nprune/core`** (same as CLI; Vite alias in `vite.config.ts`). |
| **`components/shell`** | Header (brand, **toolbar**: search + editor dropdown, theme dropdown, route badge), nav, footer links. |

**Styling** — `styles/global.css` (single CSS chunk inlined). **Icons** — inline SVGs in `components/icons.tsx` (no icon font CDN).

---

## Patterns used

- **Folder `index` modules** — e.g. `pages/overview/index.tsx`, `context/report/index.tsx`, so imports stay stable and barrels are real implementations.
- **Offline-first** — No runtime fetch for data or icons; footer links use **`getDocsUrl`**, **`GITHUB_BASE`**, **`GITHUB_REPO`** from **`@i18nprune/core`** (same as CLI).
- **Desktop-gated editor UI** — `useDesktopReportChrome` hides the editor opener on small / coarse-pointer viewports; theme + search stay available.
- **Custom dropdowns** — Editor, theme, and **rows-per-page** use shared **toolbar dropdown** markup/CSS (`.toolbar-dropdown*`), not native `<select>`, for consistent keyboard and click-outside behavior. **Rows** opens **upward** (above the control). **Theme** on narrow viewports aligns the menu to the **left** of the trigger so options extend to the right and stay in view.
- **Search empty state** — When data exists but the filter matches nothing, `SearchNoMatches` offers **Clear search**.

---

## Local development

From the repository root:

```bash
pnpm report:dev
# production bundle (single inlined HTML):
pnpm report:build
```

Opens the Vite app without embedded payload: the loader uses **mock data** in development when the script tag is missing or placeholder-only.

### Why the hosted page can look “blank”

The file at **`apps/report/index.html`** is only the **dev entry**: it loads `/src/main.tsx`, which **does not exist** on a static host. A correct deploy uses the **built** output: **`apps/report/dist/index.html`** after `pnpm report:build` — that file inlines the full JS/CSS (via `vite-plugin-singlefile`). Upload or point Cloudflare Pages at **`apps/report/dist`** (or run `pnpm report:deploy` from the repo root). If you publish the wrong folder or the raw `index.html`, the shell has **no runnable bundle**, so `<div id="root">` never mounts and the page stays empty even though you see JSON in view-source.

---

## Tests

- SPA-adjacent unit tests: `apps/report/src/lib/__tests__/` (e.g. risk score, editor link hrefs).
- HTML injection safety: `packages/cli/src/commands/report/__tests__/htmlTemplate.test.ts` (only the inline payload script body is replaced).
- Integration: `tests/integration/report.command.test.ts` (CLI emits valid HTML + JSON).

---

## Changing the payload shape

1. Update **`packages/report`** (schema + types) and mirror any CLI-only types in **`packages/cli/src/types/command/report`** if needed.
2. Types + Zod live in **`packages/report`** (`@i18nprune/report-schema`); the SPA workspace package is **`@i18nprune/report`** (`apps/report`) and re-exports schema types from `apps/report/src/types`.
3. Adjust **`build.ts`** if new fields are produced at scan time.

Keep **optional** fields for older saved JSON when possible so `--from` and old HTML still load.

---

## Missing keys vs source locale

The **Missing keys** table lists **dotted key paths** that appear in **translation calls in your codebase** but are **not** present as **string leaves** in the configured **source locale** JSON — the same file **`validate`** checks against. It does **not** list keys that exist only in other locale files unless you change which JSON is the source of truth in config.

---

## Summary fields (CLI)

- **`summary.sourceFilesScannedCount`** (when present) — number of source files under `project.srcRoot` scanned for key-site and dynamic analysis (same scope as those pipelines).

---

## Risk score (v1)

The Overview card uses:

`risk = missingKeysCount * 5 + dynamicSitesCount * 2`

This is a simple prioritization heuristic (not a correctness proof). Missing literal keys are weighted higher than dynamic sites because they are directly actionable against the source locale.

---

## Filesystem paths, casing, and “duplicate” files

The CLI does **not** run a separate dedupe pass over paths for the JSON payload:

- **`sourceFilesScannedCount`** comes from a single directory walk (`listSourceFiles`). Each filesystem entry is visited once, so the **count is one row per file path string** returned by the OS (no duplicate paths from the walk itself).
- **Filename extension filtering** uses a case-insensitive pattern on the basename (e.g. `.ts` matches `.TS`); path strings still reflect how the OS names files.
- On a **case-sensitive** volume, two files that differ only by case (e.g. `Foo.tsx` vs `foo.tsx`) can both exist and are counted and reported separately. On typical **case-insensitive** setups, the OS prevents that collision.
- **`details.missingKeys`**, **`details.dynamicSites`**, and **`details.keyObservations`** can legitimately repeat the same `filePath` on **multiple rows** (several calls in one file). That is expected; rows are not merged by file.

---

## Kind values (dynamic sites & observations)

**Dynamic sites** (`details.dynamicSites`) — the payload includes full scanner objects (`filePath`, `line`, `isCommented`, `isSourceFile`, `isMultilineCall`, etc.). The HTML table shows the main fields plus **In comment** and **Source file**. Kind values classify the call:

| Kind | Meaning |
|------|---------|
| `non_literal` | The key argument is not a string literal (variable, expression, etc.). |
| `template_interpolation` | Template literal or embedded `${…}` so the key is not a single static string. |
| `empty_call` | Translation call with no / empty key argument. |
| `commented` | Call appears commented-out in source but was still noted. |

**Key observations** (`details.keyObservations`) — includes `span.filePath`, `span.isMultilineCall`, etc.; the HTML table includes a **Multiline call** column. Kind values:

| Kind | Meaning |
|------|---------|
| `literal` | Static string key at the call site. |
| `template_resolved` | Template could be resolved to a concrete key for this report. |
| `template_partial` | Only part of the template could be resolved. |

Exact strings are defined by the scanner; treat unknown values as informational.

### Dynamic key philosophy

Dynamic keys are **reported, not fully resolved**. The tool surfaces their locations and context (`kind`, preview, file/line, comment/source flags) so teams can audit and fix them, but it does not pretend unresolved runtime expressions are static keys.

---

## Printing

List sections (**Missing keys**, **Dynamic sites**, **Observations**, **Hotspots**, **Namespaces**) open **Print…** and choose:

- **Current page** — rows visible with the current pagination (fast, small).
- **All matching search** — every row that passes the global search filter (still from embedded JSON).
- **Full embedded section** — all rows stored in this HTML file for that section (full scan output from the CLI).

**Overview** prints a single two-column snapshot (summary + paths + environment) from the payload — no scope picker.

The print preview is built from the embedded JSON, not from re-fetching the project.

---

## Troubleshooting (payload / schema)

- **`schemaVersion` in JSON** — This is the **report DTO format version** (see `packages/report`), not the npm package version. It bumps when the `i18nprune.projectReport` shape changes incompatibly.
- **“Unsupported schema version” in the HTML UI** — The embedded JSON’s `schemaVersion` does not match the viewer baked into that `index.html`. Regenerate HTML with the same CLI line you used for JSON, or run `i18nprune report --from report.json --format html` so JSON and shell stay aligned.
- **CLI says the report template is missing** — A full repo `pnpm run build` is required in development so `apps/report` builds and `dist/report/index.html` is copied next to the CLI bundle. Published installs ship that file under `dist/report/`.

---

## Editor deep links (`vscode://` / `cursor://`)

Editor links use **only** `project.environment` from the report (no browser OS detection). They are **hidden** when the payload cannot safely build URIs — notably **WSL** scans need `wslDistroName` when the runtime is treated as WSL so Windows-side editors can resolve paths. Regenerate the report with a current CLI if environment fields are missing.

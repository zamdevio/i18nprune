# Repository tree

This describes the **source and tooling layout** of the i18nprune repository. **Excluded** from the listing below: **`node_modules/`**, **`dist/`**, build output under **`apps/docs/.next/`**, **`apps/docs/out/`**, **`apps/web/dist/`**, **`coverage/`**, and typical editor folders.

**Authoritative markdown** for the product lives in root **`docs/`** (synced into **`apps/docs/content/`** for the Nextra site). Maintainer phase notes live in **`docs/phases/`** (same sync; tracked in git).

```
.
├── apps/
│   ├── docs/                  # Next.js + Nextra docs app
│   ├── extension/             # VS Code extension scaffold (see docs/phases/extension/README.md)
│   ├── report/                # Vite SPA for embedded HTML report UI
│   └── web/                   # Vite + React landing (i18nprune.dev)
├── docs/                      # Public markdown source of truth
│   └── phases/                # Maintainer phase index + notes (tracked in git)
├── packages/
│   ├── cli/                   # CLI entry (bin/) and src/ — core product code
│   └── report/                # Shared report DTO / Zod schema
├── scripts/                   # Repo scripts (languages catalog, report dts flatten, …)
├── tests/
│   ├── fixtures/sample-i18n-app/
│   └── integration/
├── package.json               # Published npm package + workspace root
├── pnpm-workspace.yaml
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

**Data flow (CLI):** **argv** → **`RunOptions`** + overrides → **`resolveContext()`** → command → **stdout/stderr** via **`logger`**.

**Build output:** `pnpm build` writes root **`dist/`** (`cli.js`, `config.js`, `core.js`, `report.js`, typings). **`pnpm web:build`** writes **`apps/web/dist/`** for the landing site.

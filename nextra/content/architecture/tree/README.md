# Repository tree

This describes the **source and tooling layout** of the i18nprune repository. **Excluded** from the tree (generated, vendored, or docs-site only): **`node_modules/`**, **`dist/`**, **`docs/`**, **`nextra/`**, **`coverage/`**, and typical editor folders.

```
.
├── bin/
│   └── cli.ts                 # Commander entry, preprocessArgv, global flags, subcommands
├── scripts/
│   └── languages/
│       ├── codes.json         # Input codes for catalog generation
│       └── generate.ts        # Builds src/core/languages/languages.json
├── src/
│   ├── argv/                  # argv preprocessing (`--langs` → `languages`)
│   ├── commands/              # One folder per CLI command (generate, doctor, …)
│   ├── config/                # schema, load (TS/JS via jiti), resolve, init prompts
│   ├── constants/
│   │   └── docs.ts            # Public docs base URL for help footers
│   ├── core/                  # context, json, extractor, scanner, translator, progress, …
│   ├── exports/
│   │   └── config.ts          # defineConfig entry for npm subpath
│   ├── providers/             # translation providers (e.g. google)
│   ├── types/                 # shared TypeScript types
│   └── utils/                 # ansi, logger, fs, paths, rg, help, style, …
├── tests/
│   ├── fixtures/
│   │   └── sample-i18n-app/   # Mini app for integration / manual checks
│   └── integration/
│       └── cli.fixture.test.ts
├── i18nprune.config.ts.example
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

**Data flow:** **argv** → **`RunOptions`** + CLI overrides → **`resolveContext()`** (config + paths) → command handler → **stdout/stderr** via **`logger`**.

**Build output:** `pnpm build` writes **`dist/`** (`cli.js`, `config.js`, `core.js`, typings) — not listed above.

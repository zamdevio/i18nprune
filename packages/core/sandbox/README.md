# Core package sandbox preview

This directory holds a **single static HTML page** (`index.html`) used as a **lightweight preview shell** for **`@i18nprune/core`**—for example when the package is opened alone in [CodeSandbox](https://codesandbox.io) or any static file host that expects an entry HTML file.

## What it is not

- It is **not** the full marketing site (architecture diagrams, full docs, etc.). For that, use **[i18nprune.dev](https://i18nprune.dev)**.
- It is **not** part of the published TypeScript API; it does not replace reading `src/` or package `exports`.

## Why it exists

Some sandboxes and static hosts report errors like **“Could not find entry file: `/index.html`”** when the project only contains `package.json` and `src/`. Dropping this page (or copying it to the sandbox **root** as `index.html`, depending on what the host expects) gives the preview pane something to render while you work on the SDK.

## Contents

| File        | Purpose |
|------------|---------|
| `index.html` | Self-contained page (inline CSS/JS): short intro, nav, optional “On this page” rail, theme toggle, footer links to docs / GitHub / npm / demos. No build step. |

## Using it in CodeSandbox (or similar)

1. Keep your usual **`package.json`**, **`src/`**, **`vitest.config.ts`**, **`tsconfig.json`**, etc., as documented for the core package.
2. Either:
   - **Copy** `sandbox/index.html` to the project **root** as **`index.html`** if the preview server only looks there, or  
   - **Configure** the sandbox static preview to open **`sandbox/index.html`** if the product supports a custom path.

3. Run **tests** via **`npm test`** / **`pnpm test`** (Vitest); the HTML file does not affect the test runner.

## Editing

Prefer small copy and link updates here. For large marketing or product narrative changes, update the main site repo instead and keep this page as a short pointer.

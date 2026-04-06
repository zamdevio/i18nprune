# Agent rules

- **TypeScript** — `moduleResolution: NodeNext`; imports use `.js` extensions.
- **CLI** — **`RunOptions`** from argv; **`resolveContext()`** for paths.
- **Output** — **`logger`** + **`canPrint*`**; errors → **`logger.err`**.
- **Tests** — `src/**/__tests__/`; integration under `tests/integration/`.

# Exports Example Template

Use this template for each export example page under `docs/exports/examples/<namespace-or-api>/README.md`.

## Goal

Describe what API surface this example demonstrates.

## Imports

```ts
import { ... } from 'i18nprune/core';
```

Include both flat and namespaced imports when useful.

## Minimal script

```ts
// runnable Node/tsx example
```

## Output shaping

If the script emits JSON, show a `jq` snippet to post-process output:

```bash
node script.mjs | jq '...'
```

## Timing probe

```bash
time node script.mjs
```

## Edge cases

- Invalid input config/path handling
- Empty results
- Conflicting policy flags/inputs (if supported)

## Related docs

- `docs/exports/core.md`
- `docs/exports/config.md`
- Command docs using the same core logic

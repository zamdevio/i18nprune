# Schema-first locale model

How i18nprune derives locale JSON shape from **code and schema**, not by cloning the source locale file’s nesting on disk.

## Principle

- **Schema** = leaf paths discovered from the project scan (`usage.resolvedKeys` and related analysis).
- **Source locale** = reference strings for those paths (and parity/preserve policy input).
- **Target locale** = written as **canonical nested JSON** at schema leaf paths only — extra keys in an on-disk target file that are not in schema may be pruned on sync; generate does not mirror source file structure.

Leaf path semantics (flat dotted keys vs nested objects) are normalized via **`projectLocaleLeaves`** in `packages/core/src/shared/locales/projection.ts`.

## Operations

| Op | Schema-first behavior |
| --- | --- |
| **`generate`** | Starts from `{}` for new targets; translates schema/source leaves; writes nested output. Does not copy source JSON tree shape. |
| **`generate --resume`** | Walks target leaves that still match source (stale / review). If the target file is missing, seeds candidates from the source map (same as a new target) instead of failing. |
| **`sync`** | Builds a template from schema paths only, merges into each target, prunes extras not in schema. |

Entry points: `packages/core/src/generate/run.ts`, `packages/core/src/generate/resume/run.ts`, `packages/core/src/sync/run.ts`.

## Related

- User-facing examples: `docs/locales/schema-first.md`
- Filesystem layouts (`mode` / `structure`): `docs/locales/layouts.md`
- Projection: `packages/core/src/shared/locales/projection.ts`

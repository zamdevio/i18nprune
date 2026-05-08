# `doctor` — command system sheet

## Status

- **Stability:** stable
- **Last reviewed:** systems tree bootstrap

## Operator surface

- **User docs:** `docs/commands/doctor/README.md` (if present)

## CLI entry

- **`runDoctor`:** `packages/cli/src/commands/doctor/jsonEnvelope.ts`
- **Findings (human):** `packages/cli/src/commands/doctor/run.ts` → **`collectDoctorFindings`**

## Notes

- Doctor typically emits **`run.started`** + **`run.completed`** only (confirm in **`runDoctor`** + [`flows-and-entrypoints.md`](../operations/flows-and-entrypoints.md)).

## Frozen API

- Envelope kind **`doctor`**, **`findings[]`**, **`strict`**.

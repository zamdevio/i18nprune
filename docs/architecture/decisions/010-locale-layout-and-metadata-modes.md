# ADR 010 — Locale layout and metadata modes

**Status:** Accepted  
**Date:** 2026-05-17  
**Deciders:** Abdisamed Mohamed  
**Related ADRs:** [ADR 008](./008-cache-ownership-and-host-boundary.md)

## Context

Repos use different on-disk locale shapes (`flat_file`, `locale_directory` + `structure`). Writer commands (`sync`, `generate`) also support **plain string** vs **structured** leaves for translation workflows. Layout fingerprints feed `files.json`; metadata flags can conflict in one `sync` invocation.

## Decision

1. **Layout is config-driven** — `locales.mode`, `locales.structure`, `locales.directory`, `locales.source`; fingerprint stored in `files.json` as `localesLayout`. A mismatch triggers a **full** analysis rebuild (safe default).
2. **Schema-first keys** — shape comes from source scans, not from mirroring arbitrary nested source JSON.
3. **Leaf modes:** `legacy_string` (default) vs `structured` (`localeLeaves.mode` or `--metadata` on writers). `sync --strip-metadata` rolls structured leaves back to plain strings.
4. **Flag precedence:** if both `--metadata` and `--strip-metadata` are passed, **strip wins**; emit `i18nprune.sync.metadata_flag_conflict` so automation detects ambiguous intent.
5. **`generate --metadata`** controls **persistence** of structured leaves; metadata is still computed during processing when not persisted.

## Implementation

```ts
export default {
  locales: {
    source: 'en',
    directory: 'messages',
    mode: 'locale_directory',
    structure: 'locale_per_dir',
  },
  localeLeaves: {
    mode: 'legacy_string',
  },
};
```

```bash
# Ambiguous intent — strip wins, warning issued
i18nprune sync --metadata --strip-metadata --target ja
```

## Consequences

### Positive

- One cache fingerprint detects layout refactors before silent wrong-locale reads.
- Structured leaves support review workflows without forking file formats per command.

### Negative

- `locale_directory` requires explicit `structure`; misconfiguration fails early but needs clear docs.
- Mixed metadata flags confuse operators unless the warning code is monitored.

### Mitigation

- [Locales config](../../config/locales.md)
- [Solved: sync metadata flag conflict](../../edge-cases/solved/sync-metadata-flag-conflict.md)
- [Solved: locale layout mismatch rebuild](../../edge-cases/solved/locale-layout-mismatch-rebuild.md)

## Alternatives Considered

### Infer layout from disk only (no config fingerprint)

- **Pros:** Less config.
- **Cons:** Ambiguous when multiple patterns coexist; unsafe cache reuse.

### Separate file formats per command

- **Pros:** Simpler per-command writers.
- **Cons:** `sync` vs `generate` drift; rejected in favor of shared leaf normalization.

## References

- [Locales config](../../config/locales.md)
- [sync command](../../commands/sync.md)
- [generate command](../../commands/generate.md)
- [sync issues — metadata_flag_conflict](../../issues/sync.md#metadata_flag_conflict)
- Git: `43482ae` locales.source enforcement; cache layout fingerprint in `files.json`

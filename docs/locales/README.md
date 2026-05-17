# Locales

## Filesystem layouts

How locale JSON is arranged on disk (`flat_file`, `locale_directory`, `locale_per_dir`, `feature_bundle`) is documented in **[Locale filesystem layouts](./layouts.md)**. When **`mode`** is **`locale_directory`**, **`structure`** is required.

## Data model (leaf modes)

The locale writer commands (`sync`, **`generate`**, **`generate --resume`**) can write leaves in two modes:

- `legacy_string` (default): plain string terminals.
- `structured`: object terminals with metadata (`{ value, status, confidence, needsReview, source }`).

See full policy and API details in [Locales metadata mode](./metadata/README.md).

## Why this exists

Teams use locale JSON differently:

- Some want plain strings only and no extra fields in repos.
- Some want rich metadata for review pipelines, QA triage, or programmatic automation.

The shared core locale-leaf writer supports both modes with deterministic normalization and rich JSON reporting.

# Phase: full i18n for `apps/web` and `apps/report`

**Status:** planned — run **after** substantive `apps/web` and `apps/report` feature work stabilizes so locale files are not churning while UI still changes.

## Goal

- Ship a **real i18n pipeline** (extract, validate in CI, fill/sync as needed) for the marketing site and the HTML report bundle.
- Maintain a **small default language list** (e.g. `en` first, then a defined set of secondary locales) documented in-repo.
- Align with the same **`i18nprune`** workflows the CLI documents — dogfood without blocking unrelated app work.

## Sequencing

1. Finish pending UI/UX and content updates for `apps/web` and `apps/report`.
2. Freeze copy enough to run **string inventory** and add **`locales/`** (or chosen structure) + CI **`validate`**.
3. Add runtime i18n (library choice TBD: e.g. react-i18next, paraglide, or minimal context) with **lazy-loaded** secondary locales if bundle size matters.
4. Expand the default supported-language list deliberately (document in README + site footer or settings).

## Out of scope for this note

- Exact library choice and file layout — decide in implementation PR.
- Translating the main `docs/` tree — optional follow-up.

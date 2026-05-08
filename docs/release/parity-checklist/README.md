# Parity release checklist

Use this checklist before shipping a release to keep CLI, JSON, docs, and web surfaces in sync.

## Contract checks

- [ ] CLI human output still matches command docs for changed commands.
- [ ] Global `--json` envelope fields remain stable (`ok`, `kind`, `data`, `issues`, `meta`).
- [ ] New `issues[]` codes are added in constants and documented in `docs/issues/README.md`.
- [ ] Programmatic `i18nprune/core` usage examples still compile conceptually (imports + names).

## Documentation checks

- [ ] `docs/examples/commands/*` updated for changed command behavior.
- [ ] `docs/exports/examples/*` updated for changed export/API behavior.
- [ ] `docs/onboarding/README.md` still reflects the fastest safe path.
- [ ] Edge-case updates are recorded in `docs/edge-cases/solved/*` or `docs/edge-cases/unsolved/*`.

## Apps/web checks

- [ ] `/commands` links to command docs and full examples for changed commands.
- [ ] `/api` deep links still point to valid docs pages.
- [ ] Footer links remain valid (`/changelog`, docs, examples, benchmark).
- [ ] Hero / CTA flows still match onboarding expectations.

## Release-note checks

- [ ] Add/update changelog entry for user-facing behavior changes.
- [ ] Group notes by `added`, `changed`, `fixed`, `docs`, `deprecations`, `breaking` where relevant.
- [ ] Link release notes to key docs pages.

## Exit criteria

Ship only when every relevant box above is checked or explicitly waived with a reason in the release PR.

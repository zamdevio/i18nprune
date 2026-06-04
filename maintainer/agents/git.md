# Git history hygiene (for humans & coding agents)

**Small, coherent commits** — one concern each, reviewable history, bisect-friendly. Agents follow this on every change.

## Principles

1. **One concern per commit** — One vertical slice (command + doc) or one horizontal layer (logger only), not unrelated refactors mixed in.
2. **Code + docs together** — CLI command changes include **`docs/commands/<slug>.md`** (and **`docs/commands/README.md`** index row if new) in the same commit.
3. **Tests with the feature** — Unit tests ship with the module; broad integration tests can be a dedicated **`test:`** commit when they span several commands.
4. **Messages** — [Conventional Commits](https://www.conventionalcommits.org/): `feat(validate): …`, `fix(sync): …`, `docs(generate): …`, `chore: …`, `test: …`, `refactor(core): …`.
5. **No drive-by churn** — No reformat or rename outside the stated scope.

### Subject line

```text
<type>(<scope>): <short imperative description>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

**Scopes (examples):** `cli`, `core`, `validate`, `generate`, `releases`, `docs`.

Optional parenthetical slice tag for large refactors only, e.g. `(cli.exit.ci-gate)`.

**Good:** `fix(cli): set non-zero exit when validate fails in human mode`

**Avoid:** `update`, `fix stuff`, past tense, two unrelated concerns in one subject.

**Body:** Optional when rollback or risk needs explanation; most commits are subject-only.

## What to bundle

| Change type | Include in the same commit |
|-------------|----------------------------|
| New / updated command | `packages/cli/src/commands/...`, related `packages/cli/src/types/command/...`, `packages/cli/bin/cli.ts` registration, `docs/commands/...` |
| Global CLI flag | `packages/cli/bin/cli.ts`, CLI context/runtime wiring, `docs/cli/*` as needed |
| Config field | `packages/core` config schema + types, `docs/config/*` |
| Report / output contract | report builders/consumers, `docs/commands/report.md` |
| Release portal | `apps/releases/content/...`, `pnpm releases:validate` / `generate:catalog` if catalog-driven |

## `packages/cli/bin/cli.ts`

Register each command in the **same commit** as its implementation so `main` always runs. Incremental commits may touch `cli.ts` repeatedly — that is fine.

## Checklist before pushing

- [ ] `pnpm typecheck` · `pnpm test`
- [ ] `pnpm run build` when the change affects build outputs
- [ ] CLI commands: human and `--json` paths use the same exit gate (`applyCliCiExitGate` / envelope `ok`)
- [ ] Docs: commit **`docs/`** only — **`apps/docs/content/`** is gitignored (sync on `pnpm docs:build` / `docs:dev`)

---

## Version numbers (monorepo)

Keep these **aligned** on each release unless you intentionally split cadence:

| Location | `name` | Published to npm? |
|----------|--------|-------------------|
| Root `package.json` | `i18nprune` | **Yes** — CLI + `i18nprune/core` subpaths |
| `packages/core/package.json` | `@i18nprune/core` | **Yes** — scoped SDK |
| `packages/cli/package.json` | `@i18nprune/cli` | **No** — `private: true`; version tracks the line for humans |

**Bump rule:** One commit sets the **same semver** in all three before tagging (e.g. `0.1.0` → `0.1.1`). Only root and `@i18nprune/core` are published; workspace apps stay on `workspace:*`.

**Pre-releases:** e.g. `0.2.0-beta.1` in all three; git tag `v0.2.0-beta.1` matches the version string.

---

## Git tags & npm publish

Tags mark **released semver** on `main`. They are not a substitute for npm publish.

### Tags

Annotated tags with **`v` prefix** matching root `package.json` `version`:

```bash
git tag -a v0.1.0 -m "i18nprune 0.1.0 — CLI + SDK"
git push origin main
git push origin v0.1.0
```

```bash
git tag -l 'v*'
git show v0.1.0
```

Tag the commit that has the **version bump**, passing gates, and (if you maintain them) release notes on [releases.i18nprune.dev](https://releases.i18nprune.dev).

### npm publish

| Order | Where | Command | Package |
|-------|--------|---------|---------|
| 1 | Repo root | `pnpm run publish:verify` then `npm publish` | `i18nprune` |
| 2 | `packages/core` | `npm publish` (`publishConfig.access: public`) | `@i18nprune/core` |

The CLI tarball already bundles `i18nprune/core`. Publish **`@i18nprune/core`** for SDK-only installs (`import … from '@i18nprune/core'`). One git tag can cover both when versions match.

**Scoped E402:** `@scope/pkg` defaults to **restricted** on npm. Use **`publishConfig.access: "public"`** in `packages/core/package.json` or **`npm publish --access public`**, or free accounts get `E402 Payment Required`.

**prepack:** root runs `cli:build`; `packages/core` runs tsup → `dist/`. Run **`publish:verify`** before first publish of a version; prepack is not a full test suite.

**dist-tags:** stable → `latest`; betas → `npm publish --tag beta`.

**GitHub release notes:** `pnpm releases:notes -- --stream cli --version X.Y.Z` (and `core`).

### Recovering from mistakes

| Mistake | Action |
|---------|--------|
| Tag on wrong commit (not pushed) | `git tag -d vX.Y.Z` and re-tag |
| Tag pushed, npm not published | `git push origin :refs/tags/vX.Y.Z`, fix, re-tag |
| npm published, tag wrong | Do not unpublish; tag correct commit on next **patch** bump |

Never **`git push --force`** to `main` to fix a release; ship **`0.1.1`** instead.

### Release checklist

- [ ] `version` aligned: root, `@i18nprune/core`, `@i18nprune/cli`
- [ ] `pnpm typecheck` · `pnpm test` · `pnpm run publish:verify`
- [ ] `npm whoami` / access for `i18nprune` and `@i18nprune`
- [ ] `npm publish` (root); `npm publish` in `packages/core` if shipping SDK
- [ ] Annotated tag `vX.Y.Z` · `git push origin main` · `git push origin vX.Y.Z`

---

*See also: [Analysis](./analysis.md), [Contributors README](./README.md), [active phase](../phases/active-phase.md).*

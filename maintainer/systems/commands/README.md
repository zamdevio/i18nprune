# Commands — index

**Parent hub:** [`../README.md`](../README.md)

One **`.md` per CLI operation** we want maintainers/agents to navigate quickly. Each file answers: **where is `runXxx`?**, **what core modules does it call?**, **what is frozen for `--json`?**

## Command sheets

| Command | Doc | Notes |
|---------|-----|--------|
| **sync** | [`sync.md`](sync.md) | Merge/prune + optional metadata pass |
| **validate** | [`validate.md`](validate.md) | |
| **doctor** | [`doctor.md`](doctor.md) | Minimal **`run.*`** profile |
| **missing** | [`missing.md`](missing.md) | |
| **cleanup** | [`cleanup.md`](cleanup.md) | |
| **quality** | [`quality.md`](quality.md) | |
| **review** | [`review.md`](review.md) | |
| **languages** | [`languages.md`](languages.md) | |
| **config** | [`config.md`](config.md) | |
| **providers** | [`providers.md`](providers.md) | |
| **generate** | [`generate.md`](generate.md) | Async, translate + metadata normalize (**`--resume`** for top-up) |
| **report** | [`report.md`](report.md) | Async; separate envelope builder |

## Scaffold

From repo root:

```bash
cp maintainer/systems/TEMPLATE.md maintainer/systems/commands/<op>.md
```

Edit placeholders, then add a row to the table above.

## Discipline

Adding or moving **`runXxx`**, changing **JSON payload**, or changing **core entrypoints** → update **this folder** in the **same PR** (see hub [**`../README.md`**](README.md)).

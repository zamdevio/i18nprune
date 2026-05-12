# CLI `--json` parity across subcommands

## Problem

Global **`--json`** is parsed on the root CLI, but **machine-readable stdout** only applies when **both** are true:

1. The user passed **`--json`**, and  
2. The **subcommand** is listed in **`COMMANDS_WITH_JSON_OUTPUT`** (`packages/cli/src/constants/jsonoutput.ts`).

If a command was **missing** from that set, **`ctx.run.json`** stayed **`false`** even though argv recorded the flag for config/bootstrap. Outcomes:

- **Human UI still ran** (banner, **`logger`**, **`printCommandSummary`**) — including a second **`kind: "summary"`** JSON line when summary printing assumed JSON mode, which **breaks `jq`** expecting a single document.
- **Integrators** saw stderr and prose instead of one **`CliJsonEnvelope`** with **`ok`**, **`data`**, **`issues[]`**, **`meta`**.

**Historical note:** the removed **`fill`** command once shared the translation pipeline with **`generate`** but was not initially in **`COMMANDS_WITH_JSON_OUTPUT`**, so **`fill --json`** did not match **`generate --json`** until parity work landed. **`fill`** is gone; **`generate --resume`** uses the same **`generate`** JSON path.

## What we do

1. **Source of truth:** `COMMANDS_WITH_JSON_OUTPUT` — keep it aligned with commands that implement a primary stdout envelope (see [JSON output](../../json/README.md)).
2. **Thin command `run.ts`:** For JSON mode, print **only** **`stringifyEnvelope(...)`** (and set **`process.exitCode`** when **`!ok`**). Do **not** call **`printCommandSummary`** on the JSON path (that helper emits an extra **`kind: summary`** line when **`run.json`** is true). **`cleanup --json`** is an exception only in naming: it **merges** footer timing into **`data.summary`** on the same **`kind: cleanup`** envelope — still one stdout JSON document.
3. **Core helpers:** Prefer **`run<Command>`** in `packages/cli/src/commands/**` / shared builders that return **`CliJsonEnvelope`** and use **`buildIoReadFailureEnvelope`** (and command-specific builders) so **I/O failures** still produce **one JSON object** on stdout (no logger-only errors for **`--json`**).
4. **Issues:** Use stable **`issues[]`** codes ([issue codes](../../issues/README.md)); **`enrichIssuesWithDocHrefs`** attaches **`docHref`** for **`i18nprune.*`** codes.

## Related files (non-exhaustive)

| Area | Path |
|------|------|
| Commands that emit JSON | `packages/cli/src/constants/jsonoutput.ts` |
| Root argv / `run.json` | `packages/cli/bin/cli.ts` (`preAction`, `COMMANDS_WITH_JSON_OUTPUT.has(cmdName)`) |
| Envelope + `docHref` | `packages/cli/src/core/result/cliJson.ts`, `issueDocLinks.ts`, `ioEnvelope.ts` |
| Per-command JSON path | `packages/cli/src/commands/*/run.ts` (e.g. `generate`, `sync`, `config`, `doctor`) |
| Programmatic `run*` | `packages/cli/src/exports/namespaces/programmatic.ts`, `packages/cli/src/core/**/run*.ts` |

## See also

- [JSON output (`--json`)](../../json/README.md) — contract and command list  
- [Issue codes](../../issues/README.md) — stable **`issues[]`** registry  
- [Command behaviors](../../behavior/commands.md) — snapshot table  
- [Prompts & CLI boundaries](../../prompts/README.md) — why **`--json`** skips interactive prompts  

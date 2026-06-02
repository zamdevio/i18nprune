# Performance and large-repo checks

Use this page as the single performance reference for CLI runs at scale.

## What to measure

- **Scan scope:** how many files are eligible under `src` and `exclude` policy.
- **Cold vs warm runs:** compare with and without cache reuse (`--no-cache`).
- **Wall time and memory:** use GNU `/usr/bin/time` for stable measurements.

## Practical measurement commands

```bash
/usr/bin/time -f '%E wall · %U usr · %S sys · %M KB max RSS' \
  i18nprune validate --no-cache -c "$CONFIG"

/usr/bin/time -f '%E wall · %U usr · %S sys · %M KB max RSS' \
  i18nprune report --format json --out reports/i18nprune-report.json -c "$CONFIG"
```

Notes:

- Prefer `/usr/bin/time` over shell built-ins (especially on Fish).
- Redirect stdout consistently during benchmarks if you need strict comparability.
- Always label benchmark results as cold (`--no-cache`) or warm (default).

## Tuning levers

- Narrow `src` to product code.
- Use config `exclude` plus optional CLI `--exclude` for one-off runs.
- Re-run baseline timings after changing scan scope or cache policy.

## Related docs

- [CLI cache](./cli/cache.md)
- [Exclude configuration](./config/exclude.md)
- [Report command](./commands/report.md)
- [JSON output (`--json`)](./cli/json.md)

---
description: Reports parity-style locale quality metrics such as source-identical leaves.
---

# `quality`

Reports parity-style locale quality metrics such as source-identical leaves.

```bash
i18nprune quality
i18nprune quality --target ja
```

## Example

```bash
i18nprune --json quality | jq '.data'
```

`quality --json` provides `QualityJsonData` in `data` (`total`, `perFile`, `dynamicKeySites`, locale rows under `files[]`).

```bash
# Rank locales by source-identical count
i18nprune quality --json \
  | jq '.data.files | map(select(.isSourceLocale == false)) | sort_by(-.sourceIdenticalLeafCount)'
```

For more filters, see the [jq cookbook](../examples/jq-cookbook.md).

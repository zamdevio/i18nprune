# Per-file const maps for template / static keys

## Problem

Translation calls often use **template strings** with placeholders, e.g. `` t(`foo.&#36;{NS}.bar`) ``. To decide whether a key is **fully static**, the tool substitutes placeholders from a **const map** (identifiers → string values).

If the project is scanned as **one merged blob** with a **single** map built from all files merged together, **two different files** could each define `const NS = 'a'` and `const NS = 'b'`. A merged map can only keep **one** value for `NS`, so **rebuilds and “resolved” keys can be wrong**: false positives, wrong prefixes, or keys attributed to the wrong file.

## What we do

**Production paths walk each source file separately:**

1. **`scanProjectKeyObservations`** (`packages/cli/src/core/extractor/keySites/orchestrate.ts`)  
   For each file: read contents → **`buildConstStringMap(content)`** for **that file only** → **`scanKeyObservations(..., constMap)`** → attach **`filePath`** to spans.

2. **`scanProjectLiteralKeyUsage`** (`packages/cli/src/core/extractor/keySites/projectUsage.ts`)  
   Delegates to **`literalKeyUsageFromObservations(scanProjectKeyObservations(ctx))`**, so usage sets and uncertain prefixes use the same per-file resolution.

3. **`scanProjectDynamicKeySites`** (`packages/cli/src/core/extractor/dynamic/orchestrate.ts`)  
   For each file: **`findDynamicKeySitesForFile`** → inside the JS provider, **`buildConstStringMap(text)`** again **per file** (`findDynamicKeySitesInJavascriptFile`).

**`validate`**, **`cleanup`** (via **`buildKeyReferenceContext`** → **`scanProjectLiteralKeyUsage`** + dynamic scan), **`sync`**, **`fill`**, and related commands all rely on these orchestrators, not a single global const map across the tree.

## When merged text is still used

**`analyzeDynamicKeysFromSourceText`** (merged string) exists for **callers that already have concatenated source** (e.g. tests). It does **not** apply per-file const maps or cross-file comment suppression. Prefer **`scanProjectDynamicKeySites(ctx)`** for real projects.

## See also

- [ADR 005: Dynamic key rebuild & prefix](../architecture/decisions/005-dynamic-key-rebuild-and-prefix.md)  
- [JSON output spec](../json) (merged-text caveat)  
- [Key sites & dynamic](../regex/key-sites-and-dynamic.md)

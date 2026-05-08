# Context — issue codes (`i18nprune.context.*`)

[← Issue codes index](.)

## `discovery_warning`

**Severity:** `warning`  
**When:** Path **discovery** adjusted missing **`source`**, **`localesDir`**, or **`src`** (or similar) using heuristics. The **`message`** is human-readable text from the resolver.  
**Who:** Any command that calls **`resolveContext`**, and **`tryResolveContext`** (success branch — warnings are mirrored into **`issues[]`**).  
**What to do:** Confirm the discovered paths are correct; add explicit paths in **`i18nprune.config`** or CLI overrides if discovery picked the wrong directory. See [Config](../config) and [CLI runtime](../cli/runtime).

---

## `resolution_failed`

**Severity:** `error`  
**When:** **`resolveContext`** threw (invalid config, Zod validation, unsupported setup).  
**Who:** **`tryResolveContext`** failure branch; programmatic callers that avoid throwing.  
**What to do:** Fix the underlying error message (often config validation). Run **`i18nprune doctor`** or **`i18nprune config --json`** after fixing **`i18nprune.config.*`**.

# Path & filesystem (`i18nprune.paths.*`)

These codes come from **`collectPlatformPathWarnings`** during **`runProjectReadiness`**. They flag Windows and network-path risks on resolved **source locale**, **locales directory**, and **src** roots. Commands still run unless another readiness check fails.

**Related:** [CLI disk cache](../cli/cache.md#platform-path-warnings-readiness) · [Project workspace preflight](./project.md)

---

## `windows_reserved_name`

**Code:** `i18nprune.paths.windows_reserved_name`  
**Severity:** `warning`  
**When:** A path segment under the project uses a **Windows reserved device name** (`CON`, `NUL`, `PRN`, `AUX`, `COM1`–`COM9`, `LPT1`–`LPT9`), case-insensitive.  
**Who:** **`runProjectReadiness`** → **`checkPlatformPaths`**.

**What to do:**

1. Rename the folder or file segment (for example avoid a locale directory literally named `con`).
2. Prefer a **locales layout** that keeps segment names portable across Windows, macOS, and Linux.
3. Re-run **`i18nprune validate`** or **`doctor`** to confirm the warning cleared.

---

## `windows_long_path`

**Code:** `i18nprune.paths.windows_long_path`  
**Severity:** `warning`  
**When:** An absolute path is **≥ ~240 characters** and is likely to hit legacy Win32 `MAX_PATH` limits without an extended-length `\\?\` prefix.  
**Who:** **`runProjectReadiness`** on Windows-class paths.

**What to do:**

1. Shorten the **project root** or move the repo closer to the drive root.
2. On Windows 10+, enable **long paths** in OS policy if your toolchain supports them.
3. i18nprune does **not** auto-prefix `\\?\` — fix layout or OS settings instead.

---

## `network_drive`

**Code:** `i18nprune.paths.network_drive`  
**Severity:** `info`  
**When:** A resolved path is a **UNC** network share (`\\server\share\...`). Mapped drive letters (`Z:`) are **not** detected.  
**Who:** **`runProjectReadiness`**.

**What to do:**

1. Prefer a **local disk** checkout for cache-heavy commands (`generate`, repeated `validate`).
2. Expect slower locale and cache IO on shares; treat this as an operator risk, not a hard failure.

---

## Related

- [Project](./project.md) — missing directories and unreadable source locale (`i18nprune.project.*`).
- [Doctor](./doctor.md) — environment summary including resolved paths.

# pnpm workspace policy

Root [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) does two jobs:

| Block | Role |
|-------|------|
| **`packages:`** | Workspace membership (`packages/*`, `apps/*`, workers, extension webview) |
| **`allowBuilds:`** | Which native/postinstall packages may run build scripts (`esbuild`, `sharp`, `workerd`) |
| **`overrides:`** | Force shared versions / CVE floors (`@types/react`, `axios`, `postcss`, …) |

Membership is structural. **`allowBuilds`** / **`overrides`** are **policy** — change them deliberately (security + install surface), not as casual dep churn.

When adding a package that needs a native build, extend **`allowBuilds`** explicitly. Prefer overrides for lockstep types or known vulnerability floors over drifting transitive majors.

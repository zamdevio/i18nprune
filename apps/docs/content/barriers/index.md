# Adoption barriers

- **Learning curve** — Source locale, locales directory, and **`functions`** list must be understood for **`validate`** / **`sync`**.
- **Dynamic keys** — Non-literal translation keys cannot be proven static; see [dynamic-keys](./dynamic-keys.md).
- **Credentials** — Google Translate usage needs API keys and billing awareness.
- **CI** — Use **`--json`** and non-interactive flags when TTY prompts are unavailable.

Clear **`config --json`**, the [docs site](..), and **`doctor`** reduce onboarding friction.

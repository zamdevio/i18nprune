# `providers`

Lists **translation backends** available for **`generate`** and **`fill`**: provider **`id`**, **`kind`**, human **`label`**, documented **`envVars`**, optional **`configKeys`**, and a minimal **`translate.{ primary, providers }`** snippet per id.

Does **not** call remote translation APIs — data comes from **`buildTranslationProvidersPayload()`** in **`@i18nprune/core`**.

```bash
i18nprune providers
i18nprune providers --json
```

**`--json`** returns a **`CliJsonEnvelope`** with **`kind: "providers"`** and **`data`**: **`providers`**, **`mergePrecedence`**, **`configSnippets`**. Does not require a config file (uses the same context bootstrap as **`languages`**).

See also [Translation config](../../config/translate.md), [Environment variables](../../config/env.md), [generate](./generate/README.md), [fill](./fill/README.md).

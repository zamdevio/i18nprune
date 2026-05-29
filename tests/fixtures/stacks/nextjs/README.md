# nextjs

Next.js App Router-shaped stack smoke: `app/**/*.tsx`, `feature_bundle` with **five feature segments**:

| Segment | Keys (examples) | Used in |
| --- | --- | --- |
| `messages/app/en.json` | `app.title`, `app.description` | `app/page.tsx` |
| `messages/common/en.json` | `layout.skip`, `page.cta` | `app/layout.tsx`, `app/page.tsx` |
| `messages/auth/en.json` | `auth.sign_in_prompt`, `auth.login` | `app/components/AuthBanner.tsx` |
| `messages/marketing/en.json` | `marketing.headline`, `marketing.offer` | `app/components/MarketingStrip.tsx` |
| `messages/settings/en.json` | `settings.open` | `app/components/SettingsLink.tsx` |

```bash
cd tests/fixtures/stacks/nextjs
node ../../../../dist/cli.js validate --json
node ../../../../dist/cli.js generate --target ar --dry-run
```

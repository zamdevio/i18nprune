# How i18nprune Was Born

I’m nineteen. I’m in semester four. I work **solo**. This repo is not a “startup idea I brainstormed on a whiteboard.” It started as **rage** and **necessity** — the kind that makes you stop patching and start building a real tool.

---

## The blocker had a name: CepatEdge

I was building **CepatEdge**, a full **maintenance management** platform — web app, Workers API, Postgres, roles, audits, the whole shape of a serious system. (The parallel “how that app happened” story lives in that repo: [`docs/journey/README.md`](https://github.com/zamdevio/cepatedge/blob/main/docs/journey/README.md).) The stack is documented there: **Hono**, **Neon**, **Drizzle**, **Durable Objects**, **Cloudflare Pages** for the **Vite + React SPA**, and a long list of domain pages and flows that all need consistent UI copy.

CepatEdge uses **i18next** with **`en.json` as the source of truth**, lazy-loaded locales, navigation wired through **`labelKey`s**, and error text routed through **codes** instead of trusting raw API strings. That’s the right architecture — and it still hurts when you’re operating at scale.

The pain wasn’t “translation is hard.” The pain was **trust**:

- keys that don’t line up with what the code actually calls  
- locale files drifting out of shape  
- dynamic translation call sites you can’t fully prove in review  
- workflows that repeat manual cleanup  
- CI that still doesn’t answer the question: **are we safe to ship?**

At some point I admitted the truth: if I kept duct-taping this, **everything else** in CepatEdge would slow down.

---

## The day I stopped pretending

On **March 24, 2026**, I formalized the frontend i18n direction over there (the ADR matches that date for a reason). That wasn’t magic — it was me drawing a line: **this has to be handled like production infrastructure**, not like a side hobby.

Emotionally, though, it was simpler than an ADR sounds. I was **actually pissed off**. Not performatively. Not for content. I was tired of feeling like my own localization surface was an unreliable teammate.

So I made a decision I didn’t romanticize at the time: **stop patching**. Build something that could **validate**, **sync**, **generate**, **`generate --resume`**, **review**, and land in **CI** with structured reports — something that could live **outside** the app, be **tested**, and be reused.

---

## What got built (and how fast)

**i18nprune** is that toolkit: a CLI and programmatic APIs (`i18nprune/core`, `i18nprune/core`) meant for real repos, not demos.

The repo history tells the blunt version: the monorepo and CLI came together in a **compressed sprint** in **spring 2026** — the kind of stretch where you’re wiring commands, JSON output, docs, and tests while your brain is still annoyed at the problem that started it.

The repo history tells the rest.

---

## Why open source

I didn’t open source this to sound noble. I open sourced it because **I suffered** through a problem that is stupidly common, and the ecosystem still makes it easy to feel alone in it.

If i18nprune saves someone else from the “five languages, over a thousand keys, hundreds of files, zero confidence” spiral, then it did its job.

CepatEdge itself is on a path to be shared more openly too — the point isn’t hype. The point is **inspectability**: people should be able to see how this stuff is built, challenge it, and run it without begging a vendor.

---

## Closing on a calmer note

I’m not trying to be a motivational account. I’m a dev who hit a wall, got angry in a productive way, and turned that into a tool.

If you’re here because your translations are messy: you’re not failing — **i18n is often ignored until it becomes a bottleneck**.  
If you’re here to use the CLI: **welcome**.  
If you’re here to judge the code: **fair** — just remember it was built by one person trying to keep a much bigger system moving.

Thanks for reading.

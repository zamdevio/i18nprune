# ⚡ EXTRACTOR FLEX PROMPT (THE REAL WEAPON)

This one is CRAZY important.

This is where we **differentiate from AST tools** 😏

---

## 🧠 Agent Prompt — “Extractor System Positioning”

```

We need to deeply analyze and then position the extraction system used in this project (packages/cli/src/core/extractor).

Your task is NOT to rewrite code.
Your task is to UNDERSTAND and POSITION it.

---

## Context

This project does NOT use:

* TypeScript AST
* Babel
* heavy compiler pipelines

Instead it uses:

* regex + controlled parsing
* manual call scanning
* balanced parentheses matching
* string/template/comment skipping
* per-file const maps
* dynamic key heuristics

This is intentional.

---

## What to do

### 1. Analyze the extractor system

Look at:

* core/extractor/calls.ts
* pattern.ts
* keySites/*
* dynamic/*
* constmap usage
* docs/regex/*
* docs/dynamic/*

Understand:

* how call sites are detected
* how arguments are parsed safely
* how templates are resolved
* how dynamic keys are classified
* how comments are excluded
* how per-file const maps work

---

### 2. Produce a positioning summary

We need a clean explanation for developers:

Explain:

* what this system IS
* why it exists
* what tradeoffs it makes

---

### 3. Compare vs AST-based tools

Explain clearly:

AST tools:

* heavy
* slow
* require full parsing
* tightly coupled to language

This system:

* fast
* zero compiler dependency
* works on raw text
* portable across environments

BUT:

* not 100% perfect (be honest)

---

### 4. Extract key strengths (IMPORTANT)

Highlight real strengths:

* balanced scanning avoids naive regex bugs
* skips strings/comments/templates correctly
* per-file const substitution (huge win)
* rebuilds template keys into static keys
* dynamic detection is explicit (not guessed)
* consistent across CLI commands

---

### 5. Generate a “marketing-ready but honest” section

We will use this in:

* /examples page (short version)
* /story page (expanded)
* docs/regex/README improvements (optional)

Tone:

* technical
* confident
* not hype
* dev-to-dev

---

## Constraints

* DO NOT oversell
* DO NOT claim perfect accuracy
* DO NOT say “better than AST in all cases”

Instead say:

→ “designed for speed, portability, and high-signal results”

---

## Output format

Return:

1. Short positioning paragraph (for site)
2. Bullet list of strengths
3. Honest limitations
4. 1–2 punchy lines we can reuse as slogans

---

## Important

This system is a core differentiator.

Treat it as a FIRST-CLASS feature, not an implementation detail.


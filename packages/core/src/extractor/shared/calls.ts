import { buildFunctionsPattern, escapeRegex } from './pattern.js';
import type { TranslationCallSite } from '../../types/extractor/calls/index.js';

/** Scans for configured helper names followed by `(`, parses the first argument span, and drops obvious prose false positives (ASCII lowercase words only, whitespace-separated). */
export function findTranslationCallSites(text: string, functions: string[]): TranslationCallSite[] {
  const out: TranslationCallSite[] = [];
  if (functions.length === 0) return out;
  const fn = buildFunctionsPattern(functions);
  const callStart = new RegExp(`\\b(${fn})\\s*\\(`, 'g');

  let m: RegExpExecArray | null;
  while ((m = callStart.exec(text)) !== null) {
    const functionName = m[1]!;
    const matchIndex = m.index!;
    const fnEsc = escapeRegex(functionName);
    const decl = new RegExp(`\\b(?:export\\s+)?function\\s+${fnEsc}\\s*\\(`);
    if (decl.test(text.slice(Math.max(0, matchIndex - 64), matchIndex + functionName.length + 2))) {
      continue;
    }
    const openParenIndex = matchIndex + m[0].length - 1;
    const closeParenIndex = findMatchingCloseParen(text, openParenIndex);
    if (closeParenIndex === -1) continue;
    const first = parseFirstArgument(text, openParenIndex, closeParenIndex);
    if (!first.empty && firstArgLooksLikeAsciiLowercaseProse(first.raw)) {
      continue;
    }
    out.push({
      functionName,
      matchIndex,
      openParenIndex,
      closeParenIndex,
      firstArgStart: first.start,
      firstArgEnd: first.end,
      firstArgRaw: first.raw,
      isEmptyCall: first.empty,
      isMultilineCall: text.slice(matchIndex, closeParenIndex + 1).includes('\n'),
    });
  }
  return out;
}

/**
 * Rejects first arguments that look like English prose: two or more ASCII-lowercase
 * "words" with only whitespace between them (e.g. `or vice versa`), which are not plausible
 * translation keys or JS expressions. Single-token arguments are never classified as prose here.
 */
function firstArgLooksLikeAsciiLowercaseProse(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return false;
  if (!/\s/.test(trimmed)) return false;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  for (const p of parts) {
    if (!/^[a-z]+$/.test(p)) return false;
  }
  return true;
}

function findMatchingCloseParen(text: string, openParenIndex: number): number {
  let i = openParenIndex + 1;
  let depth = 1;
  while (i < text.length) {
    const c = text[i]!;
    if (c === "'" || c === '"') {
      i = skipString(text, i, c);
      continue;
    }
    if (c === '`') {
      i = skipTemplate(text, i);
      continue;
    }
    if (c === '/' && text[i + 1] === '/') {
      i = skipLineComment(text, i);
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      i = skipBlockComment(text, i);
      continue;
    }
    if (c === '(') depth += 1;
    else if (c === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return -1;
}

function parseFirstArgument(
  text: string,
  openParenIndex: number,
  closeParenIndex: number,
): { start: number; end: number; raw: string; empty: boolean } {
  let i = skipTrivia(text, openParenIndex + 1, closeParenIndex);
  if (i >= closeParenIndex) return { start: i, end: i, raw: '', empty: true };
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  const start = i;

  while (i < closeParenIndex) {
    const c = text[i]!;
    if (c === "'" || c === '"') {
      i = skipString(text, i, c);
      continue;
    }
    if (c === '`') {
      i = skipTemplate(text, i);
      continue;
    }
    if (c === '/' && text[i + 1] === '/') {
      i = skipLineComment(text, i);
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      i = skipBlockComment(text, i);
      continue;
    }
    if (c === '(') parenDepth += 1;
    else if (c === ')') {
      if (parenDepth > 0) parenDepth -= 1;
    } else if (c === '[') bracketDepth += 1;
    else if (c === ']') {
      if (bracketDepth > 0) bracketDepth -= 1;
    } else if (c === '{') braceDepth += 1;
    else if (c === '}') {
      if (braceDepth > 0) braceDepth -= 1;
    } else if (c === ',' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      break;
    }
    i += 1;
  }

  const end = rtrimIndex(text, start, i);
  return {
    start,
    end,
    raw: text.slice(start, end),
    empty: false,
  };
}

function skipTrivia(text: string, start: number, end: number): number {
  let i = start;
  while (i < end) {
    const c = text[i]!;
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    if (c === '/' && text[i + 1] === '/') {
      i = skipLineComment(text, i);
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      i = skipBlockComment(text, i);
      continue;
    }
    break;
  }
  return i;
}

function rtrimIndex(text: string, start: number, end: number): number {
  let i = end;
  while (i > start && /\s/.test(text[i - 1]!)) i -= 1;
  return i;
}

function skipLineComment(text: string, start: number): number {
  let i = start + 2;
  while (i < text.length && text[i] !== '\n') i += 1;
  return i;
}

function skipBlockComment(text: string, start: number): number {
  let i = start + 2;
  while (i + 1 < text.length) {
    if (text[i] === '*' && text[i + 1] === '/') return i + 2;
    i += 1;
  }
  return text.length;
}

function skipString(text: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) return i + 1;
    i += 1;
  }
  return text.length;
}

function skipTemplate(text: string, start: number): number {
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') return i + 1;
    if (ch === '$' && text[i + 1] === '{') {
      i += 2;
      let depth = 1;
      while (i < text.length && depth > 0) {
        const c2 = text[i]!;
        if (c2 === "'" || c2 === '"') {
          i = skipString(text, i, c2);
          continue;
        }
        if (c2 === '`') {
          i = skipTemplate(text, i);
          continue;
        }
        if (c2 === '/' && text[i + 1] === '/') {
          i = skipLineComment(text, i);
          continue;
        }
        if (c2 === '/' && text[i + 1] === '*') {
          i = skipBlockComment(text, i);
          continue;
        }
        if (c2 === '{') depth += 1;
        else if (c2 === '}') depth -= 1;
        i += 1;
      }
      continue;
    }
    i += 1;
  }
  return text.length;
}


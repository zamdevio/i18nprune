import type { PathSegment } from '../../types/json/path/index.js';
import { deepClone } from './clone.js';

/** Split a path like `a.b[0].c` into segments. */
export function splitPath(pathStr: string): PathSegment[] {
  const parts: PathSegment[] = [];
  const re = /[^.[\]]+|\[\d+\]/g;
  let m: RegExpExecArray | null;
  const s = pathStr.trim();
  while ((m = re.exec(s)) !== null) {
    const tok = m[0]!;
    if (tok.startsWith('[') && tok.endsWith(']')) {
      parts.push(Number.parseInt(tok.slice(1, -1), 10));
    } else {
      parts.push(tok);
    }
  }
  return parts;
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export function getAtPath(root: unknown, pathStr: string): unknown {
  let cur: unknown = root;
  for (const seg of splitPath(pathStr)) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof seg === 'number') {
      if (!Array.isArray(cur)) return undefined;
      cur = cur[seg];
    } else {
      if (!isPlainObject(cur)) return undefined;
      cur = cur[seg];
    }
  }
  return cur;
}

export function setAtPath(root: unknown, pathStr: string, value: unknown): unknown {
  const segs = splitPath(pathStr);
  if (segs.length === 0) return root;
  const clone = deepClone(root);
  let cur: unknown = clone;
  for (let i = 0; i < segs.length - 1; i += 1) {
    const seg = segs[i]!;
    const next = segs[i + 1]!;
    if (typeof seg === 'number') {
      if (!Array.isArray(cur)) return clone;
      ensureArraySlot(cur, seg, typeof next === 'number' ? [] : {});
      cur = cur[seg];
    } else {
      if (!isPlainObject(cur)) return clone;
      if (!(seg in cur)) {
        cur[seg] = typeof next === 'number' ? [] : {};
      }
      cur = cur[seg];
    }
  }
  const last = segs[segs.length - 1]!;
  if (typeof last === 'number') {
    if (!Array.isArray(cur)) return clone;
    ensureArraySlot(cur, last, null);
    (cur as unknown[])[last] = value;
  } else {
    if (!isPlainObject(cur)) return clone;
    cur[last] = value;
  }
  return clone;
}

function ensureArraySlot(arr: unknown[], index: number, fill: unknown): void {
  while (arr.length <= index) {
    arr.push(fill);
  }
}

export function deleteAtPath(root: unknown, pathStr: string): unknown {
  const segs = splitPath(pathStr);
  if (segs.length === 0) return root;
  const clone = deepClone(root);
  let cur: unknown = clone;
  for (let i = 0; i < segs.length - 1; i += 1) {
    const seg = segs[i]!;
    if (typeof seg === 'number') {
      if (!Array.isArray(cur)) return clone;
      cur = cur[seg];
    } else {
      if (!isPlainObject(cur)) return clone;
      cur = cur[seg];
    }
  }
  const last = segs[segs.length - 1]!;
  if (typeof last === 'number') {
    if (Array.isArray(cur)) cur.splice(last, 1);
  } else if (isPlainObject(cur)) {
    delete cur[last];
  }
  return clone;
}

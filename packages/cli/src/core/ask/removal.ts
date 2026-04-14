import { confirm } from '@inquirer/prompts';

/** Group keys by the segment before the first `.` (top-level namespace). Keys without `.` use the whole path as the segment. */
export function groupKeysByTopSegment(keys: string[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const k of keys) {
    const seg = k.includes('.') ? k.slice(0, k.indexOf('.')) : k;
    if (!m.has(seg)) m.set(seg, []);
    m.get(seg)!.push(k);
  }
  for (const arr of m.values()) {
    arr.sort();
  }
  return m;
}

export type PromptRemovalKeysMode = 'group' | 'each';

export type PromptRemovalKeysOptions = {
  /** `group` — one confirm per top-level namespace; `each` — one confirm per key. */
  mode: PromptRemovalKeysMode;
  /** Shown in messages (e.g. absolute or relative locales dir). */
  localesDirDisplay: string;
};

/**
 * Interactive approval for which unused key paths to remove. Caller must ensure `canAsk` and not `--yes`.
 * Returns keys the user accepted (subset of input). Order is sorted for stable UX.
 */
export async function promptApprovedRemovalKeys(
  keys: string[],
  options: PromptRemovalKeysOptions,
): Promise<string[]> {
  if (keys.length === 0) return [];

  const sorted = [...keys].sort();

  if (options.mode === 'each') {
    const approved: string[] = [];
    for (const key of sorted) {
      const ok = await confirm({
        message: `Remove unused key "${key}" from all locale JSON under ${options.localesDirDisplay}?`,
        default: false,
      });
      if (ok) approved.push(key);
    }
    return approved;
  }

  const groups = groupKeysByTopSegment(sorted);
  const segments = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  const approved: string[] = [];

  for (const seg of segments) {
    const ks = groups.get(seg)!;
    const n = ks.length;
    const preview =
      ks.length <= 6 ? ks.join(', ') : `${ks.slice(0, 6).join(', ')} … (+${String(ks.length - 6)} more)`;
    const ok = await confirm({
      message: `Remove ${String(n)} unused path(s) in namespace "${seg}" (${preview}) from all locale JSON under ${options.localesDirDisplay}?`,
      default: false,
    });
    if (ok) approved.push(...ks);
  }

  return approved;
}

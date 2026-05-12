export type PromptRemovalKeysMode = 'group' | 'each';

export type PromptRemovalKeysOptions = {
  /** `group` — one confirm per top-level namespace; `each` — one confirm per key. */
  mode: PromptRemovalKeysMode;
  /** Shown in messages (e.g. absolute source locale path). */
  targetDisplay: string;
};

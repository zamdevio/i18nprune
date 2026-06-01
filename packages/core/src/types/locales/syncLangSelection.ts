/** Normalized target selector for sync-style ops (`parseSyncLangSelection` return shape). */
export type SyncLangSelection = { mode: 'all' } | { mode: 'codes'; codes: string[] };

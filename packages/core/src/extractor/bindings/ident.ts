/**
 * Unicode-aware JS identifier pattern for import binding scans (regex `u` flag).
 *
 * @remarks Matches `$t`, `_x`, and non-ASCII identifier starts per Unicode ID_Start/ID_Continue.
 * Does not model every Annex B edge case.
 */
export const IMPORT_BINDING_IDENT_PATTERN = String.raw`[$_\p{ID_Start}][$_\p{ID_Continue}]*`;

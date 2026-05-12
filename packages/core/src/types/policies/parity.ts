/**
 * Fine-grained exclusions for parity / “still matches source?” checks (**`quality`**, **`generate --resume`**, …).
 */
export type ParityPolicy = {
  /** Dotted keys ignored when comparing target vs source for drift / source-identical hints. */
  excludeKeys?: string[];
  /** Key prefixes ignored for the same checks. */
  excludePrefixes?: string[];
  /** Concrete string values ignored (e.g. placeholder **`TODO`**). */
  excludeValues?: string[];
};

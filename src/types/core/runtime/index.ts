/** Global CLI run flags surfaced on `Context.run`. */
export type RunOptions = {
  json: boolean;
  /** Less non-essential output. */
  quiet: boolean;
  /** Suppress informational and warning lines; still emit errors. */
  silent: boolean;
};

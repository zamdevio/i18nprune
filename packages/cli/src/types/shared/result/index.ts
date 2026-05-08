export type EmitCliJsonOptionErrorInput = {
  /** Command kind for envelope (for example: `report`, `config`). */
  command: string;
  /** Whether this invocation should emit JSON output. */
  json: boolean;
  /** Stable issue code (command-specific when possible). */
  issueCode: string;
  /** Human-readable validation error message. */
  message: string;
  /** Optional docs path for this option issue. */
  docPath?: string;
  /** Optional payload override; defaults to `{ kind: command }`. */
  data?: unknown;
};

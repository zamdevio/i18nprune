import type { TerminalLine } from "./terminal";

export type CodeLang = "bash" | "typescript" | "javascript" | "json" | "yaml" | "markdown";

export type CommandExample = {
  caption: string;
  code: string;
  lang: CodeLang;
  /** One-line hint: stdout, exit code, or file side-effects */
  outcome?: string;
};

export type CommandDocLink = {
  label: string;
  /** Path under docs site, e.g. `cli/verbosity` or `commands/validate` */
  path: string;
};

export type CommandSection = {
  slug: string;
  title: string;
  summary: string;
  detail?: string;
  examples: CommandExample[];
  /**
   * Optional illustrative shell strip after copy-paste examples (shared `Terminal` component; not a substitute for {@link examples}).
   */
  sessionTerminal?: TerminalLine[];
  /** Extra deep links (flags, behavior, related commands) */
  moreLinks?: CommandDocLink[];
};

export type CommandCategory = {
  id: string;
  title: string;
  intro?: string;
  commands: CommandSection[];
};

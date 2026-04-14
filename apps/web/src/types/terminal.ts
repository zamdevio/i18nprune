export type TerminalLine =
  | { kind: "comment"; text: string; className?: string; color?: string }
  | { kind: "prompt"; text: string; className?: string; color?: string }
  | { kind: "out"; text: string; className?: string; color?: string }
  | { kind: "ok"; text: string; className?: string; color?: string }
  | { kind: "json"; text: string; className?: string; color?: string };

export type TerminalProps = {
  /** Shown in the fake window title bar */
  title?: string;
  lines: TerminalLine[];
  className?: string;
};

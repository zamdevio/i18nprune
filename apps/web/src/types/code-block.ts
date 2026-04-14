import type { CodeLang } from "./code-lang";

export type CodeBlockProps = {
  code: string;
  lang?: CodeLang;
  /** Shown above the block — what this snippet demonstrates (not the header bar). */
  caption?: string;
  className?: string;
};

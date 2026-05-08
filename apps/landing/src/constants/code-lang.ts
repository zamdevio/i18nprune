import type { CodeLang } from "../types/code-lang";

/** Display names for code block chrome (not filenames or command names). */
export const CODE_LANG_LABEL: Record<CodeLang, string> = {
  bash: "Bash",
  typescript: "TypeScript",
  javascript: "JavaScript",
  json: "JSON",
  markdown: "Markdown",
  yaml: "YAML",
};

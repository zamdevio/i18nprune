import { getSingletonHighlighter } from "shiki/bundle/web";
import type { Highlighter } from "shiki/bundle/web";
import type { CodeLang } from "../types/code-lang";

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = getSingletonHighlighter({
      themes: ["github-light", "github-dark"],
      langs: ["typescript", "javascript", "json", "bash"],
    });
  }
  return highlighterPromise;
}

export async function highlightCode(
  code: string,
  lang: CodeLang,
  theme: "light" | "dark",
): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code.trimEnd(), {
    lang,
    theme: theme === "dark" ? "github-dark" : "github-light",
  });
}

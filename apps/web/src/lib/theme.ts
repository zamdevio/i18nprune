type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "i18nprune-theme";

export function applyTheme(theme: Theme) {
  const root = window.document.documentElement;
  
  root.classList.remove("light", "dark");

  let effectiveTheme = theme;
  if (theme === "system") {
    effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  root.classList.add(effectiveTheme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
}

// Initialize theme on load
if (typeof window !== "undefined") {
  applyTheme(getStoredTheme());
  
  // Listen for system changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getStoredTheme() === "system") {
      applyTheme("system");
    }
  });
}

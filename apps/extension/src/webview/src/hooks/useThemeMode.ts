import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export function useThemeMode(): {
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  toggleDarkMode: () => void;
} {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('i18nprune-theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('i18nprune-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((v) => !v);

  return { isDarkMode, setIsDarkMode, toggleDarkMode };
}

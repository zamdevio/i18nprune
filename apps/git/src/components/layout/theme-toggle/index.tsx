import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@i18nprune/ui/react/theme';
import styles from './index.module.css';

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ?
        <Sun className={styles.icon} size={18} strokeWidth={2} aria-hidden />
      : <Moon className={styles.icon} size={18} strokeWidth={2} aria-hidden />}
      {!compact ?
        <span className={styles.label}>{isDark ? 'Light' : 'Dark'}</span>
      : null}
    </button>
  );
}

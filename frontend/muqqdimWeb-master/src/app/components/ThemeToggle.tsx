import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--muted)] transition-all duration-300 shadow-sm hover:shadow-md"
      aria-label={theme === 'light' ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-[var(--gray-700)]" />
      ) : (
        <Sun className="w-5 h-5 text-[var(--gray-700)]" />
      )}
    </button>
  );
}
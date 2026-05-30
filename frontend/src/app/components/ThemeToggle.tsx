import { Moon, Sun } from "lucide-react";

import { useTheme } from "../contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-xl bg-transparent border border-[#C6A75E] text-[#C6A75E] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-300"
      aria-label={
        theme === "light" ? "تفعيل الوضع الداكن" : "تفعيل الوضع الفاتح"
      }
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}

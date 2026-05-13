// Lucide icons for the visual indicator
import { Moon, Sun } from "lucide-react";

// Hook that gives us the current theme + the toggleTheme function
import { useTheme } from "../contexts/ThemeContext";

export function ThemeToggle() {
  // Pull the current theme + toggle function from the global ThemeContext
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      // Gold border + gold text by default; deepens to a richer gold on hover.
      // The button is fully transparent so it looks the same on any background.
      className="flex items-center justify-center w-10 h-10 rounded-xl bg-transparent border border-[#C6A75E] text-[#C6A75E] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-300"
      // Accessibility label changes to describe the ACTION the button will perform
      aria-label={
        theme === "light" ? "تفعيل الوضع الداكن" : "تفعيل الوضع الفاتح"
      }
    >
      {/* Show Moon while in light mode (clicking will turn on dark mode) */}
      {/* Show Sun while in dark mode  (clicking will turn on light mode) */}
      {theme === "light" ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}

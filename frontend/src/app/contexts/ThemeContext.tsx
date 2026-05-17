// React APIs we need:
//   - createContext: builds a Context object
//   - useContext:    consumes the Context inside a component
//   - useEffect:     runs side effects (writing to <html> and localStorage)
//   - useState:      stores the current theme value in the Provider
//   - ReactNode:     type for whatever children we wrap
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// Strict union type — only "light" or "dark" are allowed
type Theme = "light" | "dark";

// The shape of the value the Provider exposes to consumers
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// The Context itself — undefined by default so we can detect misuse
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// =====================================================================
// ThemeProvider — wraps the app and supplies the theme value
// =====================================================================
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initial state: read the saved theme from localStorage, default to "light"
  // The function form of useState runs only once on first mount.
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    return savedTheme || "light";
  });

  // Whenever `theme` changes, apply it to the page and persist it.
  useEffect(() => {
    const root = document.documentElement;

    // Add/remove the `dark` class on <html> so Tailwind's dark: variants kick in
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Save the choice so it survives reloads
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Flip "light" ↔ "dark" — uses the functional updater so we always
  // base the new value on the latest state.
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// =====================================================================
// useTheme — convenience hook for consumers
// =====================================================================
// Usage in any component:
//   const { theme, toggleTheme } = useTheme();
//
// Throws a clear error if used outside the Provider, so bugs are caught
// at development time instead of silently doing nothing.
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

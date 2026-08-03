import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type Theme = "bumblebee" | "luxury";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Read from localStorage, fallback to bumblebee
    const stored = localStorage.getItem("theme");
    return stored === "luxury" ? "luxury" : "bumblebee";
  });

  useEffect(() => {
    // Apply the theme attribute to <html> for daisyUI
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "bumblebee" ? "luxury" : "bumblebee"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

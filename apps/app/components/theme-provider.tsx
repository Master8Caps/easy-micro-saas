"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { updateThemePreference } from "@/lib/actions/theme";
import { SITE_VARIANT } from "@/lib/variant";

type Theme = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    SITE_VARIANT === "calm" ? "light" : "dark",
  );
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(
    SITE_VARIANT === "calm" ? "light" : "dark",
  );

  // Initialize from localStorage
  useEffect(() => {
    if (SITE_VARIANT === "calm") {
      document.documentElement.classList.remove("dark");
      setThemeState("light");
      setResolvedTheme("light");
      return;
    }
    const stored = localStorage.getItem("theme") as Theme | null;
    const initial = stored || "dark";
    setThemeState(initial);
    setResolvedTheme(applyTheme(initial));
  }, []);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedTheme(applyTheme("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    if (SITE_VARIANT === "calm") return; // light-locked
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    setResolvedTheme(applyTheme(newTheme));
    updateThemePreference(newTheme).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

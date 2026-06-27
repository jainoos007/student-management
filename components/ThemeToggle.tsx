"use client";

import { useEffect, useState, useLayoutEffect } from "react";
import { Sun, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") || 
                   localStorage.getItem("theme") === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  useLayoutEffect(() => {
    // After React commits the theme change, wait for next tick to restore hover transitions
    const timer = setTimeout(() => {
      document.documentElement.classList.remove("disable-transitions");
    }, 0);
    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () => {
    document.documentElement.classList.add("disable-transitions");
    
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 text-zinc-755 dark:text-zinc-350"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}

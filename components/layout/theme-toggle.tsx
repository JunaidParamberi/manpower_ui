"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function applyThemeDom(next: "light" | "dark") {
  const root = document.documentElement;
  root.setAttribute("data-theme", next);
  root.style.colorScheme = next;
}

export function switchTheme(
  next: "light" | "dark",
  setTheme: (t: string) => void,
) {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // next-themes applies data-theme in a useEffect. View Transitions need the
  // DOM change synchronously inside the callback, or old/new snapshots match
  // and the swap looks like a hard snap.
  if (reduceMotion || !document.startViewTransition) {
    applyThemeDom(next);
    setTheme(next);
    return;
  }

  document.startViewTransition(() => {
    applyThemeDom(next);
    setTheme(next);
  });
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  // Reserves the switch's exact footprint so mounting does not shift the row.
  if (!mounted) return <div className="h-[26px] w-[60px]" />;

  const isDark = resolvedTheme === "dark";

  const btnClass = (active: boolean) =>
    cn(
      "grid h-[22px] w-[26px] cursor-pointer place-items-center rounded-full border-0",
      "transition-[background-color,color,box-shadow] duration-[var(--dur-base)]",
      active
        ? "bg-[var(--bg-surface)] text-foreground shadow-[var(--shadow-xs)]"
        : "bg-transparent text-[var(--fg-3)] shadow-none",
    );

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex items-center gap-px rounded-full bg-[var(--bg-subtle)] p-0.5"
    >
      <button
        type="button"
        onClick={() => switchTheme("light", setTheme)}
        aria-label="Light theme"
        aria-pressed={!isDark}
        className={btnClass(!isDark)}
      >
        <Sun size={13} strokeWidth={1.6} />
      </button>
      <button
        type="button"
        onClick={() => switchTheme("dark", setTheme)}
        aria-label="Dark theme"
        aria-pressed={isDark}
        className={btnClass(isDark)}
      >
        <Moon size={13} strokeWidth={1.6} />
      </button>
    </div>
  );
}

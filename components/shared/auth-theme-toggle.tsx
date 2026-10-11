"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function AuthThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        aria-hidden
        className={className}
        style={{
          display: "inline-flex",
          padding: 2,
          background: "var(--bg-subtle)",
          border: "1px solid var(--border)",
          borderRadius: 999,
          width: 58,
          height: 26,
        }}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        padding: 2,
        background: "var(--bg-subtle)",
        border: "1px solid var(--border)",
        borderRadius: 999,
      }}
    >
      <button
        type="button"
        data-active={!isDark}
        aria-label="Light mode"
        aria-pressed={!isDark}
        onClick={() => setTheme("light")}
        style={toggleBtnStyle(!isDark)}
      >
        <Sun size={13} />
      </button>
      <button
        type="button"
        data-active={isDark}
        aria-label="Dark mode"
        aria-pressed={isDark}
        onClick={() => setTheme("dark")}
        style={toggleBtnStyle(isDark)}
      >
        <Moon size={13} />
      </button>
    </div>
  );
}

function toggleBtnStyle(active: boolean): React.CSSProperties {
  return {
    width: 26,
    height: 22,
    display: "grid",
    placeItems: "center",
    borderRadius: 999,
    color: active ? "var(--fg)" : "var(--fg-3)",
    background: active ? "var(--bg-surface)" : "transparent",
    boxShadow: active ? "var(--shadow-xs)" : "none",
    transition: "background 160ms ease, color 160ms ease",
  };
}

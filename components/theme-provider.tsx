"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type Props = {
  children: ReactNode;
};

export function ThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="light"
      storageKey="manpower-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

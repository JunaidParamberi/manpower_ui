import type { Preview, Decorator } from "@storybook/react-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import {
  createNavigation,
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "@storybook/nextjs-vite/navigation.mock";
import React, { useEffect } from "react";

import { AgentActivityProvider } from "@/lib/ai-panel/agent-activity-context";
import "../styles/globals.css";

function setupNavigationMocks() {
  const navigation = createNavigation({});

  useRouter.mockImplementation(() => navigation);
  usePathname.mockImplementation(() => "/dashboard");
  useSearchParams.mockImplementation(() => new URLSearchParams());
  useParams.mockImplementation(() => ({}));
}

setupNavigationMocks();

// next/font only runs inside Next.js — Storybook loads globals.css directly
// but never sets --font-body / --font-mono, so everything falls back to the
// system font. This decorator loads Inter + JetBrains Mono from Google Fonts
// and wires the same CSS custom properties that next/font would inject.
const FontInjector: Decorator = (Story) => {
  useEffect(() => {
    if (!document.getElementById("sb-google-fonts")) {
      const link = document.createElement("link");
      link.id = "sb-google-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(link);
    }

    document.documentElement.style.setProperty(
      "--font-body",
      "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"
    );
    document.documentElement.style.setProperty(
      "--font-mono",
      "'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, monospace"
    );
  }, []);

  return <Story />;
};

// App layouts respond to the shell scroll region via `@container/shell` named
// container queries (dashboard-shell.tsx). Storybook has no shell, so without
// a matching container those variants never resolve and multi-column layouts
// render permanently single-column. This decorator re-establishes a `shell`
// container so stories preview their real responsive layout.
const ShellContainer: Decorator = (Story) => (
  <div style={{ containerType: "inline-size", containerName: "shell", width: "100%" }}>
    <Story />
  </div>
);

// Agent activity context is required by useAgentGlow hook. AgentActivityContext
// defaults to null and throws if no provider is mounted, unlike PinnedItemsContext
// which has a safe default. This decorator ensures all stories can use hooks that
// depend on AgentActivityProvider (useAgentGlow, etc.).
const AgentActivityWrapper: Decorator = (Story) => (
  <AgentActivityProvider>
    <Story />
  </AgentActivityProvider>
);

const preview: Preview = {
  beforeEach: () => {
    setupNavigationMocks();
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
  decorators: [
    AgentActivityWrapper,
    ShellContainer,
    FontInjector,
    withThemeByDataAttribute({
      themes: {
        Light: "light",
        Dark: "dark",
      },
      defaultTheme: "light",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;

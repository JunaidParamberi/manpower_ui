import type { StorybookConfig } from "@storybook/nextjs-vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const storybookDir = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../components/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "@storybook/addon-links",
  ],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  staticDirs: ["../public"],
  viteFinal: async (config) => {
    config.resolve ??= {};
    config.resolve.alias = [
      ...(Array.isArray(config.resolve.alias) ? config.resolve.alias : []),
      {
        find: "@/lib/supabase/client",
        replacement: resolve(storybookDir, "mocks/supabase-client.ts"),
      },
      {
        // tsconfig `paths` maps this to the local shim; Vite needs it too.
        find: "@supabase/supabase-js",
        replacement: resolve(storybookDir, "../lib/vendor/supabase-js.ts"),
      },
      {
        find: "@/lib/profile/actions",
        replacement: resolve(storybookDir, "mocks/profile-actions.ts"),
      },
      {
        find: "@/lib/brand-kit/actions",
        replacement: resolve(storybookDir, "mocks/brand-kit-actions.ts"),
      },
      {
        find: "@/lib/onboarding/actions",
        replacement: resolve(storybookDir, "mocks/onboarding-actions.ts"),
      },
      {
        find: "@/lib/clients/client-mutations",
        replacement: resolve(storybookDir, "mocks/client-mutations.ts"),
      },
      {
        find: "@/lib/tasks/actions",
        replacement: resolve(storybookDir, "mocks/task-actions.ts"),
      },
      {
        find: "@/lib/follow-ups/actions",
        replacement: resolve(storybookDir, "mocks/follow-up-actions.ts"),
      },
      {
        find: "@/lib/projects/milestone-actions",
        replacement: resolve(storybookDir, "mocks/milestone-actions.ts"),
      },
      {
        find: "@/lib/mcp/connection-actions",
        replacement: resolve(storybookDir, "mocks/mcp-connection-actions.ts"),
      },
      {
        find: "@/lib/documents/document-mutations",
        replacement: resolve(storybookDir, "mocks/document-mutations.ts"),
      },
      {
        find: "@/lib/documents/invoice-mutations",
        replacement: resolve(storybookDir, "mocks/invoice-mutations.ts"),
      },
      {
        find: "@/lib/email/send-composed-email",
        replacement: resolve(storybookDir, "mocks/send-composed-email.ts"),
      },
    ];

    return config;
  },
};

export default config;

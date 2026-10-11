import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: false,
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    // Globs, not bare names: a bare "node_modules" misses nested copies, so a
    // git worktree under .claude/ drags its own node_modules test files in.
    exclude: ["**/node_modules/**", "**/.next/**", "**/.claude/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@supabase/supabase-js": path.resolve(__dirname, "./lib/vendor/supabase-js.ts"),
    },
  },
});

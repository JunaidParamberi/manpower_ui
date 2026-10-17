import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

/**
 * Loaded only by `npx auth generate`. It never touches D1.
 * The request-time instance lives in `lib/auth.ts`.
 */
export const auth = betterAuth({
  database: drizzleAdapter({} as never, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
});

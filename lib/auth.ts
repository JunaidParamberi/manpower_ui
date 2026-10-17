import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import type { AuthDatabase } from "@/db";
import * as schema from "@/db/schema";

function logAuthLink(kind: string, email: string, url: string): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${kind} email is not configured.`);
  }
  console.info(`[auth] ${kind} for ${email}: ${url}`);
}

export function createAuth(db: AuthDatabase) {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      sendResetPassword: async ({ user, url }) => {
        logAuthLink("password reset", user.email, url);
      },
    },
    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async ({ user, url }) => {
          logAuthLink("email change", user.email, url);
        },
      },
      deleteUser: {
        enabled: true,
      },
    },
    plugins: [nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;

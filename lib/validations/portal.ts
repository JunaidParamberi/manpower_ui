import { z } from "zod";

const PORTAL_TOKEN_REGEX = /^[a-f0-9]{48}$/;

export const portalTokenSchema = z
  .string()
  .trim()
  .regex(PORTAL_TOKEN_REGEX, "Invalid portal token.");

export const clientIdSchema = z.string().uuid();

export function parsePortalTokenInput(value: unknown) {
  return portalTokenSchema.safeParse(value);
}

export function parseClientPortalActionInput(value: unknown) {
  return z.object({ clientId: clientIdSchema }).safeParse(value);
}

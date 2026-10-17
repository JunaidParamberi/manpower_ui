"use server";

import { headers } from "next/headers";

import { getAuthDb } from "@/db";
import { deleteUserStorageObjects } from "@/lib/account/delete-storage";
import { createAuth } from "@/lib/auth";
import { adminAuthHooks } from "@/lib/mock/server-client";
import { getServerContext } from "@/lib/supabase/get-server-context";
import {
  DELETE_ACCOUNT_CONFIRMATION,
  deleteAccountSchema,
} from "@/lib/validations/account";

export type AccountActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function signOutOtherSessions(): Promise<AccountActionResult> {
  try {
    const auth = createAuth(await getAuthDb());
    await auth.api.revokeOtherSessions({
      headers: await headers(),
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not sign out other sessions.",
    };
  }

  return { ok: true };
}

export async function deleteAccount(input: {
  password: string;
  confirmation: string;
  acknowledged: boolean;
}): Promise<AccountActionResult> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.flatten().formErrors[0] ??
        parsed.error.flatten().fieldErrors.password?.[0] ??
        parsed.error.flatten().fieldErrors.confirmation?.[0] ??
        "Invalid delete request.",
    };
  }

  const { user } = await getServerContext();
  if (!user?.email) {
    return { ok: false, message: "Not authenticated." };
  }

  if (parsed.data.confirmation !== DELETE_ACCOUNT_CONFIRMATION) {
    return {
      ok: false,
      message: `Type ${DELETE_ACCOUNT_CONFIRMATION} to confirm.`,
    };
  }

  try {
    await deleteUserStorageObjects(user.id);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete uploaded files.",
    };
  }

  try {
    const auth = createAuth(await getAuthDb());
    await auth.api.deleteUser({
      body: { password: parsed.data.password },
      headers: await headers(),
    });
  } catch {
    return { ok: false, message: "Incorrect password." };
  }

  const { error: deleteError } = await adminAuthHooks.deleteUser(user.id);
  if (deleteError) {
    return { ok: false, message: deleteError.message ?? "Failed to delete workspace data." };
  }

  return { ok: true };
}

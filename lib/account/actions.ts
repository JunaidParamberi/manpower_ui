"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { deleteUserStorageObjects } from "@/lib/account/delete-storage";
import { getServerContext } from "@/lib/supabase/get-server-context";
import {
  DELETE_ACCOUNT_CONFIRMATION,
  deleteAccountSchema,
} from "@/lib/validations/account";

export type AccountActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function signOutOtherSessions(): Promise<AccountActionResult> {
  const { supabase } = await getServerContext();
  const { error } = await supabase.auth.signOut({ scope: "others" });

  if (error) {
    return { ok: false, message: error.message };
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

  const { supabase, user } = await getServerContext();
  if (!user?.email) {
    return { ok: false, message: "Not authenticated." };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });

  if (verifyError) {
    return { ok: false, message: "Incorrect password." };
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

  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return { ok: false, message: deleteError.message };
  }

  await supabase.auth.signOut({ scope: "local" });

  return { ok: true };
}

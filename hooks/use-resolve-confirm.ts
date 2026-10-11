"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAiPanel } from "@/lib/ai-panel/context";
import { invalidateAfterWrite } from "@/lib/ai-panel/invalidate-after-write";
import type { AiTurn } from "@/lib/ai-panel/types";

type Write = { entity: string; entityId: string | null } | null;

/**
 * What happens after the user answers a paused write, wherever they
 * answered it (the card in the thread or Kraft's peek card): clear the
 * pending confirm, refresh the page's data, and toast the result.
 */
export function useResolveConfirm(): (turn: AiTurn, approved: boolean, write: Write) => void {
  const router = useRouter();
  const { updateTurn } = useAiPanel();

  return useCallback(
    (turn, approved, write) => {
      const summary = turn.pendingConfirm?.summary ?? "Done.";
      updateTurn(turn.id, { pendingConfirm: null });
      if (!approved || !write) {
        router.refresh();
        return;
      }
      void invalidateAfterWrite([write]).then(() => {
        router.refresh();
        toast.success(summary);
      });
    },
    [router, updateTurn],
  );
}

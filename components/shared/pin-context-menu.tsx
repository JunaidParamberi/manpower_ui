"use client";

import { Pin, PinOff } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { pinItem, unpinItem } from "@/lib/pinned/actions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

type PinContextMenuProps = {
  children: React.ReactElement;
  itemType: "project" | "client" | "document" | "task";
  itemId: string;
  itemLabel: string;
  itemHref: string;
  isPinned: boolean;
};

export function PinContextMenu({
  children,
  itemType,
  itemId,
  itemLabel,
  itemHref,
  isPinned,
}: PinContextMenuProps) {
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const result = isPinned
        ? await unpinItem(itemType, itemId)
        : await pinItem({ itemType, itemId, itemLabel, itemHref });

      if (!result.ok) {
        toast.error(isPinned ? "Failed to unpin" : "Failed to pin");
        return;
      }
      toast.success(isPinned ? `Unpinned "${itemLabel}"` : `Pinned "${itemLabel}" to sidebar`);
    });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent>
        <ContextMenuItem disabled={isPending} onClick={toggle}>
          {isPinned ? (
            <>
              <PinOff className="mr-2 h-4 w-4" />
              Unpin from sidebar
            </>
          ) : (
            <>
              <Pin className="mr-2 h-4 w-4" />
              Pin to sidebar
            </>
          )}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

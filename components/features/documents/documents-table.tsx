"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteDocument } from "@/lib/documents/document-mutations";
import { usePinnedItems } from "@/lib/pinned/context";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { BulkActionBar } from "@/components/shared/bulk-action-bar";
import { PinContextMenu } from "@/components/shared/pin-context-menu";
import {
  DOCUMENT_TYPE_ICONS,
  documentListStatusLabel,
  documentStatusDotClass,
  documentStatusLabel,
  formatDocumentAmount,
  getDocumentDueDateCountdown,
  getDocumentListNumber,
  isDocumentOverdue,
} from "@/lib/documents/display";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DocumentListRow, DocumentStatus } from "@/types";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

type DocumentsTableProps = {
  documents: DocumentListRow[];
};

export function DocumentsTable({ documents }: DocumentsTableProps) {
  const router = useRouter();
  const { isPinned } = usePinnedItems();
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isBulkPending, startBulkTransition] = useTransition();

  const bulk = useBulkSelection(documents);

  function confirmDelete() {
    if (!pendingDelete) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteDocument(pendingDelete.id);
      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }
      setPendingDelete(null);
      router.refresh();
    });
  }

  function bulkDelete() {
    const LOCKED_STATUSES = ["paid", "partially_paid", "written_off"];
    const docMap = new Map(documents.map((d) => [d.id, d]));
    const selectedDocs = [...bulk.selectedIds].map((id) => docMap.get(id)).filter(Boolean) as typeof documents;
    const unlocked = selectedDocs.filter((d) => !LOCKED_STATUSES.includes(d.status));
    const skipped = selectedDocs.length - unlocked.length;

    if (unlocked.length === 0) {
      toast.error("All selected documents are locked and cannot be deleted.");
      return;
    }

    startBulkTransition(async () => {
      const results = await Promise.all(unlocked.map((d) => deleteDocument(d.id)));
      const failed = results.filter((r) => !r.ok).length;
      bulk.clearSelection();
      router.refresh();
      if (skipped > 0 && failed === 0) {
        toast.success(
          `${unlocked.length} deleted. ${skipped} skipped (locked/paid).`,
        );
      } else if (failed > 0) {
        toast.error(`${failed} document${failed > 1 ? "s" : ""} failed to delete.`);
      } else {
        toast.success(`${unlocked.length} document${unlocked.length > 1 ? "s" : ""} deleted.`);
      }
    });
  }

  if (documents.length === 0) return null;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm" aria-label="Documents">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-8 px-3 py-2.5">
                <Checkbox
                  checked={bulk.isAllSelected}
                  indeterminate={bulk.isIndeterminate}
                  onCheckedChange={bulk.toggleAll}
                  aria-label="Select all documents"
                />
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 sm:px-6">
                Document
              </th>
              <th className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 md:table-cell">
                Client
              </th>
              <th className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 lg:table-cell">
                Issued
              </th>
              <th className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 lg:table-cell">
                Due
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Amount
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Status
              </th>
              <th className="w-10 pe-4 sm:pe-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.map((d) => {
              const docNumber = getDocumentListNumber(d);
              const typePrefix = DOCUMENT_TYPE_ICONS[d.type] ?? "DOC";
              const overdue = isDocumentOverdue({
                status: d.status,
                dueDate: d.due_date,
              });
              const dot = documentStatusDotClass(d.status, overdue);
              const statusLabel = documentListStatusLabel(
                d.status as DocumentStatus,
                overdue,
              );
              const isLocked = ["paid", "partially_paid", "written_off"].includes(d.status);

              return (
                <PinContextMenu
                  key={d.id}
                  itemType="document"
                  itemId={d.id}
                  itemLabel={docNumber}
                  itemHref={`/documents/${d.id}`}
                  isPinned={isPinned("document", d.id)}
                >
                <tr
                  className={cn(
                    "group transition-colors hover:bg-muted/30",
                    overdue && "bg-destructive/[0.03]",
                    bulk.selectedIds.has(d.id) && "bg-muted/50",
                  )}
                >
                  {/* Select */}
                  <td className="w-8 px-3 py-3">
                    <Checkbox
                      checked={bulk.selectedIds.has(d.id)}
                      onCheckedChange={() => bulk.toggleRow(d.id)}
                      aria-label={`Select ${docNumber}`}
                      className="translate-y-px"
                    />
                  </td>
                  {/* Document */}
                  <td className="px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="hidden shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:inline-block">
                        {typePrefix}
                      </span>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <Link
                          href={`/documents/${d.id}`}
                          className="font-medium text-foreground hover:underline truncate"
                        >
                          {docNumber}
                        </Link>
                        <span className="text-xs text-muted-foreground truncate md:hidden">
                          {d.client?.name || "—"} · {formatDate(d.issued_at ?? d.created_at)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="hidden max-w-[12rem] truncate px-4 py-3 text-muted-foreground md:table-cell">
                    {d.client?.name ?? "—"}
                  </td>

                  {/* Issued */}
                  <td className="hidden px-4 py-3 tabular-nums text-muted-foreground lg:table-cell">
                    {formatDate(d.issued_at ?? d.created_at)}
                  </td>

                  {/* Due */}
                  <td
                    className={cn(
                      "hidden px-4 py-3 tabular-nums lg:table-cell",
                      overdue ? "text-destructive font-medium" : "text-muted-foreground",
                    )}
                  >
                    {(() => {
                      const countdown = getDocumentDueDateCountdown(d.due_date, d.status);
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span>{formatDate(d.due_date)}</span>
                          {countdown && (
                            <span
                              className={cn(
                                "text-xs font-normal",
                                countdown.color === "muted" && "text-muted-foreground",
                                countdown.color === "amber" && "text-amber-600 dark:text-amber-400",
                                countdown.color === "destructive" && "text-destructive",
                              )}
                            >
                              {countdown.label}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Amount */}
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-medium text-foreground">
                    {formatDocumentAmount(d.total_amount, d.currency ?? "USD")}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          overdue ? "bg-red-500" : dot,
                        )}
                        aria-hidden
                      />
                      <span className="text-sm text-foreground/80">
                        {overdue ? "Overdue" : statusLabel}
                      </span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="pe-4 py-3 text-right sm:pe-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-md focus:opacity-100"
                            aria-label={`Actions for ${d.title}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          render={<Link href={`/documents/${d.id}`} />}
                        >
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          render={<Link href={`/documents/${d.id}?edit=1`} />}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {isLocked ? (
                          <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                            Delete (locked — {documentStatusLabel(d.status as DocumentStatus)})
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setDeleteError(null);
                              setPendingDelete({ id: d.id, title: d.title });
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
                </PinContextMenu>
              );
            })}
          </tbody>
        </table>
      </div>

      <BulkActionBar count={bulk.count} onClearSelection={bulk.clearSelection}>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={bulkDelete}
          disabled={isBulkPending}
        >
          <Trash2 className="mr-1.5 size-3.5" />
          Delete
        </Button>
      </BulkActionBar>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete this document?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {pendingDelete?.title}
              </span>
              . This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="text-destructive text-sm" role="alert">
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingDelete(null);
                setDeleteError(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending || !pendingDelete}
            >
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Flag,
  HardHat,
  IdCard,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Truck,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { formatClientSince } from "@/lib/clients/display";
import { updateWorkerStatus } from "@/lib/workers/worker-mutations";
import { workerIssues, workerMonogram } from "@/lib/workers/worker-readiness";
import { WORKER_STATUSES, WORKER_STATUS_LABELS } from "@/lib/validations/worker";
import type { WorkerListRow } from "@/types";
import { cn } from "@/lib/utils";

import { DeleteWorkerButton } from "@/components/features/workers/delete-worker-button";
import { useWorkerHref } from "@/components/features/workers/detail/use-worker-href";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select";

const PILL = "inline-flex items-center gap-1 rounded-full px-2 py-px text-label font-medium";

const STATUS_PILL: Record<WorkerListRow["status"], string> = {
  deployed: "bg-[var(--accent-soft)] text-primary",
  available: "bg-[var(--success-soft)] text-[var(--success)]",
  on_leave: "bg-[var(--warning-soft)] text-[var(--warning)]",
  inactive: "bg-[var(--bg-subtle)] text-[var(--fg-2)]",
};

const META_ITEM = "inline-flex min-w-0 max-w-full items-center gap-1.5";
const META_ICON = "size-3.5 shrink-0 text-[var(--fg-3)]";

function MetaItem({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className={META_ITEM}>
      <Icon className={META_ICON} aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function WorkerDetailHeader({ worker, nowIso }: { worker: WorkerListRow; nowIso: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const hrefs = useWorkerHref();

  const issues = workerIssues(worker, nowIso);
  const hasDanger = issues.some((i) => i.tone === "danger");
  const joined = formatClientSince(worker.created_at);
  const employeeId = worker.employee_id?.trim() || null;
  const trade = worker.trade_category?.trim() || null;
  const nationality = worker.nationality?.trim() || null;
  const supplier = worker.supplier?.name?.trim() || null;

  function onStatusChange(next: string | null) {
    if (!next || next === worker.status) return;
    startTransition(async () => {
      const result = await updateWorkerStatus(worker.id, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-4 sm:px-6 lg:px-7 lg:pt-6">
      <Link
        href="/workers"
        className="inline-flex w-fit items-center gap-1.5 text-meta text-[var(--fg-3)] hover:text-foreground lg:hidden"
      >
        <ArrowLeft className="size-3.5" />
        Workers
      </Link>
      <div className="flex flex-wrap items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[var(--accent-soft)] text-body font-semibold text-primary">
          {workerMonogram(worker.name)}
        </span>
        <div className="min-w-0 flex-1 basis-60">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 font-heading text-[20px] font-semibold leading-tight tracking-[-0.015em]">
              {worker.name}
            </h2>
            <Select value={worker.status} onValueChange={onStatusChange} disabled={isPending}>
              <SelectTrigger
                size="sm"
                aria-label="Worker status"
                className={cn(
                  PILL,
                  "w-fit cursor-pointer gap-1 border-0 py-px pe-1.5 ps-2 text-label shadow-none data-[size=sm]:h-auto dark:bg-transparent",
                  STATUS_PILL[worker.status],
                  "[&_svg]:size-3 [&_svg]:text-current",
                )}
              >
                <span className="truncate text-start">{WORKER_STATUS_LABELS[worker.status]}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {WORKER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {WORKER_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {issues.length === 0 ? (
              <span className={cn(PILL, "bg-[var(--success-soft)] text-[var(--success)]")}>Ready to deploy</span>
            ) : (
              <span
                className={cn(
                  PILL,
                  hasDanger
                    ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                    : "bg-[var(--warning-soft)] text-[var(--warning)]",
                )}
              >
                {issues.length} {issues.length === 1 ? "issue" : "issues"}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-meta text-[var(--fg-3)]">
            {employeeId ? <MetaItem icon={IdCard}>{employeeId}</MetaItem> : null}
            {trade ? <MetaItem icon={HardHat}>{trade}</MetaItem> : null}
            {nationality ? <MetaItem icon={Flag}>{nationality}</MetaItem> : null}
            {supplier ? <MetaItem icon={Truck}>{supplier}</MetaItem> : null}
            {joined ? <MetaItem icon={CalendarDays}>Joined {joined}</MetaItem> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={hrefs.detail(worker.id, "documents")} replace scroll={false} />}
          >
            <Upload />
            Upload document
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href={hrefs.edit(worker.id)} />}>
            <Plus />
            Assign to client
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`More for ${worker.name}`}>
                  <MoreHorizontal />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem render={<Link href={hrefs.edit(worker.id)} />}>
                <Pencil data-icon="inline-start" />
                Edit worker
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 data-icon="inline-start" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DeleteWorkerButton
        workerId={worker.id}
        workerName={worker.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        hideTrigger
      />
    </div>
  );
}

"use client";

import { useCallback, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getUnbilledPreview,
  importBillableTime,
  type DayPreview,
} from "@/lib/time/import-actions";
import type { ProjectListRow } from "@/types";

interface ImportTimeSheetProps {
  invoiceId: string;
  invoiceClientId: string | null;
  projects: ProjectListRow[];
  currency?: string;
  onImported?: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function ImportTimeSheet({
  invoiceId,
  invoiceClientId,
  projects,
  currency = "USD",
  onImported,
}: ImportTimeSheetProps) {
  const eligibleProjects = invoiceClientId
    ? projects.filter((project) => project.client_id === invoiceClientId)
    : projects;

  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<string>(
    eligibleProjects[0]?.id ?? "",
  );
  const [dateFrom, setDateFrom] = useState(firstOfMonthIso());
  const [dateTo, setDateTo] = useState(todayIso());
  const [hourlyRate, setHourlyRate] = useState<string>(() => {
    const project = eligibleProjects[0];
    return project?.hourly_rate != null ? String(project.hourly_rate) : "";
  });
  const [days, setDays] = useState<DayPreview[]>([]);
  const [previewLoading, startPreview] = useTransition();
  const [importing, startImport] = useTransition();

  const loadPreview = useCallback((pid: string, from: string, to: string) => {
    if (!pid || !from || !to) return;
    startPreview(async () => {
      const result = await getUnbilledPreview({
        project_id: pid,
        date_from: from,
        date_to: to,
      });
      if (result.ok) setDays(result.days);
      else setDays([]);
    });
  }, []);

  function handleProjectChange(pid: string | null) {
    if (!pid) return;
    setProjectId(pid);
    const project = eligibleProjects.find((item) => item.id === pid);
    if (project?.hourly_rate != null) setHourlyRate(String(project.hourly_rate));
    loadPreview(pid, dateFrom, dateTo);
  }

  function handleDateChange(from: string, to: string) {
    setDateFrom(from);
    setDateTo(to);
    if (projectId) loadPreview(projectId, from, to);
  }

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && projectId) loadPreview(projectId, dateFrom, dateTo);
  }

  const rate = parseFloat(hourlyRate) || 0;
  const totalHours = days.reduce((sum, day) => sum + day.hours, 0);
  const totalAmount = Math.round(totalHours * rate * 100) / 100;

  function handleImport() {
    startImport(async () => {
      const result = await importBillableTime({
        invoice_id: invoiceId,
        project_id: projectId,
        date_from: dateFrom,
        date_to: dateTo,
        hourly_rate: rate,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.lineCount === 0) {
        toast.info("No unbilled hours found in that range.");
        return;
      }
      toast.success(
        `Imported ${result.lineCount} line${result.lineCount === 1 ? "" : "s"}.`,
      );
      setOpen(false);
      onImported?.();
    });
  }

  const canImport = days.length > 0 && rate > 0 && !importing;
  const selectedProject = eligibleProjects.find(
    (project) => project.id === projectId,
  );

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <Clock className="h-4 w-4" />
            Import billable time
          </Button>
        }
      />
      <SheetContent className="flex w-full flex-col gap-6 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Import billable time</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1.5">
          <Label>Project</Label>
          {eligibleProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No projects found for this client.
            </p>
          ) : (
            <Select value={projectId} onValueChange={handleProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project">
                  {selectedProject?.title}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {eligibleProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="import-date-from">From</Label>
            <Input
              id="import-date-from"
              type="date"
              value={dateFrom}
              onChange={(event) =>
                handleDateChange(event.target.value, dateTo)
              }
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="import-date-to">To</Label>
            <Input
              id="import-date-to"
              type="date"
              value={dateTo}
              onChange={(event) =>
                handleDateChange(dateFrom, event.target.value)
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="import-rate">Hourly rate ({currency})</Label>
          <Input
            id="import-rate"
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(event) => setHourlyRate(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Preview</p>
          {previewLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : days.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No unbilled hours in this range.
            </p>
          ) : (
            <div className="rounded-md border text-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-right font-medium">Hours</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day.date} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        {format(parseISO(day.date), "d MMM yyyy")}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {day.hours.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency,
                          minimumFractionDigits: 2,
                        }).format(Math.round(day.hours * rate * 100) / 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/20 font-medium">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {totalHours.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency,
                        minimumFractionDigits: 2,
                      }).format(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <Button onClick={handleImport} disabled={!canImport} className="w-full">
          {importing
            ? "Importing…"
            : days.length > 0
              ? `Insert ${days.length} line${days.length === 1 ? "" : "s"}`
              : "No hours to import"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

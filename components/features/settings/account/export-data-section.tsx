"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountSection } from "@/components/features/settings/account/account-section";
import type { ExportFormat } from "@/lib/validations/account";

const FORMAT_LABELS: Record<ExportFormat, { label: string; hint: string }> = {
  json: {
    label: "JSON",
    hint: "Complete raw export for developers or backup tools.",
  },
  csv: {
    label: "CSV (ZIP)",
    hint: "Spreadsheet-friendly files you can open in Excel or Google Sheets.",
  },
  pdf: {
    label: "PDF summary",
    hint: "Human-readable overview with record counts.",
  },
};

export function ExportDataSection() {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [pending, setPending] = useState(false);

  async function onExport() {
    setPending(true);
    try {
      const response = await fetch(`/api/account/export?format=${format}`, {
        method: "GET",
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Export failed.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? `manpower-export.${format}`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      toast.success("Export downloaded.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export failed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AccountSection
      title="Export my data"
      description="Download a copy of your Manpower workspace data. Choose the format that works best for you."
    >
      <div className="flex max-w-md flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="export_format">Export format</Label>
          <Select
            value={format}
            onValueChange={(value) => setFormat(value as ExportFormat)}
          >
            <SelectTrigger id="export_format" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {FORMAT_LABELS[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {FORMAT_LABELS[format].hint}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          disabled={pending}
          className="w-fit gap-2"
        >
          <Download className="size-4" />
          {pending ? "Preparing export…" : "Download export"}
        </Button>
      </div>
    </AccountSection>
  );
}

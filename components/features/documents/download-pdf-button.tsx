"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type DownloadPdfButtonProps = {
  documentId: string;
  filename: string;
};

export function DownloadPdfButton({ documentId, filename }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/pdf`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[DownloadPdfButton] PDF API error:", res.status, text);
        toast.error("PDF generation failed. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("[DownloadPdfButton] fetch error:", err);
      toast.error("Could not download PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleDownload}
      disabled={loading}
      aria-label={loading ? "Preparing PDF" : "Download PDF"}
    >
      {loading ? <Loader2 className="animate-spin" /> : <Download />}
      <span className="hidden sm:inline">
        {loading ? "Preparing PDF…" : "Download PDF"}
      </span>
    </Button>
  );
}

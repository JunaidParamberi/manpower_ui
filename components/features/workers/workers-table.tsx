"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { WORKER_STATUS_LABELS } from "@/lib/validations/worker";
import type { WorkerListRow } from "@/types";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  available: "default",
  deployed: "secondary",
  on_leave: "outline",
  inactive: "destructive",
};

export function WorkersTable({ workers }: { workers: WorkerListRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.employee_id.toLowerCase().includes(q) ||
        (w.nationality ?? "").toLowerCase().includes(q) ||
        (w.trade_category ?? "").toLowerCase().includes(q),
    );
  }, [workers, query]);

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search by name, employee ID, nationality, trade…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-hidden rounded-lg border border-border/80">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Employee ID</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Nationality</th>
              <th className="px-4 py-3 font-medium">Trade</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No workers match your search.
                </td>
              </tr>
            )}
            {filtered.map((worker) => (
              <tr key={worker.id} className="border-t border-border/60 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <Link href={`/workers/${worker.id}`} className="font-medium hover:underline">
                    {worker.employee_id}
                  </Link>
                </td>
                <td className="px-4 py-3">{worker.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{worker.nationality ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{worker.trade_category ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{worker.supplier?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[worker.status] ?? "outline"}>
                    {WORKER_STATUS_LABELS[worker.status]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

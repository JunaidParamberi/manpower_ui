"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Briefcase,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Archive,
  Trash2,
  Layers,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ServiceForm } from "./service-form";
import { archiveService, deleteService } from "@/lib/services/actions";
import { TAX_MODE_LABELS } from "@/lib/documents/tax/compute-tax";
import { SERVICE_TYPE_LABELS, SERVICE_UNIT_LABELS, type ServiceUnitValue } from "@/lib/validations/service";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import type { ServiceRow, ServiceType } from "@/types";

interface ServicesManagerProps {
  initialServices: ServiceRow[];
}

const SERVICE_TYPE_ICONS: Record<ServiceType, React.ElementType> = {
  service: Briefcase,
  product: Package,
  asset: Layers,
};

const TYPE_FILTERS = [
  { value: "all" as const, label: "All" },
  { value: "service" as ServiceType, label: "Services" },
  { value: "product" as ServiceType, label: "Products" },
  { value: "asset" as ServiceType, label: "Assets" },
];

export function ServicesManager({ initialServices }: ServicesManagerProps) {
  const [services, setServices] = useState<ServiceRow[]>(initialServices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ServiceType | "all">("all");
  const [, startTransition] = useTransition();

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(service: ServiceRow) {
    setEditing(service);
    setDialogOpen(true);
  }

  function onSaved(service: ServiceRow) {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === service.id);
      if (idx === -1) return [service, ...prev];
      const next = [...prev];
      next[idx] = service;
      return next;
    });
  }

  function handleArchive(id: string) {
    startTransition(async () => {
      const result = await archiveService(id);
      if (!result.ok) { toast.error(result.error); return; }
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Archived");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteService(id);
      if (!result.ok) { toast.error(result.error); return; }
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Deleted");
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (typeFilter !== "all" && s.service_type !== typeFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !(s.description ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [services, search, typeFilter]);

  const counts = useMemo(() => ({
    all: services.length,
    service: services.filter((s) => s.service_type === "service").length,
    product: services.filter((s) => s.service_type === "product").length,
    asset: services.filter((s) => s.service_type === "asset").length,
  }), [services]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catalog"
        eyebrow="Services & Products"
        description="Reusable line items you can insert into invoices and quotes."
        actions={
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add item
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={[
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                typeFilter === value
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {label}
              <span className={[
                "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                typeFilter === value
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              ].join(" ")}>
                {counts[value]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 w-full pl-8 text-sm sm:w-56"
            placeholder="Search catalog…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        services.length === 0 ? (
          <EmptyStateCard
            icon={Briefcase}
            title="No items yet"
            description="Add services, products, or assets to quickly insert them as line items in invoices and quotes."
            action={
              <Button size="sm" onClick={openCreate} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add first item
              </Button>
            }
          />
        ) : (
          <EmptyStateCard
            icon={Search}
            title="No results"
            description="Try adjusting your search or filter."
          />
        )
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-10" />
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Rate / unit</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead className="hidden lg:table-cell">SKU</TableHead>
                <TableHead className="hidden lg:table-cell">HSN/SAC</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((service) => {
                const Icon = SERVICE_TYPE_ICONS[service.service_type as ServiceType] ?? Briefcase;
                return (
                  <TableRow key={service.id} className="group">
                    <TableCell>
                      <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground">{service.name}</span>
                        {service.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                            {service.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal capitalize">
                        {SERVICE_TYPE_LABELS[service.service_type as ServiceType] ?? service.service_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="tabular-nums font-medium text-foreground">
                          {service.default_rate.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {SERVICE_UNIT_LABELS[service.unit as ServiceUnitValue] ?? service.unit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.default_tax_mode === "none" ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {TAX_MODE_LABELS[service.default_tax_mode as keyof typeof TAX_MODE_LABELS] ?? service.default_tax_mode}
                          {" "}{service.default_tax_rate}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {service.sku ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {service.hsn_sac_code ?? "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                              aria-label={`Actions for ${service.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(service)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(service.id)}>
                            <Archive className="h-3.5 w-3.5 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(service.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ServiceForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editing}
        onSaved={onSaved}
      />
    </div>
  );
}

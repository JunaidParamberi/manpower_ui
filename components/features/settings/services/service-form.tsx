"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { NumberInput } from "@/components/shared/number-input";
import {
  serviceInputSchema,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  SERVICE_UNITS,
  SERVICE_UNIT_LABELS,
} from "@/lib/validations/service";
import { createService, updateService } from "@/lib/services/actions";
import { TAX_MODES, TAX_MODE_LABELS } from "@/lib/documents/tax/compute-tax";
import type { ServiceRow } from "@/types";
import type { z } from "zod";

type ServiceFormValues = z.input<typeof serviceInputSchema>;

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: ServiceRow;
  onSaved?: (service: ServiceRow) => void;
}

const EMPTY_DEFAULTS: ServiceFormValues = {
  name: "",
  description: "",
  service_type: "service",
  unit: "item",
  sku: "",
  default_qty: 1,
  cost_price: undefined,
  default_rate: 0,
  default_tax_mode: "none",
  default_tax_rate: 0,
  hsn_sac_code: "",
};

function rowToFormValues(service: ServiceRow): ServiceFormValues {
  return {
    id: service.id,
    name: service.name,
    description: service.description ?? "",
    service_type: service.service_type as ServiceFormValues["service_type"],
    unit: service.unit as ServiceFormValues["unit"],
    sku: service.sku ?? "",
    default_qty: service.default_qty,
    cost_price: service.cost_price ?? undefined,
    default_rate: service.default_rate,
    default_tax_mode: service.default_tax_mode as ServiceFormValues["default_tax_mode"],
    default_tax_rate: service.default_tax_rate,
    hsn_sac_code: service.hsn_sac_code ?? "",
  };
}

export function ServiceForm({ open, onOpenChange, service, onSaved }: ServiceFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!service;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<ServiceFormValues>({
      resolver: zodResolver(serviceInputSchema),
      defaultValues: EMPTY_DEFAULTS,
    });

  const taxMode = watch("default_tax_mode");

  useEffect(() => {
    if (open) {
      reset(service ? rowToFormValues(service) : EMPTY_DEFAULTS);
    }
  }, [open, service, reset]);

  function onSubmit(values: ServiceFormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateService(values)
        : await createService(values);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Updated" : "Created");
      onSaved?.(result.service);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit item" : "Add catalog item"}</DialogTitle>
          <DialogDescription>
            Reusable line item — insert into invoices and quotes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 pt-1">

          {/* ── Identity ── */}
          <section className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Identity
            </p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-name">Name *</Label>
              <Input id="svc-name" placeholder="e.g. Logo design" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-desc">Description</Label>
              <Textarea
                id="svc-desc"
                rows={2}
                placeholder="What this covers — shown to client on invoice"
                {...register("description")}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-type">Type</Label>
                <Select
                  value={watch("service_type")}
                  onValueChange={(v) => setValue("service_type", v as ServiceFormValues["service_type"])}
                >
                  <SelectTrigger id="svc-type" className="w-full">
                    <SelectValue placeholder="Select type">
                      {watch("service_type") ? (SERVICE_TYPE_LABELS[watch("service_type")!] ?? watch("service_type")) : "Select type"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{SERVICE_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-sku">SKU / item code</Label>
                <Input
                  id="svc-sku"
                  placeholder="e.g. DES-001"
                  {...register("sku")}
                />
                {errors.sku && <p className="text-xs text-destructive">{errors.sku.message as string}</p>}
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Pricing ── */}
          <section className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Pricing
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-rate">Rate *</Label>
                <NumberInput
                  id="svc-rate"
                  min={0}
                  step={0.01}
                  value={String(watch("default_rate") ?? 0)}
                  onChange={(e) => setValue("default_rate", parseFloat(e.target.value) || 0)}
                />
                {errors.default_rate && <p className="text-xs text-destructive">{errors.default_rate.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-unit">Unit</Label>
                <Select
                  value={watch("unit")}
                  onValueChange={(v) => setValue("unit", v as ServiceFormValues["unit"])}
                >
                  <SelectTrigger id="svc-unit" className="w-full">
                    <SelectValue placeholder="Select unit">
                      {watch("unit") ? (SERVICE_UNIT_LABELS[watch("unit")!] ?? watch("unit")) : "Select unit"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{SERVICE_UNIT_LABELS[u]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-qty">Default qty</Label>
                <NumberInput
                  id="svc-qty"
                  min={0.01}
                  step={0.01}
                  value={String(watch("default_qty") ?? 1)}
                  onChange={(e) => setValue("default_qty", parseFloat(e.target.value) || 1)}
                />
                {errors.default_qty && <p className="text-xs text-destructive">{errors.default_qty.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-cost">
                  Cost price
                  <span className="ml-1 text-muted-foreground text-[11px] font-normal">(not on invoice)</span>
                </Label>
                <NumberInput
                  id="svc-cost"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={String(watch("cost_price") ?? "")}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue("cost_price", val === "" ? undefined : parseFloat(val) || 0);
                  }}
                />
                {errors.cost_price && <p className="text-xs text-destructive">{errors.cost_price.message as string}</p>}
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Tax & compliance ── */}
          <section className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Tax &amp; compliance
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-tax-mode">Tax</Label>
                <Select
                  value={taxMode}
                  onValueChange={(v) => setValue("default_tax_mode", v as ServiceFormValues["default_tax_mode"])}
                >
                  <SelectTrigger id="svc-tax-mode" className="w-full">
                    <SelectValue placeholder="Select tax">
                      {TAX_MODE_LABELS[taxMode as keyof typeof TAX_MODE_LABELS] ?? taxMode}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>{TAX_MODE_LABELS[mode]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {taxMode !== "none" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-tax-rate">Rate (%)</Label>
                  <NumberInput
                    id="svc-tax-rate"
                    min={0}
                    max={100}
                    step={0.1}
                    value={String(watch("default_tax_rate") ?? 0)}
                    onChange={(e) => setValue("default_tax_rate", parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-hsn">HSN/SAC code</Label>
                <Input
                  id="svc-hsn"
                  inputMode="numeric"
                  placeholder="e.g. 998391"
                  {...register("hsn_sac_code")}
                />
                {errors.hsn_sac_code && (
                  <p className="text-xs text-destructive">{errors.hsn_sac_code.message as string}</p>
                )}
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Add to catalog"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

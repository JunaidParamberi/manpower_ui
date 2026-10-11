"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecurringLineItemsEditor } from "./recurring-line-items-editor";
import {
  createRecurringInvoice,
  updateRecurringInvoice,
} from "@/lib/recurring/actions";
import {
  recurringInvoiceSchema,
  type RecurringInvoiceFormInput,
  type RecurringInvoiceInput,
} from "@/lib/validations/recurring-invoice";
import type { ClientRow, ProjectListRow, RecurringInvoiceRow, RecurringLineItemTemplate } from "@/types";

type RecurringInvoiceFormProps = {
  clients: ClientRow[];
  projects: ProjectListRow[];
  initial?: RecurringInvoiceRow;
  prefill?: RecurringInvoiceFormInput;
};

function defaultValues(
  initial?: RecurringInvoiceRow,
): RecurringInvoiceFormInput {
  if (initial) {
    return {
      client_id: initial.client_id,
      project_id: initial.project_id,
      title: initial.title,
      interval: initial.interval,
      interval_count: initial.interval_count,
      start_date: initial.start_date,
      end_date: initial.end_date,
      occurrences_limit: initial.occurrences_limit,
      auto_send: initial.auto_send,
      net_days: initial.net_days,
      currency: initial.currency,
      tax_mode: initial.tax_mode,
      tax_rate: initial.tax_rate,
      discount_type: initial.discount_type,
      discount_value: initial.discount_value,
      notes_footer: initial.notes_footer,
      payment_terms: initial.payment_terms,
      line_items: initial.line_items,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  return {
    client_id: "",
    project_id: null,
    title: "",
    interval: "monthly",
    interval_count: 1,
    start_date: today,
    end_date: null,
    occurrences_limit: null,
    auto_send: false,
    net_days: 7,
    currency: "USD",
    tax_mode: "none",
    tax_rate: 0,
    discount_type: "percent",
    discount_value: 0,
    notes_footer: null,
    payment_terms: null,
    line_items: [
      {
        description: "",
        notes: null,
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        hsn_sac_code: null,
      },
    ],
  };
}

export function RecurringInvoiceForm({
  clients,
  projects,
  initial,
  prefill,
}: RecurringInvoiceFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<RecurringInvoiceFormInput>({
    resolver: zodResolver(recurringInvoiceSchema),
    defaultValues: prefill ?? defaultValues(initial),
  });

  const clientId = form.watch("client_id");
  const currency = form.watch("currency");
  const eligibleProjects = clientId
    ? projects.filter((p) => p.client_id === clientId)
    : projects;

  function onSubmit(values: RecurringInvoiceFormInput) {
    const parsed = recurringInvoiceSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    startTransition(async () => {
      const result = initial
        ? await updateRecurringInvoice(initial.id, parsed.data)
        : await createRecurringInvoice(parsed.data);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(initial ? "Schedule updated" : "Recurring invoice created");
      router.push(`/finance/recurring/${result.recurring.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Client</Label>
          <Controller
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Project (optional)</Label>
          <Controller
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <Select
                value={field.value ?? "__none"}
                onValueChange={(v) =>
                  field.onChange(v === "__none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {eligibleProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label htmlFor="recurring-title">Title</Label>
          <Input id="recurring-title" {...form.register("title")} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Interval</Label>
          <Controller
            control={form.control}
            name="interval"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="interval-count">Every</Label>
          <Input
            id="interval-count"
            type="number"
            min={1}
            max={24}
            {...form.register("interval_count")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="start-date">Start date</Label>
          <Input id="start-date" type="date" {...form.register("start_date")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="net-days">Due in (days)</Label>
          <Input
            id="net-days"
            type="number"
            min={0}
            {...form.register("net_days")}
          />
        </div>
      </section>

      <section className="flex items-center justify-between rounded-lg border border-border/60 p-4">
        <div>
          <p className="text-sm font-medium">Auto-send to client</p>
          <p className="text-sm text-muted-foreground">
            When off, each run creates a draft invoice for your review.
          </p>
        </div>
        <Controller
          control={form.control}
          name="auto_send"
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </section>

      <section className="flex flex-col gap-3">
        <Label>Line items</Label>
        <Controller
          control={form.control}
          name="line_items"
          render={({ field }) => (
            <RecurringLineItemsEditor
              value={field.value as RecurringLineItemTemplate[]}
              onChange={field.onChange}
              currency={currency}
            />
          )}
        />
      </section>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/finance/recurring")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : initial ? "Save changes" : "Create schedule"}
        </Button>
      </div>
    </form>
  );
}

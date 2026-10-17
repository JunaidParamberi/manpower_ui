"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createSupplier, updateSupplier } from "@/lib/suppliers/supplier-mutations";
import type { SupplierInput } from "@/lib/validations/supplier";
import { SUPPLIER_LIMITS } from "@/lib/validations/supplier";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { SupplierRow } from "@/types";

type SupplierFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: SupplierRow | null;
  onSuccess: () => void;
};

const emptyDefaults: SupplierInput = {
  name: "",
  supplier_code: "",
  license_number: "",
  vat_number: "",
  contact_name: "",
  email: "",
  phone: "",
  website: "",
  notes: "",
};

function supplierToFormValues(supplier: SupplierRow): SupplierInput {
  return {
    id: supplier.id,
    name: supplier.name,
    supplier_code: supplier.supplier_code ?? "",
    license_number: supplier.license_number ?? "",
    vat_number: supplier.vat_number ?? "",
    contact_name: supplier.contact_name ?? "",
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    website: supplier.website ?? "",
    notes: supplier.notes ?? "",
  };
}

export function SupplierFormSheet({ open, onOpenChange, supplier, onSuccess }: SupplierFormSheetProps) {
  const [isPending, startTransition] = useTransition();
  const mode = supplier ? "edit" : "create";

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierInput>({
    defaultValues: supplier ? supplierToFormValues(supplier) : emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;
    reset(supplier ? supplierToFormValues(supplier) : emptyDefaults);
  }, [open, supplier, reset]);

  function onSubmit(values: SupplierInput) {
    startTransition(async () => {
      const result = mode === "create" ? await createSupplier(values) : await updateSupplier(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(mode === "create" ? "Supplier added" : "Supplier updated");
      onOpenChange(false);
      onSuccess();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Add supplier" : "Edit supplier"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 px-6 pb-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="supplier-name">Name *</FieldLabel>
              <Input id="supplier-name" maxLength={SUPPLIER_LIMITS.name} {...register("name", { required: true })} />
              {errors.name && <p className="text-sm text-destructive">Name is required.</p>}
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-code">Supplier ID</FieldLabel>
              <Input id="supplier-code" maxLength={SUPPLIER_LIMITS.supplier_code} {...register("supplier_code")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-license">License number</FieldLabel>
              <Input id="supplier-license" maxLength={SUPPLIER_LIMITS.license_number} {...register("license_number")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-vat">VAT number</FieldLabel>
              <Input id="supplier-vat" maxLength={SUPPLIER_LIMITS.vat_number} {...register("vat_number")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-contact">Contact name</FieldLabel>
              <Input id="supplier-contact" maxLength={SUPPLIER_LIMITS.contact_name} {...register("contact_name")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-email">Email</FieldLabel>
              <Input id="supplier-email" type="email" maxLength={SUPPLIER_LIMITS.email} {...register("email")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-phone">Phone</FieldLabel>
              <Input id="supplier-phone" maxLength={SUPPLIER_LIMITS.phone} {...register("phone")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-website">Website</FieldLabel>
              <Input id="supplier-website" maxLength={SUPPLIER_LIMITS.website} {...register("website")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-notes">Notes</FieldLabel>
              <Textarea id="supplier-notes" maxLength={SUPPLIER_LIMITS.notes} {...register("notes")} />
            </Field>
          </FieldGroup>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={isPending}>
              {mode === "create" ? "Add supplier" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

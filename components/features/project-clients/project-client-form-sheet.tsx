"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createProjectClient, updateProjectClient } from "@/lib/project-clients/project-client-mutations";
import type { ProjectClientInput } from "@/lib/validations/project-client";
import { PROJECT_CLIENT_LIMITS } from "@/lib/validations/project-client";

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
import type { ProjectClientRow } from "@/types";

type ProjectClientFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectClient?: ProjectClientRow | null;
  onSuccess: () => void;
};

const emptyDefaults: ProjectClientInput = {
  name: "",
  client_code: "",
  license_number: "",
  vat_number: "",
  contact_name: "",
  email: "",
  phone: "",
  website: "",
  notes: "",
};

function projectClientToFormValues(projectClient: ProjectClientRow): ProjectClientInput {
  return {
    id: projectClient.id,
    name: projectClient.name,
    client_code: projectClient.client_code ?? "",
    license_number: projectClient.license_number ?? "",
    vat_number: projectClient.vat_number ?? "",
    contact_name: projectClient.contact_name ?? "",
    email: projectClient.email ?? "",
    phone: projectClient.phone ?? "",
    website: projectClient.website ?? "",
    notes: projectClient.notes ?? "",
  };
}

export function ProjectClientFormSheet({ open, onOpenChange, projectClient, onSuccess }: ProjectClientFormSheetProps) {
  const [isPending, startTransition] = useTransition();
  const mode = projectClient ? "edit" : "create";

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectClientInput>({
    defaultValues: projectClient ? projectClientToFormValues(projectClient) : emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;
    reset(projectClient ? projectClientToFormValues(projectClient) : emptyDefaults);
  }, [open, projectClient, reset]);

  function onSubmit(values: ProjectClientInput) {
    startTransition(async () => {
      const result = mode === "create" ? await createProjectClient(values) : await updateProjectClient(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(mode === "create" ? "Project client added" : "Project client updated");
      onOpenChange(false);
      onSuccess();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Add project client" : "Edit project client"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 px-6 pb-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="project-client-name">Name *</FieldLabel>
              <Input id="project-client-name" maxLength={PROJECT_CLIENT_LIMITS.name} {...register("name", { required: true })} />
              {errors.name && <p className="text-sm text-destructive">Name is required.</p>}
            </Field>
            <Field>
              <FieldLabel htmlFor="project-client-code">Client ID</FieldLabel>
              <Input id="project-client-code" maxLength={PROJECT_CLIENT_LIMITS.client_code} {...register("client_code")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-client-license">License number</FieldLabel>
              <Input id="project-client-license" maxLength={PROJECT_CLIENT_LIMITS.license_number} {...register("license_number")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-client-vat">VAT number</FieldLabel>
              <Input id="project-client-vat" maxLength={PROJECT_CLIENT_LIMITS.vat_number} {...register("vat_number")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-client-contact">Contact name</FieldLabel>
              <Input id="project-client-contact" maxLength={PROJECT_CLIENT_LIMITS.contact_name} {...register("contact_name")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-client-email">Email</FieldLabel>
              <Input id="project-client-email" type="email" maxLength={PROJECT_CLIENT_LIMITS.email} {...register("email")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-client-phone">Phone</FieldLabel>
              <Input id="project-client-phone" maxLength={PROJECT_CLIENT_LIMITS.phone} {...register("phone")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-client-website">Website</FieldLabel>
              <Input id="project-client-website" maxLength={PROJECT_CLIENT_LIMITS.website} {...register("website")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-client-notes">Notes</FieldLabel>
              <Textarea id="project-client-notes" maxLength={PROJECT_CLIENT_LIMITS.notes} {...register("notes")} />
            </Field>
          </FieldGroup>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={isPending}>
              {mode === "create" ? "Add project client" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

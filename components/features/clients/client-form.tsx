"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createClient, updateClient } from "@/lib/clients/client-mutations";
import { buildClientFormInsights } from "@/lib/clients/client-form-insights";
import {
  clientNameFormCopy,
  initialClientNameFormKind,
  type ClientNameFormKind,
} from "@/lib/clients/client-name-form-copy";
import type { ClientCreateFormInput } from "@/lib/validations/client";
import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  WorkspaceFormAside,
  WorkspaceFormMain,
  WorkspaceFormSection,
  WorkspaceFormShell,
} from "@/components/shared/workspace-form-shell";
import {
  ClientBillingSection,
  ClientContactSection,
  ClientIdentitySection,
  ClientInternalContextSection,
} from "@/components/features/clients/client-form-sections";
import { ClientWorkspacePanel } from "@/components/features/clients/client-workspace-panel";

const emptyDefaults: ClientCreateFormInput = {
  name: "",
  contact_name: "",
  website: "",
  email: "",
  billing_email: "",
  phone: "",
  company: "",
  address: "",
  currency: "",
  tax_id: "",
  payment_terms_days: "",
  relationship_status: "active",
  lead_source: "",
  preferred_contact_method: "",
  timezone: "",
  tags: "",
  notes: "",
};

type ClientFormProps =
  | {
      mode: "create";
      defaultValues?: ClientCreateFormInput;
    }
  | {
      mode: "edit";
      clientId: string;
      defaultValues: ClientCreateFormInput;
    };

export function ClientForm(props: ClientFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const defaults =
    props.mode === "create"
      ? (props.defaultValues ?? emptyDefaults)
      : props.defaultValues;

  const [nameKind, setNameKind] = useState<ClientNameFormKind>(() =>
    initialClientNameFormKind({
      company: defaults.company,
      contact_name: defaults.contact_name,
    }),
  );
  const nameCopy = useMemo(() => clientNameFormCopy(nameKind), [nameKind]);

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    formState: { errors },
  } = useForm<ClientCreateFormInput>({
    defaultValues: defaults,
  });

  useEffect(() => {
    if (nameKind === "person") {
      setValue("contact_name", "", { shouldDirty: true });
    }
  }, [nameKind, setValue]);

  function onSubmit(values: ClientCreateFormInput) {
    setServerError(null);
    clearErrors();
    startTransition(async () => {
      if (props.mode === "create") {
        const created = await createClient(values);
        if (!created.ok) {
          setServerError(created.message);
          if (created.fieldErrors) {
            (
              Object.entries(created.fieldErrors) as [
                keyof ClientCreateFormInput,
                string[] | undefined,
              ][]
            ).forEach(([key, msgs]) => {
              const msg = msgs?.[0];
              if (msg) {
                setError(key, { message: msg });
              }
            });
          }
          return;
        }
        toast.success("Client created");
        router.push(`/clients/${created.client.id}`);
        router.refresh();
        return;
      }

      const updated = await updateClient(props.clientId, values);
      if (!updated.ok) {
        setServerError(updated.message);
        if (updated.fieldErrors) {
          (
            Object.entries(updated.fieldErrors) as [
              keyof ClientCreateFormInput,
              string[] | undefined,
            ][]
          ).forEach(([key, msgs]) => {
            const msg = msgs?.[0];
            if (msg) {
              setError(key, { message: msg });
            }
          });
        }
        return;
      }

      toast.success("Client updated");
      router.push(`/clients/${props.clientId}`);
      router.refresh();
    });
  }

  const watchedValues = useWatch({ control });
  const insightValues = {
    ...defaults,
    ...watchedValues,
  } as ClientCreateFormInput;
  const insights = buildClientFormInsights(insightValues);
  const cancelHref = props.mode === "edit" ? `/clients/${props.clientId}` : "/clients";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <WorkspaceFormShell>
        <WorkspaceFormMain>
          {serverError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not save</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <ClientIdentitySection
            register={register}
            control={control}
            errors={errors}
            nameKind={nameKind}
            nameCopy={nameCopy}
            onNameKindChange={setNameKind}
          />
          <ClientContactSection
            register={register}
            control={control}
            errors={errors}
            nameKind={nameKind}
            nameCopy={nameCopy}
          />
          <ClientBillingSection register={register} control={control} errors={errors} />
          <ClientInternalContextSection register={register} errors={errors} />

          <WorkspaceFormSection
            title={props.mode === "create" ? "Create client" : "Save client changes"}
            description="Review the live summary, then save when the essentials look right."
            contentClassName="pt-0"
            footer={
              <div className="flex w-full flex-wrap justify-end gap-2">
                <Link
                  href={cancelHref}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Cancel
                </Link>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "Saving..."
                    : props.mode === "create"
                      ? "Create client"
                      : "Save changes"}
                </Button>
              </div>
            }
          >
            <p className="text-sm text-muted-foreground">
              Changes update the CRM profile immediately after save. Client-facing
              documents will use the name, billing email, currency, and address from
              this workspace.
            </p>
          </WorkspaceFormSection>
        </WorkspaceFormMain>

        <WorkspaceFormAside>
          <ClientWorkspacePanel insights={insights} mode={props.mode} />
        </WorkspaceFormAside>
      </WorkspaceFormShell>
    </form>
  );
}

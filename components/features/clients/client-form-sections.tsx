"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";

import type { ClientNameFormKind } from "@/lib/clients/client-name-form-copy";
import {
  CLIENT_LIMITS,
  CLIENT_PREFERRED_CONTACT_METHODS,
  CLIENT_RELATIONSHIP_STATUSES,
  type ClientCreateFormInput,
} from "@/lib/validations/client";
import { cn } from "@/lib/utils";

import { CurrencySelect } from "@/components/shared/currency-select";
import { WorkspaceFormSection } from "@/components/shared/workspace-form-shell";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/shared/number-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ClientNameCopy = {
  kindLegend: string;
  kindPersonLabel: string;
  kindOrgLabel: string;
  nameLabel: string;
  nameHelper: string;
  namePlaceholder: string;
  nameAutocomplete: string;
  contactNameLabel: string;
  contactNameHelper: string;
  contactNamePlaceholder: string;
  companyLabel: string;
  companyHelper: string;
};

type ClientSectionProps = {
  register: UseFormRegister<ClientCreateFormInput>;
  control: Control<ClientCreateFormInput>;
  errors: FieldErrors<ClientCreateFormInput>;
};

type ClientIdentitySectionProps = ClientSectionProps & {
  nameKind: ClientNameFormKind;
  nameCopy: ClientNameCopy;
  onNameKindChange: (kind: ClientNameFormKind) => void;
};

const RELATIONSHIP_STATUS_LABELS = {
  lead: "Lead",
  active: "Active client",
  paused: "Paused",
  past: "Past client",
  archived: "Archived",
} as const;

const CONTACT_METHOD_LABELS = {
  email: "Email",
  phone: "Phone",
  whatsapp: "WhatsApp",
  none: "No preference",
} as const;

function describedBy(...ids: Array<string | false | undefined>): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
}

export function ClientIdentitySection({
  register,
  control,
  errors,
  nameKind,
  nameCopy,
  onNameKindChange,
}: ClientIdentitySectionProps) {
  return (
    <WorkspaceFormSection
      title="Client identity"
      description="Set how this client appears across your workspace, documents, and portal."
    >
      <div className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-0 border-0 p-0">
          <legend className="mb-0 w-full text-sm leading-none font-medium text-foreground">
            {nameCopy.kindLegend}
          </legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label
              className={cn(
                "flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                nameKind === "person"
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted/60",
              )}
            >
              <input
                type="radio"
                name="client_name_kind_ui"
                className="size-4 shrink-0 accent-primary"
                checked={nameKind === "person"}
                onChange={() => onNameKindChange("person")}
              />
              {nameCopy.kindPersonLabel}
            </label>
            <label
              className={cn(
                "flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                nameKind === "organization"
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted/60",
              )}
            >
              <input
                type="radio"
                name="client_name_kind_ui"
                className="size-4 shrink-0 accent-primary"
                checked={nameKind === "organization"}
                onChange={() => onNameKindChange("organization")}
              />
              {nameCopy.kindOrgLabel}
            </label>
          </div>
        </fieldset>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2 lg:col-span-2">
            <Label htmlFor="crm_client_name">
              {nameCopy.nameLabel} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="crm_client_name"
              autoComplete={nameCopy.nameAutocomplete}
              maxLength={CLIENT_LIMITS.name}
              placeholder={nameCopy.namePlaceholder}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy(
                "crm_client_name_helper",
                errors.name && "crm_client_name_error",
              )}
              {...register("name", {
                required: "Display name is required.",
              })}
            />
            <p
              id="crm_client_name_helper"
              className="text-muted-foreground text-xs leading-relaxed"
            >
              {nameCopy.nameHelper}
            </p>
            <FieldError id="crm_client_name_error" message={errors.name?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="crm_client_website">Website</Label>
            <Input
              id="crm_client_website"
              type="url"
              autoComplete="url"
              maxLength={CLIENT_LIMITS.website}
              placeholder="https://company.com"
              aria-invalid={Boolean(errors.website)}
              aria-describedby={describedBy(
                errors.website && "crm_client_website_error",
              )}
              {...register("website")}
            />
            <FieldError
              id="crm_client_website_error"
              message={errors.website?.message}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="crm_client_relationship_status">Relationship status</Label>
            <Controller
              name="relationship_status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || "active"}
                  onValueChange={(value) => {
                    if (value) {
                      field.onChange(value);
                    }
                  }}
                >
                  <SelectTrigger
                    id="crm_client_relationship_status"
                    className="w-full min-w-0"
                    aria-invalid={Boolean(errors.relationship_status)}
                  >
                    <span className="truncate text-start">
                      {RELATIONSHIP_STATUS_LABELS[
                        (field.value || "active") as keyof typeof RELATIONSHIP_STATUS_LABELS
                      ] ?? "Active client"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CLIENT_RELATIONSHIP_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {RELATIONSHIP_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError
              id="crm_client_relationship_status_error"
              message={errors.relationship_status?.message}
            />
          </div>

          <div className="flex flex-col gap-2 lg:col-span-2">
            <Label htmlFor="crm_client_company">{nameCopy.companyLabel}</Label>
            <Input
              id="crm_client_company"
              autoComplete="organization"
              maxLength={CLIENT_LIMITS.company}
              aria-invalid={Boolean(errors.company)}
              aria-describedby={describedBy(
                "crm_client_company_helper",
                errors.company && "crm_client_company_error",
              )}
              {...register("company")}
            />
            <p
              id="crm_client_company_helper"
              className="text-muted-foreground text-xs leading-relaxed"
            >
              {nameCopy.companyHelper}
            </p>
            <FieldError id="crm_client_company_error" message={errors.company?.message} />
          </div>
        </div>
      </div>
    </WorkspaceFormSection>
  );
}

export function ClientContactSection({
  register,
  control,
  errors,
  nameKind,
  nameCopy,
}: ClientSectionProps & Pick<ClientIdentitySectionProps, "nameKind" | "nameCopy">) {
  return (
    <WorkspaceFormSection
      title="Contact routes"
      description="Keep the fastest way to reach this client visible before email threads and approvals start."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {nameKind === "organization" ? (
          <div className="flex flex-col gap-2 lg:col-span-2">
            <Label htmlFor="crm_client_contact_name">
              {nameCopy.contactNameLabel}
            </Label>
            <Input
              id="crm_client_contact_name"
              autoComplete="name"
              maxLength={CLIENT_LIMITS.contact_name}
              placeholder={nameCopy.contactNamePlaceholder}
              aria-invalid={Boolean(errors.contact_name)}
              aria-describedby={describedBy(
                "crm_client_contact_name_helper",
                errors.contact_name && "crm_client_contact_name_error",
              )}
              {...register("contact_name")}
            />
            <p
              id="crm_client_contact_name_helper"
              className="text-muted-foreground text-xs leading-relaxed"
            >
              {nameCopy.contactNameHelper}
            </p>
            <FieldError
              id="crm_client_contact_name_error"
              message={errors.contact_name?.message}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="crm_client_email">Email</Label>
          <Input
            id="crm_client_email"
            type="email"
            autoComplete="email"
            maxLength={CLIENT_LIMITS.email}
            placeholder="name@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy(errors.email && "crm_client_email_error")}
            {...register("email")}
          />
          <FieldError id="crm_client_email_error" message={errors.email?.message} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="crm_client_phone">Phone</Label>
          <Input
            id="crm_client_phone"
            type="tel"
            autoComplete="tel"
            maxLength={CLIENT_LIMITS.phone}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy(errors.phone && "crm_client_phone_error")}
            {...register("phone")}
          />
          <FieldError id="crm_client_phone_error" message={errors.phone?.message} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="crm_client_preferred_contact_method">
            Preferred contact
          </Label>
          <Controller
            name="preferred_contact_method"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(value) => {
                  field.onChange(value === "none" ? "" : value);
                }}
              >
                <SelectTrigger
                  id="crm_client_preferred_contact_method"
                  className="w-full min-w-0"
                  aria-invalid={Boolean(errors.preferred_contact_method)}
                >
                  <span className="truncate text-start">
                    {field.value
                      ? CONTACT_METHOD_LABELS[
                          field.value as keyof typeof CONTACT_METHOD_LABELS
                        ]
                      : "No preference"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {CLIENT_PREFERRED_CONTACT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {CONTACT_METHOD_LABELS[method]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError
            id="crm_client_preferred_contact_method_error"
            message={errors.preferred_contact_method?.message}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="crm_client_timezone">Timezone</Label>
          <Input
            id="crm_client_timezone"
            autoComplete="off"
            maxLength={CLIENT_LIMITS.timezone}
            placeholder="Asia/Dubai"
            aria-invalid={Boolean(errors.timezone)}
            aria-describedby={describedBy(errors.timezone && "crm_client_timezone_error")}
            {...register("timezone")}
          />
          <FieldError
            id="crm_client_timezone_error"
            message={errors.timezone?.message}
          />
        </div>
      </div>
    </WorkspaceFormSection>
  );
}

export function ClientBillingSection({
  register,
  control,
  errors,
}: ClientSectionProps) {
  return (
    <WorkspaceFormSection
      title="Billing defaults"
      description="Set the document defaults that will save time when quotes, invoices, and receipts go out."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="crm_client_billing_email">Billing email</Label>
          <Input
            id="crm_client_billing_email"
            type="email"
            autoComplete="email"
            maxLength={CLIENT_LIMITS.email}
            placeholder="billing@company.com"
            aria-invalid={Boolean(errors.billing_email)}
            aria-describedby={describedBy(
              "crm_client_billing_email_helper",
              errors.billing_email && "crm_client_billing_email_error",
            )}
            {...register("billing_email")}
          />
          <p
            id="crm_client_billing_email_helper"
            className="text-muted-foreground text-xs leading-relaxed"
          >
            Optional. Used when invoices or receipts should go somewhere else.
          </p>
          <FieldError
            id="crm_client_billing_email_error"
            message={errors.billing_email?.message}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="crm_client_currency">Currency</Label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <CurrencySelect
                id="crm_client_currency"
                value={field.value ?? ""}
                onChange={field.onChange}
                allowInherit
                invalid={Boolean(errors.currency)}
              />
            )}
          />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Leave on profile default unless this client works in a different currency.
          </p>
          <FieldError id="crm_client_currency_error" message={errors.currency?.message} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="crm_client_tax_id">Tax ID</Label>
          <Input
            id="crm_client_tax_id"
            autoComplete="off"
            maxLength={CLIENT_LIMITS.tax_id}
            placeholder="TRN, VAT number, GSTIN..."
            aria-invalid={Boolean(errors.tax_id)}
            aria-describedby={describedBy(errors.tax_id && "crm_client_tax_id_error")}
            {...register("tax_id")}
          />
          <FieldError id="crm_client_tax_id_error" message={errors.tax_id?.message} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="crm_client_payment_terms_days">Payment terms</Label>
          <NumberInput
            id="crm_client_payment_terms_days"
            allowDecimal={false}
            min={0}
            max={365}
            placeholder="30"
            aria-invalid={Boolean(errors.payment_terms_days)}
            aria-describedby={describedBy(
              "crm_client_payment_terms_days_helper",
              errors.payment_terms_days && "crm_client_payment_terms_days_error",
            )}
            {...register("payment_terms_days")}
          />
          <p
            id="crm_client_payment_terms_days_helper"
            className="text-muted-foreground text-xs leading-relaxed"
          >
            Optional default days due for this client&apos;s invoices.
          </p>
          <FieldError
            id="crm_client_payment_terms_days_error"
            message={errors.payment_terms_days?.message}
          />
        </div>

        <div className="flex flex-col gap-2 lg:col-span-2">
          <Label htmlFor="crm_client_address">Address</Label>
          <Textarea
            id="crm_client_address"
            rows={3}
            maxLength={CLIENT_LIMITS.address}
            placeholder="Street, city, region..."
            aria-invalid={Boolean(errors.address)}
            aria-describedby={describedBy(errors.address && "crm_client_address_error")}
            {...register("address")}
          />
          <FieldError id="crm_client_address_error" message={errors.address?.message} />
        </div>
      </div>
    </WorkspaceFormSection>
  );
}

export function ClientInternalContextSection({
  register,
  errors,
}: Pick<ClientSectionProps, "register" | "errors">) {
  return (
    <WorkspaceFormSection
      title="Internal context"
      description="Private notes for source, tags, and relationship context. These do not appear on documents."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="crm_client_lead_source">Source</Label>
          <Input
            id="crm_client_lead_source"
            autoComplete="off"
            maxLength={CLIENT_LIMITS.lead_source}
            placeholder="Referral, website, LinkedIn..."
            aria-invalid={Boolean(errors.lead_source)}
            aria-describedby={describedBy(
              errors.lead_source && "crm_client_lead_source_error",
            )}
            {...register("lead_source")}
          />
          <FieldError
            id="crm_client_lead_source_error"
            message={errors.lead_source?.message}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="crm_client_tags">Tags</Label>
          <Input
            id="crm_client_tags"
            autoComplete="off"
            placeholder="VIP, retainer, design"
            aria-invalid={Boolean(errors.tags)}
            aria-describedby={describedBy(
              "crm_client_tags_helper",
              errors.tags && "crm_client_tags_error",
            )}
            {...register("tags")}
          />
          <p
            id="crm_client_tags_helper"
            className="text-muted-foreground text-xs leading-relaxed"
          >
            Separate tags with commas.
          </p>
          <FieldError id="crm_client_tags_error" message={errors.tags?.message} />
        </div>

        <div className="flex flex-col gap-2 lg:col-span-2">
          <Label htmlFor="crm_client_notes">Notes</Label>
          <Textarea
            id="crm_client_notes"
            rows={4}
            maxLength={CLIENT_LIMITS.notes}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={describedBy(errors.notes && "crm_client_notes_error")}
            {...register("notes")}
          />
          <FieldError id="crm_client_notes_error" message={errors.notes?.message} />
        </div>
      </div>
    </WorkspaceFormSection>
  );
}

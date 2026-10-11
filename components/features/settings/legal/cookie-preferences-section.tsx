"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AccountSection } from "@/components/features/settings/account/account-section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateCookiePreferences } from "@/lib/legal/actions";
import { COOKIE_CATEGORIES } from "@/config/legal";
import type { PrivacyProfileFields } from "@/lib/legal/consent-queries";

type Props = {
  profile: PrivacyProfileFields;
};

export function CookiePreferencesSection({ profile }: Props) {
  const [analytics, setAnalytics] = useState(profile.cookie_analytics);
  const [marketing, setMarketing] = useState(profile.cookie_marketing);
  const [pending, setPending] = useState(false);

  async function onSave() {
    setPending(true);
    try {
      const result = await updateCookiePreferences({ analytics, marketing });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Cookie preferences saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AccountSection
      title="Cookie preferences"
      description="Choose which optional cookies we may use. Essential cookies are always active for sign-in and core features."
    >
      <div className="flex max-w-lg flex-col gap-4">
        {COOKIE_CATEGORIES.map((category) => {
          const isEssential = category.required;
          const checked =
            category.id === "essential"
              ? true
              : category.id === "analytics"
                ? analytics
                : marketing;
          const onCheckedChange =
            category.id === "analytics"
              ? setAnalytics
              : category.id === "marketing"
                ? setMarketing
                : undefined;

          return (
            <div
              key={category.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
            >
              <div className="flex flex-col gap-1">
                <Label htmlFor={`cookie-${category.id}`} className="text-sm font-medium">
                  {category.label}
                </Label>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
              <Switch
                id={`cookie-${category.id}`}
                checked={checked}
                disabled={isEssential || pending}
                onCheckedChange={onCheckedChange}
                aria-readonly={isEssential}
              />
            </div>
          );
        })}

        {profile.cookie_updated_at ? (
          <p className="text-xs text-muted-foreground">
            Last updated{" "}
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(profile.cookie_updated_at))}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="w-fit"
        >
          {pending ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </AccountSection>
  );
}

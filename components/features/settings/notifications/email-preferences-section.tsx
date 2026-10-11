"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AccountSection } from "@/components/features/settings/account/account-section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  NOTIFICATION_EMAIL_CATALOG,
  NOTIFICATION_EMAIL_CATEGORY_LABELS,
  type NotificationEmailCategory,
} from "@/config/notifications";
import { updateNotificationEmailPrefs } from "@/lib/notifications/prefs-actions";
import type { NotificationEmailPrefsProfile } from "@/lib/notifications/prefs-queries";
import type { NotificationEmailEventKey } from "@/lib/validations/notification-prefs";

type Props = {
  profile: NotificationEmailPrefsProfile;
};

const CATEGORY_ORDER: NotificationEmailCategory[] = [
  "payments",
  "client_responses",
  "document_activity",
];

export function EmailPreferencesSection({ profile }: Props) {
  const [prefs, setPrefs] = useState(profile.prefs);
  const [pending, setPending] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<NotificationEmailCategory, typeof NOTIFICATION_EMAIL_CATALOG>();
    for (const category of CATEGORY_ORDER) {
      map.set(
        category,
        NOTIFICATION_EMAIL_CATALOG.filter((item) => item.category === category),
      );
    }
    return map;
  }, []);

  function setEventPref(id: NotificationEmailEventKey, enabled: boolean) {
    setPrefs((current) => ({ ...current, [id]: enabled }));
  }

  async function onSave() {
    setPending(true);
    try {
      const result = await updateNotificationEmailPrefs({ prefs });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Notification preferences saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AccountSection
      title="Email notifications"
      description="Choose which business events send a backup email to your inbox. In-app notifications in the bell drawer are always on."
    >
      <div className="flex w-full flex-col gap-8">
        {CATEGORY_ORDER.map((category) => {
          const items = grouped.get(category) ?? [];
          if (items.length === 0) return null;

          return (
            <div key={category} className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-foreground">
                {NOTIFICATION_EMAIL_CATEGORY_LABELS[category]}
              </h3>
              <div className="flex flex-col gap-3">
                {items.map((item) => {
                  const switchId = `notify-email-${item.id}`;
                  const disabled = pending || !item.emailSupported;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <Label htmlFor={switchId} className="text-sm font-medium">
                          {item.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                        {!item.emailSupported ? (
                          <p className="text-xs text-muted-foreground">
                            Coming soon — your preference will apply when overdue
                            alerts ship.
                          </p>
                        ) : null}
                      </div>
                      <Switch
                        id={switchId}
                        checked={prefs[item.id]}
                        disabled={disabled}
                        onCheckedChange={(checked) => setEventPref(item.id, checked)}
                        className="shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {profile.notification_email_updated_at ? (
          <p className="text-xs text-muted-foreground">
            Last updated{" "}
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(profile.notification_email_updated_at))}
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

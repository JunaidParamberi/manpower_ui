import type { Metadata } from "next";
import type { ReactNode } from "react";

import { sectionTitleTemplate } from "@/lib/metadata";
import { SettingsTabs } from "@/components/features/settings/settings-tabs";
import { PAGE_TITLE_CLASS } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: {
    default: "Settings",
    template: sectionTitleTemplate("Settings"),
  },
};

export default function SettingsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-col gap-1 pb-6">
        <h1 className={PAGE_TITLE_CLASS}>Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace preferences and account details.
        </p>
      </div>
      <SettingsTabs />
      <div className="pt-8">{children}</div>
    </div>
  );
}

import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getUserInitials } from "@/lib/dashboard/user-display";
import { getRequiredOnboardingPath } from "@/lib/onboarding/status";
import {
  getUnreadNotificationCount,
  listNotificationsForUser,
} from "@/lib/notifications/notification-queries";
import { getProfile } from "@/lib/profile/actions";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type { PlanUsage } from "@/lib/plan-usage/helpers";
import type { PlanTier } from "@/config/plans";
import { getPinnedItems } from "@/lib/pinned/queries";
import { getNavLayout } from "@/lib/layout/nav-queries";
import { needsLegalAcceptance } from "@/lib/legal/consent-queries";
import { getOpenTaskCountForUser } from "@/lib/tasks/task-count-queries";
import {
  getClientCountForUser,
  getDocCountThisMonthForUser,
} from "@/lib/dashboard/shell-count-queries";

export default async function AppShellLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const result = await getProfile();

  if (!result.ok) {
    redirect("/auth/login");
  }

  if (result.profile === null) {
    redirect("/auth/login");
  }

  const nextOnboarding = getRequiredOnboardingPath(result.profile);
  if (nextOnboarding !== null) {
    redirect(nextOnboarding);
  }

  const { user } = await getServerContext();

  const userEmail = user?.email ?? null;
  const userInitials = getUserInitials(result.profile.full_name, userEmail);

  const [
    clientCount,
    docCountThisMonth,
    openTaskCount,
    notifications,
    unreadCount,
    pinnedItems,
    navLayout,
    legalAcceptanceRequired,
  ] = await Promise.all([
    getClientCountForUser(),
    getDocCountThisMonthForUser(),
    getOpenTaskCountForUser(),
    listNotificationsForUser(50),
    getUnreadNotificationCount(),
    getPinnedItems(),
    getNavLayout(),
    needsLegalAcceptance(),
  ]);

  const planUsage: PlanUsage = {
    planTier: (result.profile.plan_tier ?? "free") as PlanTier,
    clientCount,
    docCountThisMonth,
  };

  const userName = result.profile.full_name ?? null;

  const cookieStore = await cookies();
  const sidebarDefaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const sidebarWidthCookie = Number(cookieStore.get("shell_sidebar_w")?.value);
  const sidebarDefaultWidth = Number.isFinite(sidebarWidthCookie) && sidebarWidthCookie > 0
    ? sidebarWidthCookie
    : undefined;
  const aiWidthCookie = Number(cookieStore.get("shell_ai_w")?.value);
  const aiDefaultWidth = Number.isFinite(aiWidthCookie) && aiWidthCookie > 0
    ? aiWidthCookie
    : undefined;

  return (
    <DashboardShell
      userEmail={userEmail}
      userName={userName}
      userInitials={userInitials}
      planUsage={planUsage}
      notifications={notifications}
      unreadCount={unreadCount}
      openTaskCount={openTaskCount}
      pinnedItems={pinnedItems}
      navLayout={navLayout}
      sidebarDefaultOpen={sidebarDefaultOpen}
      sidebarDefaultWidth={sidebarDefaultWidth}
      aiDefaultWidth={aiDefaultWidth}
      needsLegalAcceptance={legalAcceptanceRequired}
    >
      {children}
    </DashboardShell>
  );
}

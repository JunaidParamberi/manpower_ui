import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";

import { isPlanAtLeast } from "@/config/plans";
import { ApiKeysManager } from "@/components/features/settings/api/api-keys-manager";
import { ApiUpgradePrompt } from "@/components/features/settings/api/api-upgrade-prompt";
import { McpConnectPanel } from "@/components/features/settings/api/mcp-connect-panel";
import { McpConnectionsList } from "@/components/features/settings/api/mcp-connections-list";
import { MCP_RESOURCE } from "@/lib/api/external/oauth-metadata";
import { getApiKeysForUser } from "@/lib/api-keys/api-key-queries";
import { getMcpConnectionsForUser } from "@/lib/mcp/connection-queries";
import { getProfile } from "@/lib/profile/actions";
import { getServerContext } from "@/lib/supabase/get-server-context";

export const metadata: Metadata = { title: "API & integrations" };

export default async function SettingsApiPage() {
  const { user } = await getServerContext();
  if (!user) redirect("/auth/login");

  const [profileResult, connections] = await Promise.all([
    getProfile(),
    getMcpConnectionsForUser(user.id),
  ]);
  const planTier = profileResult.ok ? profileResult.profile?.plan_tier ?? "free" : "free";
  const hasApiKeys = isPlanAtLeast(planTier, "pro");
  const keys = hasApiKeys ? await getApiKeysForUser(user.id) : [];

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <McpConnectPanel connectorUrl={MCP_RESOURCE} />
        <McpConnectionsList initialConnections={connections} />
      </section>

      <section className="flex flex-col gap-4">
        {hasApiKeys ? (
          <>
            <div className="flex items-center justify-end">
              <Link
                href="/settings/api/docs"
                className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <BookOpen className="size-3.5" />
                Developer docs
              </Link>
            </div>
            <ApiKeysManager initialKeys={keys} />
          </>
        ) : (
          <>
            <h2 className="font-heading text-base font-semibold text-foreground">API keys</h2>
            <ApiUpgradePrompt />
          </>
        )}
      </section>
    </div>
  );
}

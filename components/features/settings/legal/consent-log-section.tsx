"use client";

import { AccountSection } from "@/components/features/settings/account/account-section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatConsentActionLabel,
  formatConsentTypeLabel,
} from "@/lib/legal/consent-log";
import type { ConsentLogRow } from "@/types";

type Props = {
  entries: ConsentLogRow[];
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ConsentLogSection({ entries }: Props) {
  return (
    <AccountSection
      title="Consent log"
      description="A read-only record of when you accepted policies or changed cookie preferences."
    >
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No consent events recorded yet. Accepting terms or saving cookie preferences
          will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(entry.created_at)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatConsentTypeLabel(entry.consent_type)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatConsentActionLabel(entry.action)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.policy_version ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AccountSection>
  );
}

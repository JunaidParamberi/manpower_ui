import Link from "next/link";

import { formatLastUpdated } from "@/lib/clients/display";
import type { ClientRow } from "@/types";
import { ClientPinnedNote } from "@/components/features/clients/detail/client-pinned-note";
import { ClientSection, SECTION_LINK } from "@/components/features/clients/detail/client-section";

function localTime(timezone: string, now: Date): string | null {
  try {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(now);
  } catch {
    return null;
  }
}

export function clientAboutRows(client: ClientRow, now: Date = new Date()): Array<[string, string]> {
  const rows: Array<[string, string | null]> = [
    ["Contact", client.contact_name],
    ["Email", client.email],
    ["Billing email", client.billing_email],
    ["Phone", client.phone],
    ["Website", client.website],
    [
      "Timezone",
      client.timezone ? [client.timezone, localTime(client.timezone, now)].filter(Boolean).join(" · ") : null,
    ],
    ["Address", client.address],
    ["Tax number", client.tax_id],
    ["Payment terms", client.payment_terms_days !== null ? `${client.payment_terms_days} days` : null],
    ["Lead source", client.lead_source],
    ["Tags", client.tags.length > 0 ? client.tags.join(", ") : null],
  ];
  return rows.filter((r): r is [string, string] => Boolean(r[1]?.trim()));
}

/** Reference details for a client: contact and billing details, the portal link and the pinned note. The About tab of the client detail. */
export function ClientAbout({ client }: { client: ClientRow }) {
  const rows = clientAboutRows(client);
  const updated = formatLastUpdated(client.updated_at);

  return (
    <div className="grid min-w-0 flex-1 content-start pb-10 @3xl/shell:grid-cols-2 @3xl/shell:content-stretch @3xl/shell:pb-0">
      <ClientSection
        title="Details"
        action={
          <Link href={`/clients/${client.id}/edit`} className={SECTION_LINK}>
            Edit
          </Link>
        }
      >
        {rows.length === 0 ? (
          <p className="py-2.5 text-body text-[var(--fg-3)]">No details yet.</p>
        ) : (
          <dl className="divide-y divide-border">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[112px_minmax(0,1fr)] items-baseline gap-3 py-2.5">
                <dt className="text-meta text-[var(--fg-3)]">{label}</dt>
                <dd className="min-w-0 text-body [overflow-wrap:anywhere]">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </ClientSection>
      {/* Column divider when side by side; a full-width line when stacked. */}
      <div className="mt-5 min-w-0 divide-y divide-border border-t border-border @3xl/shell:mt-0 @3xl/shell:border-t-0 @3xl/shell:border-l @3xl/shell:pb-10 [&>*]:pb-5">
        {client.notes?.trim() ? (
          <ClientPinnedNote
            notes={client.notes}
            editHref={`/clients/${client.id}/edit`}
            updatedAtLabel={updated ? `Last updated ${updated}` : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}

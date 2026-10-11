import Link from "next/link";

import type { ClientActivityItem } from "@/lib/clients/client-activity";
import { ClientSection, ClientSectionEmpty } from "@/components/features/clients/detail/client-section";

type ClientActivityTimelineProps = {
  items: ClientActivityItem[];
};

const ROW = "group flex items-center gap-3 py-2.5";

function formatActivityDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value));
}

/** Recent client, project and document changes as dated rows. The Activity tab of the client detail. */
export function ClientActivityTimeline({ items }: ClientActivityTimelineProps) {
  return (
    <ClientSection title="Activity">
      {items.length === 0 ? (
        <ClientSectionEmpty>Activity shows up here as projects and documents change.</ClientSectionEmpty>
      ) : (
        items.slice(0, 20).map((item) => {
          const content = (
            <>
              <time className="w-14 shrink-0 text-meta tabular-nums text-[var(--fg-3)]">
                {formatActivityDate(item.occurredAt)}
              </time>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body text-foreground group-hover:underline">{item.title}</span>
                <span className="block truncate text-meta text-[var(--fg-3)]">{item.description}</span>
              </span>
            </>
          );
          return item.href ? (
            <Link key={item.id} href={item.href} className={ROW}>
              {content}
            </Link>
          ) : (
            <div key={item.id} className={ROW}>
              {content}
            </div>
          );
        })
      )}
    </ClientSection>
  );
}

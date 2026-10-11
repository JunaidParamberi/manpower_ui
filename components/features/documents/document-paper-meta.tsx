import { Fragment } from "react";

import type { VariableContext } from "@/lib/documents/variables";

const C = { ink: "#0f0f0f", muted: "#6b7280" } as const;

const LABEL_CLASS =
  "text-[0.6rem] font-semibold uppercase tracking-[0.18em] mb-1.5" as const;
const VALUE_CLASS = "text-sm leading-relaxed" as const;

type DocumentPaperMetaProps = {
  sender: VariableContext["sender"];
  client: VariableContext["client"];
  issuedDate: string;
  detailRows: Array<{ label: string; value: string }>;
};

function AddressBlock({
  lines,
}: {
  lines: Array<string | null | undefined>;
}) {
  const filtered = lines.filter(Boolean) as string[];
  if (filtered.length === 0) return null;
  return (
    <>
      {filtered.map((line, i) => (
        <span key={i} className="block" style={{ color: C.ink }}>
          {line}
        </span>
      ))}
    </>
  );
}

export function DocumentPaperMeta({
  sender,
  client,
  issuedDate,
  detailRows,
}: DocumentPaperMetaProps) {
  return (
    <div
      className="flex flex-col sm:flex-row gap-6 px-8 py-5 border-b"
      style={{
        background: "rgba(0,0,0,0.02)",
        borderBottomColor: "rgba(0,0,0,0.08)",
      }}
    >
      {/* From */}
      <div className="flex-1 min-w-0">
        <p className={LABEL_CLASS} style={{ color: C.muted }}>
          From
        </p>
        {sender ? (
          <div className={VALUE_CLASS}>
            {sender.company_name && (
              <span className="block font-semibold" style={{ color: C.ink }}>
                {sender.company_name}
              </span>
            )}
            <AddressBlock
              lines={[
                sender.name && sender.name !== sender.company_name
                  ? sender.name
                  : null,
                sender.address_line1,
                sender.address_line2,
                [sender.city, sender.region, sender.postal_code]
                  .filter(Boolean)
                  .join(", ") || null,
                sender.country,
                sender.email,
                sender.vat_number ? `VAT: ${sender.vat_number}` : null,
              ]}
            />
          </div>
        ) : (
          <p className="text-xs italic" style={{ color: C.muted }}>
            Your business details not set — add in Settings &gt; Profile
          </p>
        )}
      </div>

      {/* To */}
      <div className="flex-1 min-w-0">
        <p className={LABEL_CLASS} style={{ color: C.muted }}>
          To
        </p>
        {client ? (
          <div className={VALUE_CLASS}>
            {client.company && (
              <span className="block font-semibold" style={{ color: C.ink }}>
                {client.company}
              </span>
            )}
            <AddressBlock
              lines={[
                client.contact_name ??
                  (client.name !== client.company ? client.name : null),
                client.address,
                client.email,
                client.phone,
              ]}
            />
          </div>
        ) : null}
      </div>

      {/* Details */}
      <div className="sm:min-w-[10rem]">
        <p className={LABEL_CLASS} style={{ color: C.muted }}>
          Details
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          {/* Issued date always first */}
          <dt className="text-[0.65rem] font-medium uppercase tracking-widest" style={{ color: C.muted }}>
            Issued
          </dt>
          <dd className="text-sm" style={{ color: C.ink }}>
            {issuedDate}
          </dd>

          {detailRows.map(({ label, value }, idx) => (
            <Fragment key={`row-${idx}-${label}`}>
              <dt
                className="text-[0.65rem] font-medium uppercase tracking-widest"
                style={{ color: C.muted }}
              >
                {label}
              </dt>
              <dd className="text-sm" style={{ color: C.ink }}>
                {value}
              </dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </div>
  );
}

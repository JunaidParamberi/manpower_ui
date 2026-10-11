import type { SheetBrand, SheetSender } from "./types";
import { DocBrandmark } from "./doc-brandmark";
import { DocStatusPill } from "./doc-status-pill";

type DocHeaderProps = {
  brand: SheetBrand | null;
  sender: SheetSender | null;
  docType: string;
  docNumber: string | null;
  docNumberSub?: string | null;
  /** Replaces the plain number text, e.g. with an inline editor. */
  docNumberSlot?: React.ReactNode;
  status?: string | null;
  statusVariant?: "default" | "success" | "warn" | "accent";
};

export function DocHeader({
  brand,
  sender,
  docType,
  docNumber,
  docNumberSub,
  docNumberSlot,
  status,
  statusVariant = "accent",
}: DocHeaderProps) {
  const orgName = brand?.businessName ?? sender?.companyName ?? null;
  const metaLines = [
    sender?.name ?? null,
    sender?.email ?? brand?.email ?? null,
    [sender?.addressLine1, sender?.city, sender?.country].filter(Boolean).join(", ") || null,
  ].filter(Boolean) as string[];

  return (
    <div className="doc-header">
      <div className="doc-header__brand">
        <DocBrandmark
          logoUrl={brand?.logoUrl ?? null}
          businessName={orgName}
          primaryColor={brand?.primaryColor ?? null}
        />
        <div>
          {orgName && <div className="doc-header__org">{orgName}</div>}
          {metaLines.length > 0 && (
            <div className="doc-header__meta">
              {metaLines.map((line, i) => (
                <span key={i}>{i > 0 && " · "}{line}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="doc-header__right">
        <div className="doc-type">{docType}</div>
        {docNumberSlot ? (
          <div className="doc-type-sub">{docNumberSlot}</div>
        ) : docNumber ? (
          <div className="doc-type-sub">
            {docNumber}{docNumberSub ? ` ${docNumberSub}` : ""}
          </div>
        ) : null}
        {status && (
          <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
            <DocStatusPill label={status} variant={statusVariant} dot />
          </div>
        )}
      </div>
    </div>
  );
}

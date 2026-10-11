import type { LineItemRow } from "@/types";
import { DocLineItems } from "./doc-line-items";
import { DocTotals } from "./doc-totals";
import { DocumentSheet } from "./document-sheet";
import type { SheetTotals } from "./types";

type ProposalPricingSheetProps = {
  lineItems: LineItemRow[];
  totals: SheetTotals;
  currency: string;
  proposalNumber: string | null;
  accentColor?: string | null;
};

/**
 * The priced scope of a proposal as its own page of paper — shown to clients
 * under the cover and content on the public proposal page. Totals come from
 * `computeSheetTotals`, like every other sheet.
 */
export function ProposalPricingSheet({
  lineItems,
  totals,
  currency,
  proposalNumber,
  accentColor,
}: ProposalPricingSheetProps) {
  const items = lineItems.map((item) => ({
    id: item.id,
    description: item.description ?? "",
    subDescription: null,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    taxRate: Number(item.tax_rate ?? 0),
    hsnSac: item.hsn_sac_code ?? null,
  }));

  return (
    <DocumentSheet accentColor={accentColor}>
      <div className="doc-header">
        <div className="doc-header__brand">
          <div className="doc-type">Investment</div>
        </div>
        {proposalNumber ? (
          <div className="doc-header__right">
            <div className="doc-type-sub">{proposalNumber}</div>
          </div>
        ) : null}
      </div>
      <DocLineItems items={items} descHeader="Scope" amountHeader="Subtotal" />
      <DocTotals totals={totals} currency={currency} grandLabel={`Total ${currency}`} />
    </DocumentSheet>
  );
}

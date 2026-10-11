import type { SheetLineItem } from "./types";
import { formatSheetAmount } from "./types";

type DocLineItemsProps = {
  items: SheetLineItem[];
  descHeader?: string;
  amountHeader?: string;
  /** statusMode: last col shows "Delivered" text (green) instead of amount */
  statusMode?: boolean;
  /** formatCol: custom format for last col per item (overrides default) */
  amountColor?: string;
};

export function DocLineItems({
  items,
  descHeader = "Description",
  amountHeader = "Amount",
  statusMode = false,
}: DocLineItemsProps) {
  const showHsn = items.some((i) => i.hsnSac);

  return (
    <table className="items">
      <thead>
        <tr>
          <th>{descHeader}</th>
          {showHsn && <th className="r">HSN/SAC</th>}
          <th className="r">Qty</th>
          <th className="r">Rate</th>
          <th className="r">{amountHeader}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const amount = item.quantity * item.unitPrice;
          return (
            <tr key={item.id}>
              <td>
                <div className="desc-title">
                  {item.description}
                  {item.isOptional && <span className="optional-tag">Optional</span>}
                </div>
                {item.subDescription && <div className="desc-sub">{item.subDescription}</div>}
              </td>
              {showHsn && <td className="r">{item.hsnSac ?? "—"}</td>}
              <td className="qty">{item.quantity}</td>
              <td className="rate">{formatSheetAmount(item.unitPrice)}</td>
              <td
                className="total"
                style={item.isOptional ? { color: "#898E96" } : undefined}
              >
                {statusMode ? (
                  <span style={{ color: "#1F8A52", fontWeight: 500 }}>Delivered</span>
                ) : item.isOptional ? (
                  `+${formatSheetAmount(amount)}`
                ) : (
                  formatSheetAmount(amount)
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

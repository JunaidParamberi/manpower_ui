import type { SheetPaymentInstruction } from "./types";

type DocFooterProps = {
  leftTitle: string;
  leftContent?: React.ReactNode;
  paymentInstructions?: SheetPaymentInstruction[];
  rightTitle: string;
  rightContent?: React.ReactNode;
};

export function DocFooter({
  leftTitle,
  leftContent,
  paymentInstructions,
  rightTitle,
  rightContent,
}: DocFooterProps) {
  return (
    <div className="doc-footer">
      <div>
        <h4>{leftTitle}</h4>
        {paymentInstructions?.map((row, i) => (
          <div className="pay-line" key={i}>
            <span className="dim">{row.label}</span>
            <span className={row.isMono ? "v mono" : "v"}>{row.value}</span>
          </div>
        ))}
        {leftContent}
      </div>
      <div>
        <h4>{rightTitle}</h4>
        {rightContent}
      </div>
    </div>
  );
}

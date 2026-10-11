import type { SheetSignature } from "./types";

type DocSignaturesProps = {
  signatures: [SheetSignature, SheetSignature];
};

export function DocSignatures({ signatures }: DocSignaturesProps) {
  return (
    <div className="signatures">
      {signatures.map((sig, i) => (
        <div key={i}>
          <div className="signature__label">{sig.label}</div>
          <div className={sig.isSigned ? "signature__line signed" : "signature__line"} />
          <div className="signature__name">
            {sig.name}{sig.role ? ` — ${sig.role}` : ""}
          </div>
          <div className="signature__date">{sig.date ?? "__ / __ / ____"}</div>
        </div>
      ))}
    </div>
  );
}

type PartyColumn = {
  label: string;
  name?: string | null;
  lines?: string[];
  detailsGrid?: Array<{ label: string; value: string; mono?: boolean; bold?: boolean }>;
};

type DocPartiesProps = {
  columns: PartyColumn[];
  layout?: "3col" | "2col";
};

export function DocParties({ columns, layout = "3col" }: DocPartiesProps) {
  const gridStyle = layout === "2col" ? { gridTemplateColumns: "1fr 1fr" } : undefined;
  return (
    <div className="parties" style={gridStyle}>
      {columns.map((col, i) => (
        <div key={i}>
          <div className="party__label">{col.label}</div>
          {col.detailsGrid ? (
            <div className="details-grid">
              {col.detailsGrid.map((row, j) => (
                <div className="row" key={j}>
                  <span className="dim">{row.label}</span>
                  <span
                    className={row.mono ? "mono tabular" : "tabular"}
                    style={row.bold ? { fontWeight: 500 } : undefined}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <>
              {col.name && <div className="party__name">{col.name}</div>}
              {col.lines && col.lines.length > 0 && (
                <div className="party__line">
                  {col.lines.map((line, j) => (
                    <span key={j} style={{ display: "block" }}>{line}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

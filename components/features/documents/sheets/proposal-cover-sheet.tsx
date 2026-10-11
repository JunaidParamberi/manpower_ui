import type { VariableContext } from "@/lib/documents/variables";
import { DocBrandmark } from "./doc-brandmark";
import { DocPageMarker } from "./doc-page-marker";

type ProposalCoverSheetProps = {
  variableContext: VariableContext;
  proposalNumber: string | null;
  version?: number | null;
  headline: string;
  headlineAccent?: string | null; // word/phrase to render in blue italic
  subhead?: string | null;
  clientName?: string | null;
  projectName?: string | null;
  investmentRange?: string | null;
  preparedByName: string | null;
  preparedByRole?: string | null;
  issuedDate: string;
  validDays?: number;
  totalPages?: number;
};

export function ProposalCoverSheet({
  variableContext,
  proposalNumber,
  version,
  headline,
  headlineAccent,
  subhead,
  clientName,
  projectName,
  investmentRange,
  preparedByName,
  preparedByRole,
  issuedDate,
  validDays = 30,
  totalPages = 2,
}: ProposalCoverSheetProps) {
  const { brand, sender } = variableContext;
  const orgName = brand?.business_name ?? sender?.company_name ?? null;
  const initials = preparedByName
    ? preparedByName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // Replace accent text in headline
  const headlineNode = headlineAccent && headline.includes(headlineAccent) ? (
    <>
      {headline.split(headlineAccent)[0]}
      <em style={{ fontStyle: "normal", color: "var(--sheet-accent, #3550E0)" }}>{headlineAccent}</em>
      {headline.split(headlineAccent)[1]}
    </>
  ) : headline;

  return (
    <div className="sheet-canvas">
    <div className="sheet sheet--cover">
      <div className="cover">
        <div className="cover__top">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <DocBrandmark
              logoUrl={brand?.logo_url ?? null}
              businessName={orgName}
              primaryColor={brand?.primary_color ?? null}
            />
            {orgName && (
              <div style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: "-0.012em" }}>
                {orgName}
              </div>
            )}
          </div>
          {proposalNumber && (
            <div className="cover__id">
              {proposalNumber}{version && version > 1 ? ` · v${version}` : ""}
            </div>
          )}
        </div>

        <div className="cover__body">
          {clientName && (
            <div className="cover__eyebrow">Proposal · Prepared for {clientName}</div>
          )}
          <h1 className="cover__title">{headlineNode}</h1>
          {subhead && <div className="cover__sub">{subhead}</div>}

          <div className="cover__meta">
            {clientName && (
              <div>
                <div className="k">Client</div>
                <div className="v">{clientName}</div>
              </div>
            )}
            {projectName && (
              <div>
                <div className="k">Project</div>
                <div className="v">{projectName}</div>
              </div>
            )}
            {investmentRange && (
              <div>
                <div className="k">Investment</div>
                <div className="v">{investmentRange}</div>
              </div>
            )}
          </div>
        </div>

        <div className="cover__bottom">
          <div className="cover__from">
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "linear-gradient(135deg, #3550E0, #6E83F0)",
              display: "grid", placeItems: "center", color: "#fff",
              fontWeight: 600, fontSize: 13,
            }}>
              {initials}
            </div>
            <div>
              {preparedByName && <div className="name">{preparedByName}</div>}
              {preparedByRole && <div className="role">{preparedByRole}</div>}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#898E96", fontFamily: "JetBrains Mono, monospace" }}>
            Issued {issuedDate}<br />
            Valid {validDays} days
          </div>
        </div>
      </div>
      <DocPageMarker left="" right={`Page 1 of ${totalPages}`} />
    </div>
    </div>
  );
}

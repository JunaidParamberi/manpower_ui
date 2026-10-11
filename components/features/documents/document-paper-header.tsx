const C = { ink: "#0f0f0f", muted: "#6b7280" } as const;

type DocumentPaperHeaderProps = {
  logoUrl: string | null;
  businessName: string | null;
  primaryColor: string;
  docTypeLabel: string;
  docTitle: string;
  docNumber: string | null;
};

export function DocumentPaperHeader({
  logoUrl,
  businessName,
  primaryColor,
  docTypeLabel,
  docTitle,
  docNumber,
}: DocumentPaperHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      {/* Left: logo or business name */}
      <div className="flex-shrink-0">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={businessName ?? "Business logo"}
            className="h-8 w-auto object-contain"
          />
        ) : (
          <span
            className="font-semibold text-base leading-tight"
            style={{ color: primaryColor || C.ink }}
          >
            {businessName ?? "Your Business"}
          </span>
        )}
      </div>

      {/* Right: doc type + title + number */}
      <div className="text-right flex flex-col gap-0.5">
        <p
          className="text-[0.6rem] font-semibold uppercase tracking-[0.18em]"
          style={{ color: C.muted }}
        >
          {docTypeLabel}
        </p>
        <p className="font-semibold text-lg leading-tight" style={{ color: C.ink }}>
          {docTitle}
        </p>
        {docNumber && (
          <p
            className="font-mono text-xs leading-tight"
            style={{ color: C.muted }}
          >
            {docNumber}
          </p>
        )}
      </div>
    </div>
  );
}

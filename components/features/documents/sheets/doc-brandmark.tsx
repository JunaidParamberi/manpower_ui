type DocBrandmarkProps = {
  logoUrl: string | null;
  businessName: string | null;
  inverted?: boolean;
  primaryColor?: string | null;
};

export function DocBrandmark({
  logoUrl,
  businessName,
  inverted,
  primaryColor,
}: DocBrandmarkProps) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logoUrl}
        alt={businessName ?? "Logo"}
        style={{ width: 38, height: 38, objectFit: "contain", borderRadius: 9 }}
      />
    );
  }
  const letter = businessName?.trim().charAt(0).toUpperCase() ?? "?";
  const accent = primaryColor ?? "#3550E0";
  return (
    <div
      className="brandmark"
      style={
        inverted
          ? { background: "#fff", color: "#14161A" }
          : { background: accent, color: "#fff" }
      }
    >
      {letter}
    </div>
  );
}

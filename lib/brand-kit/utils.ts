const BUCKET = "brand-logos";
const MARKER = `/storage/v1/object/public/${BUCKET}/`;

export function extractLogoStoragePath(publicUrl: string): string | null {
  const idx = publicUrl.indexOf(MARKER);
  if (idx === -1) return null;
  const path = publicUrl.slice(idx + MARKER.length);
  return path.length > 0 ? path : null;
}

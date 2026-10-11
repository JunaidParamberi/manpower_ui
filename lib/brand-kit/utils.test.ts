import { describe, expect, it } from "vitest";

import { extractLogoStoragePath } from "@/lib/brand-kit/utils";

describe("extractLogoStoragePath", () => {
  it("extracts path from valid Supabase public URL", () => {
    const url =
      "https://abcdef.supabase.co/storage/v1/object/public/brand-logos/user-123/abc-uuid.png";
    expect(extractLogoStoragePath(url)).toBe("user-123/abc-uuid.png");
  });

  it("returns null for unrelated URL", () => {
    expect(extractLogoStoragePath("https://example.com/logo.png")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractLogoStoragePath("")).toBeNull();
  });

  it("returns null when path segment is empty after marker", () => {
    const url =
      "https://abcdef.supabase.co/storage/v1/object/public/brand-logos/";
    expect(extractLogoStoragePath(url)).toBeNull();
  });

  it("preserves nested path with extension", () => {
    const url =
      "https://proj.supabase.co/storage/v1/object/public/brand-logos/uid/some-file.webp";
    expect(extractLogoStoragePath(url)).toBe("uid/some-file.webp");
  });
});

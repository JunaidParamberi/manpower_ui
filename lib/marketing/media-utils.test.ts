import { describe, expect, it } from "vitest";
import { buildMediaPath, mediaFolderOwner } from "./media-utils";

describe("media path", () => {
  it("prefixes the user id folder and keeps a safe name", () => {
    const p = buildMediaPath("user-123", "My Photo!.png");
    expect(p.startsWith("user-123/")).toBe(true);
    expect(p).toMatch(/^user-123\/[^/]+-my-photo\.png$/i);
  });

  it("extracts the owner folder", () => {
    expect(mediaFolderOwner("user-123/abc-photo.png")).toBe("user-123");
  });
});

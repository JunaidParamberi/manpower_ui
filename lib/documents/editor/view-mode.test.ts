import { describe, expect, it } from "vitest";
import { pickMode } from "./view-mode";

describe("pickMode", () => {
  it("opens a draft in the editor", () => {
    expect(pickMode({ isDraft: true, wantEdit: false, wantRead: false, canEditWhenSent: false })).toBe("edit");
  });
  it("shows a draft you finished with Done as the finished document", () => {
    expect(pickMode({ isDraft: true, wantEdit: false, wantRead: true, canEditWhenSent: false })).toBe("read");
  });
  it("opens a sent document read-only", () => {
    expect(pickMode({ isDraft: false, wantEdit: false, wantRead: false, canEditWhenSent: true })).toBe("read");
  });
  it("edits a sent document only when asked and allowed", () => {
    expect(pickMode({ isDraft: false, wantEdit: true, wantRead: false, canEditWhenSent: true })).toBe("edit");
    expect(pickMode({ isDraft: false, wantEdit: true, wantRead: false, canEditWhenSent: false })).toBe("read");
  });
});

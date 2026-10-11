import { describe, expect, it } from "vitest";

import { POST_STATUSES } from "@/lib/validations/content-post";
import {
  postStatusDotClass,
  postStatusLabel,
} from "@/lib/marketing/post-display";

describe("postStatusDotClass", () => {
  it("returns a distinct dot class for every status", () => {
    const classes = POST_STATUSES.map((status) => postStatusDotClass(status));
    expect(new Set(classes).size).toBe(POST_STATUSES.length);
  });

  it("returns a tailwind background class for each known status", () => {
    for (const status of POST_STATUSES) {
      expect(postStatusDotClass(status)).toMatch(/^bg-/);
    }
  });
});

describe("postStatusLabel", () => {
  it("returns a human label for every status", () => {
    for (const status of POST_STATUSES) {
      expect(postStatusLabel(status).length).toBeGreaterThan(0);
    }
  });
});

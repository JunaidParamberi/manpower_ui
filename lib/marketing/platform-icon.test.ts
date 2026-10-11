import { FaGlobe, FaInstagram, FaLinkedin } from "react-icons/fa6";
import { describe, expect, it } from "vitest";

import { COMMON_PLATFORMS, platformIcon } from "./platform-icon";

describe("platformIcon", () => {
  it("maps known platforms case-insensitively", () => {
    expect(platformIcon("Instagram")).toBe(FaInstagram);
    expect(platformIcon("instagram")).toBe(FaInstagram);
    expect(platformIcon("  LinkedIn  ")).toBe(FaLinkedin);
  });

  it("falls back to a globe for anything unknown", () => {
    expect(platformIcon("Mastodon")).toBe(FaGlobe);
    expect(platformIcon("")).toBe(FaGlobe);
  });

  it("has an icon for every common platform offered in the UI", () => {
    for (const platform of COMMON_PLATFORMS) {
      expect(platformIcon(platform)).not.toBe(FaGlobe);
    }
  });
});

import { describe, expect, it } from "vitest";
import {
  BASE_CONTENT_H,
  CONTENT_H_EPSILON,
  CONTENT_W,
  calculateDocumentPageCount,
} from "./document-page-body";

describe("calculateDocumentPageCount", () => {
  it("subtracts the repeated header height from each page before counting pages", () => {
    const headerHeight = 120;
    const contentHeight = BASE_CONTENT_H - headerHeight + 1;

    expect(calculateDocumentPageCount(contentHeight, headerHeight)).toBe(2);
  });

  it("keeps empty or tiny documents to a single page", () => {
    expect(calculateDocumentPageCount(0, 0)).toBe(1);
    expect(calculateDocumentPageCount(1, BASE_CONTENT_H + 100)).toBe(1);
  });

  it("uses measured column overflow when avoided breaks require extra pages", () => {
    expect(
      calculateDocumentPageCount(BASE_CONTENT_H * 2, 0, CONTENT_W * 3),
    ).toBe(3);
  });

  it("rounds up when content is within CONTENT_H_EPSILON of the boundary (sub-pixel regression)", () => {
    const headerHeight = 120;
    const rawAvailable = BASE_CONTENT_H - headerHeight;
    // Content 2 px shy of raw boundary — without epsilon would be 1 page but
    // can overflow in-browser due to sub-pixel accumulation.
    expect(calculateDocumentPageCount(rawAvailable - 2, headerHeight)).toBe(2);
    // Content comfortably below the epsilon zone stays on one page.
    expect(
      calculateDocumentPageCount(rawAvailable - CONTENT_H_EPSILON - 1, headerHeight),
    ).toBe(1);
  });
});

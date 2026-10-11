import { describe, expect, it } from "vitest";
import {
  parsePageParam,
  parseSortParam,
  parseSearchParam,
  parseStatusParam,
} from "./filter-utils";

describe("parsePageParam", () => {
  it("returns 1 by default", () => expect(parsePageParam(undefined)).toBe(1));
  it("parses valid page number", () => expect(parsePageParam("3")).toBe(3));
  it("clamps zero to 1", () => expect(parsePageParam("0")).toBe(1));
  it("clamps negative to 1", () => expect(parsePageParam("-5")).toBe(1));
  it("falls back to 1 on NaN", () => expect(parsePageParam("abc")).toBe(1));
});

describe("parseSortParam", () => {
  it("returns date_desc by default", () => expect(parseSortParam(undefined)).toBe("date_desc"));
  it("accepts date_asc", () => expect(parseSortParam("date_asc")).toBe("date_asc"));
  it("accepts amount_desc", () => expect(parseSortParam("amount_desc")).toBe("amount_desc"));
  it("accepts client_asc", () => expect(parseSortParam("client_asc")).toBe("client_asc"));
  it("accepts status_desc", () => expect(parseSortParam("status_desc")).toBe("status_desc"));
  it("rejects unknown value", () => expect(parseSortParam("random_thing")).toBe("date_desc"));
});

describe("parseSearchParam", () => {
  it("returns undefined when absent", () => expect(parseSearchParam(undefined)).toBeUndefined());
  it("returns undefined for empty string", () => expect(parseSearchParam("")).toBeUndefined());
  it("returns undefined for whitespace only", () => expect(parseSearchParam("   ")).toBeUndefined());
  it("trims and returns search string", () => expect(parseSearchParam("  foo  ")).toBe("foo"));
  it("returns value unchanged when no whitespace", () => expect(parseSearchParam("INV-001")).toBe("INV-001"));
});

describe("parseStatusParam", () => {
  it("returns undefined when absent", () => expect(parseStatusParam(undefined)).toBeUndefined());
  it("returns undefined for empty string", () => expect(parseStatusParam("")).toBeUndefined());
  it("accepts paid", () => expect(parseStatusParam("paid")).toBe("paid"));
  it("accepts sent", () => expect(parseStatusParam("sent")).toBe("sent"));
  it("accepts overdue", () => expect(parseStatusParam("overdue")).toBe("overdue"));
  it("accepts outstanding", () => expect(parseStatusParam("outstanding")).toBe("outstanding"));
  it("rejects unknown value", () => expect(parseStatusParam("garbage")).toBeUndefined());
});

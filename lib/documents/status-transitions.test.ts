import { describe, expect, it } from "vitest";

import {
  canTransition,
  assertTransition,
  isSettledStatus,
  WORKFLOW_ONLY_STATUSES,
} from "@/lib/documents/status-transitions";

describe("canTransition", () => {
  it("allows draft → sent for every sendable type", () => {
    for (const type of ["invoice", "quote", "proposal", "local_purchase_order"] as const) {
      expect(canTransition(type, "draft", "sent")).toBe(true);
    }
  });

  it("allows sent ↔ viewed (portal view + resend)", () => {
    expect(canTransition("invoice", "sent", "viewed")).toBe(true);
    expect(canTransition("invoice", "viewed", "sent")).toBe(true);
  });

  it("never allows leaving paid except to voided=false (paid is terminal)", () => {
    for (const to of ["draft", "sent", "viewed", "partially_paid", "voided", "approved"] as const) {
      expect(canTransition("invoice", "paid", to)).toBe(false);
    }
  });

  it("allows invoice payment progression", () => {
    expect(canTransition("invoice", "sent", "partially_paid")).toBe(true);
    expect(canTransition("invoice", "viewed", "partially_paid")).toBe(true);
    expect(canTransition("invoice", "partially_paid", "paid")).toBe(true);
    expect(canTransition("invoice", "sent", "paid")).toBe(true);
    expect(canTransition("invoice", "sent", "written_off")).toBe(true);
    expect(canTransition("invoice", "partially_paid", "written_off")).toBe(true);
  });

  it("blocks paying a draft invoice", () => {
    expect(canTransition("invoice", "draft", "paid")).toBe(false);
    expect(canTransition("invoice", "draft", "partially_paid")).toBe(false);
  });

  it("allows quote/proposal approval only after sending", () => {
    expect(canTransition("quote", "sent", "approved")).toBe(true);
    expect(canTransition("quote", "viewed", "declined")).toBe(true);
    expect(canTransition("quote", "draft", "approved")).toBe(false);
    expect(canTransition("proposal", "sent", "approved")).toBe(true);
  });

  it("treats approved/declined as terminal for quotes (except void/archive)", () => {
    expect(canTransition("quote", "approved", "sent")).toBe(false);
    expect(canTransition("quote", "approved", "declined")).toBe(false);
    expect(canTransition("quote", "approved", "voided")).toBe(true);
    expect(canTransition("quote", "declined", "archived")).toBe(true);
  });

  it("allows LPO acknowledgement (sent/viewed → approved)", () => {
    expect(canTransition("local_purchase_order", "sent", "approved")).toBe(true);
    expect(canTransition("local_purchase_order", "draft", "approved")).toBe(false);
  });

  it("allows voiding any non-settled, non-voided doc", () => {
    expect(canTransition("invoice", "sent", "voided")).toBe(true);
    expect(canTransition("invoice", "partially_paid", "voided")).toBe(false);
    expect(canTransition("invoice", "voided", "voided")).toBe(false);
  });

  it("receipts are immutable (no transitions out of sent)", () => {
    expect(canTransition("receipt", "sent", "voided")).toBe(false);
    expect(canTransition("receipt", "sent", "draft")).toBe(false);
  });

  it("same-status is a no-op allowed (resend keeps sent)", () => {
    expect(canTransition("invoice", "sent", "sent")).toBe(true);
  });
});

describe("assertTransition", () => {
  it("returns ok for legal transition", () => {
    expect(assertTransition("invoice", "draft", "sent")).toEqual({ ok: true });
  });

  it("returns error message for illegal transition", () => {
    const result = assertTransition("invoice", "paid", "draft");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("paid");
      expect(result.error).toContain("draft");
    }
  });
});

describe("isSettledStatus", () => {
  it("flags paid, partially_paid, written_off", () => {
    expect(isSettledStatus("paid")).toBe(true);
    expect(isSettledStatus("partially_paid")).toBe(true);
    expect(isSettledStatus("written_off")).toBe(true);
    expect(isSettledStatus("sent")).toBe(false);
  });
});

describe("WORKFLOW_ONLY_STATUSES", () => {
  it("contains statuses no manual editor may set", () => {
    expect(WORKFLOW_ONLY_STATUSES).toEqual(
      expect.arrayContaining(["paid", "partially_paid", "written_off", "approved", "declined", "voided", "signed"]),
    );
  });
});

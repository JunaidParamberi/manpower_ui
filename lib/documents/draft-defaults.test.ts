import { describe, expect, it } from "vitest";
import {
  localTodayIso,
  addDaysIso,
  draftDefaults,
  dueDateFromTerms,
  isUntouchedDraft,
  termsLabel,
} from "./draft-defaults";

describe("addDaysIso", () => {
  it("adds days across a month end", () => {
    expect(addDaysIso("2026-01-31", 30)).toBe("2026-03-02");
  });
  it("handles leap years", () => {
    expect(addDaysIso("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("adds zero days", () => {
    expect(addDaysIso("2026-10-09", 0)).toBe("2026-10-09");
  });
});

describe("termsLabel", () => {
  it("labels zero as on receipt", () => expect(termsLabel(0)).toBe("On receipt"));
  it("labels days as Net N", () => expect(termsLabel(45)).toBe("Net 45"));
});

describe("dueDateFromTerms", () => {
  it("uses the client terms", () => expect(dueDateFromTerms("2026-10-09", 15)).toBe("2026-10-24"));
  it("falls back to 30 days when terms are missing", () => {
    expect(dueDateFromTerms("2026-10-09", null)).toBe("2026-11-08");
    expect(dueDateFromTerms("2026-10-09", undefined)).toBe("2026-11-08");
  });
  it("keeps zero terms as due on the issue date", () => expect(dueDateFromTerms("2026-10-09", 0)).toBe("2026-10-09"));
});

const profile = { default_currency: "AED", default_tax_mode: "vat", default_tax_rate: 5 };

describe("draftDefaults", () => {
  it("invoice: client terms, client currency, profile tax", () => {
    const d = draftDefaults({
      type: "invoice",
      today: "2026-10-09",
      clientId: "c1",
      projectId: null,
      client: { currency: "GBP", payment_terms_days: 14 },
      project: null,
      profile,
    });
    expect(d).toEqual({
      client_id: "c1",
      project_id: null,
      currency: "GBP",
      due_date: "2026-10-23",
      payment_terms: "Net 14",
      valid_until: null,
      tax_mode: "vat",
      tax_rate: 5,
    });
  });

  it("takes the client from the project when no client is passed", () => {
    const d = draftDefaults({
      type: "invoice",
      today: "2026-10-09",
      clientId: null,
      projectId: "p1",
      client: { currency: null, payment_terms_days: null },
      project: { client_id: "c9" },
      profile,
    });
    expect(d.client_id).toBe("c9");
    expect(d.project_id).toBe("p1");
    expect(d.currency).toBe("AED");
    expect(d.due_date).toBe("2026-11-08");
    expect(d.payment_terms).toBe("Net 30");
  });

  it("quote: valid for 30 days, no due date", () => {
    const d = draftDefaults({ type: "quote", today: "2026-10-09", clientId: null, projectId: null, client: null, project: null, profile: null });
    expect(d.valid_until).toBe("2026-11-08");
    expect(d.due_date).toBeNull();
    expect(d.currency).toBe("USD");
    expect(d.tax_mode).toBe("none");
    expect(d.tax_rate).toBe(0);
  });

  it("proposal and lpo get no dates", () => {
    for (const type of ["proposal", "local_purchase_order"] as const) {
      const d = draftDefaults({ type, today: "2026-10-09", clientId: null, projectId: null, client: null, project: null, profile });
      expect(d.due_date).toBeNull();
      expect(d.valid_until).toBeNull();
    }
  });

  it("ignores an unknown profile tax mode", () => {
    const d = draftDefaults({ type: "invoice", today: "2026-10-09", clientId: null, projectId: null, client: null, project: null, profile: { ...profile, default_tax_mode: "bogus" } });
    expect(d.tax_mode).toBe("none");
    expect(d.tax_rate).toBe(0);
  });
});

describe("isUntouchedDraft", () => {
  const base = {
    status: "draft",
    lineItemCount: 0,
    createdAt: "2026-10-09T10:00:00.000Z",
    updatedAt: "2026-10-09T10:00:00.400Z",
    now: "2026-10-09T10:05:00.000Z",
  };
  it("is untouched right after creation", () => expect(isUntouchedDraft(base)).toBe(true));
  it("is touched once a line item exists", () => expect(isUntouchedDraft({ ...base, lineItemCount: 1 })).toBe(false));
  it("is touched once updated after the window", () => expect(isUntouchedDraft({ ...base, updatedAt: "2026-10-09T10:00:04.000Z" })).toBe(false));
  it("is never untouched once sent", () => expect(isUntouchedDraft({ ...base, status: "sent" })).toBe(false));
  it("keeps drafts older than a day", () => expect(isUntouchedDraft({ ...base, now: "2026-10-10T10:00:01.000Z" })).toBe(false));
  it("treats a missing updatedAt as untouched", () => expect(isUntouchedDraft({ ...base, updatedAt: null })).toBe(true));
});

describe("localTodayIso", () => {
  it("uses the local calendar day, not the UTC day", () => {
    // 02:00 on 10 Oct in UTC+4 is still 9 Oct in UTC; local parts say the 10th.
    expect(localTodayIso(new Date(2026, 9, 10, 2, 0, 0))).toBe("2026-10-10");
    expect(localTodayIso(new Date(2026, 0, 5, 23, 59, 0))).toBe("2026-01-05");
  });
});

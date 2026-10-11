import { describe, it, expect } from "vitest";
import { upgradePlanSchema, lsWebhookSchema } from "./billing";

describe("upgradePlanSchema", () => {
  it("accepts valid plans", () => {
    expect(upgradePlanSchema.parse({ plan: "starter" })).toEqual({ plan: "starter" });
    expect(upgradePlanSchema.parse({ plan: "pro" })).toEqual({ plan: "pro" });
    expect(upgradePlanSchema.parse({ plan: "agency" })).toEqual({ plan: "agency" });
  });

  it("rejects free plan (can't upgrade to free)", () => {
    expect(() => upgradePlanSchema.parse({ plan: "free" })).toThrow();
  });

  it("rejects unknown plan", () => {
    expect(() => upgradePlanSchema.parse({ plan: "enterprise" })).toThrow();
  });

  it("rejects missing plan", () => {
    expect(() => upgradePlanSchema.parse({})).toThrow();
  });
});

const validPayload = {
  meta: {
    event_name: "subscription_created",
    custom_data: { user_id: "user-123" },
  },
  data: {
    id: "sub-456",
    attributes: {
      status: "active",
      variant_id: 1836206,
      customer_id: 789,
      renews_at: "2026-07-26T00:00:00Z",
      ends_at: null,
      urls: { customer_portal: "https://app.lemonsqueezy.com/billing" },
    },
  },
};

describe("lsWebhookSchema", () => {
  it("parses full valid payload", () => {
    expect(lsWebhookSchema.safeParse(validPayload).success).toBe(true);
  });

  it("parses payload without custom_data", () => {
    const payload = { ...validPayload, meta: { event_name: "subscription_updated" } };
    expect(lsWebhookSchema.safeParse(payload).success).toBe(true);
  });

  it("parses payload with null urls", () => {
    const payload = {
      ...validPayload,
      data: {
        ...validPayload.data,
        attributes: { ...validPayload.data.attributes, urls: null },
      },
    };
    expect(lsWebhookSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects missing event_name", () => {
    const payload = { meta: { custom_data: { user_id: "u1" } }, data: validPayload.data };
    expect(lsWebhookSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects missing data.id", () => {
    const payload = {
      meta: validPayload.meta,
      data: { attributes: validPayload.data.attributes },
    };
    expect(lsWebhookSchema.safeParse(payload).success).toBe(false);
  });
});

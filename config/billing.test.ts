import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.LEMON_SQUEEZY_VARIANT_STARTER = "1836206";
  process.env.LEMON_SQUEEZY_VARIANT_PRO = "1836239";
  process.env.LEMON_SQUEEZY_VARIANT_AGENCY = "1836242";
});

// Dynamic import so env vars are set before the module resolves requireEnv
async function getBillingConfig() {
  const mod = await import("./billing");
  return mod;
}

describe("variantToPlan", () => {
  it("resolves starter", async () => {
    const { variantToPlan } = await getBillingConfig();
    expect(variantToPlan("1836206")).toBe("starter");
  });

  it("resolves pro", async () => {
    const { variantToPlan } = await getBillingConfig();
    expect(variantToPlan("1836239")).toBe("pro");
  });

  it("resolves agency", async () => {
    const { variantToPlan } = await getBillingConfig();
    expect(variantToPlan("1836242")).toBe("agency");
  });

  it("resolves numeric variant id", async () => {
    const { variantToPlan } = await getBillingConfig();
    expect(variantToPlan(1836206)).toBe("starter");
  });

  it("returns null for unknown variant", async () => {
    const { variantToPlan } = await getBillingConfig();
    expect(variantToPlan("999999")).toBeNull();
  });
});

describe("lsStatusToLocal", () => {
  it("maps active statuses", async () => {
    const { lsStatusToLocal } = await getBillingConfig();
    expect(lsStatusToLocal("active")).toBe("active");
    expect(lsStatusToLocal("on_trial")).toBe("active");
  });

  it("maps past_due statuses", async () => {
    const { lsStatusToLocal } = await getBillingConfig();
    expect(lsStatusToLocal("past_due")).toBe("past_due");
    expect(lsStatusToLocal("unpaid")).toBe("past_due");
    expect(lsStatusToLocal("paused")).toBe("past_due");
  });

  it("maps cancelled", async () => {
    const { lsStatusToLocal } = await getBillingConfig();
    expect(lsStatusToLocal("cancelled")).toBe("cancelled");
  });

  it("maps expired", async () => {
    const { lsStatusToLocal } = await getBillingConfig();
    expect(lsStatusToLocal("expired")).toBe("expired");
  });

  it("defaults unknown to active", async () => {
    const { lsStatusToLocal } = await getBillingConfig();
    expect(lsStatusToLocal("something_new")).toBe("active");
  });
});

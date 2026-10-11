// lib/dashboard/derive/derive-clients.test.ts
import { describe, expect, it } from "vitest";

import { deriveClients, LIVE_HEALTH_CLIENT_CAP, type LiveHealthInput } from "@/lib/dashboard/derive/derive-clients";

const NOW = "2026-09-13T09:00:00.000Z";

function liveInput(partial: Partial<LiveHealthInput> = {}): LiveHealthInput {
  return {
    client: {
      id: "c1",
      name: "Acme Design Co.",
      relationshipStatus: "active",
      paymentTermsDays: 14,
    } as LiveHealthInput["client"],
    invoices: [
      { id: "i1", status: "sent", dueDate: "2026-09-05", total: 5000, paidAt: null, daysToPay: null },
    ] as LiveHealthInput["invoices"],
    documents: [{ sentAt: "2026-09-01T00:00:00.000Z", viewedAt: null, type: "invoice", status: "sent" }] as LiveHealthInput["documents"],
    projects: [],
    revenueLast90: 0,
    revenuePrior90: 0,
    ...partial,
  };
}

describe("deriveClients", () => {
  it("prefers nightly snapshots when they exist", () => {
    const facts = deriveClients({
      nowIso: NOW,
      snapshots: [
        { clientId: "c9", clientName: "Snapshot Co.", score: 40, band: "needs_attention", topSignal: null },
      ],
      liveInputs: [liveInput()],
    });
    expect(facts.source).toBe("nightly");
    expect(facts.clients.map((c) => c.clientId)).toEqual(["c9"]);
  });

  it("computes health live when there are no snapshots", () => {
    const facts = deriveClients({ nowIso: NOW, snapshots: [], liveInputs: [liveInput()] });
    expect(facts.source).toBe("live");
    expect(facts.clients).toHaveLength(1);
    expect(facts.clients[0].clientName).toBe("Acme Design Co.");
    expect(facts.clients[0].score).toBeGreaterThan(0);
  });

  it("sorts the worst relationships first", () => {
    const facts = deriveClients({
      nowIso: NOW,
      snapshots: [
        { clientId: "ok", clientName: "Fine Co.", score: 70, band: "healthy", topSignal: null },
        { clientId: "bad", clientName: "Risky Co.", score: 20, band: "at_risk", topSignal: null },
      ],
      liveInputs: [],
    });
    expect(facts.clients.map((c) => c.clientId)).toEqual(["bad", "ok"]);
  });

  it("refuses live computation above the cap and says so", () => {
    const liveInputs = Array.from({ length: LIVE_HEALTH_CLIENT_CAP + 1 }, (_, i) =>
      liveInput({ client: { ...liveInput().client, id: `c${i}` } }),
    );
    const facts = deriveClients({ nowIso: NOW, snapshots: [], liveInputs });
    expect(facts.clients).toEqual([]);
    expect(facts.cappedForLiveComputation).toBe(true);
  });

  it("returns an empty, uncapped result when there is nothing to score", () => {
    const facts = deriveClients({ nowIso: NOW, snapshots: [], liveInputs: [] });
    expect(facts.clients).toEqual([]);
    expect(facts.cappedForLiveComputation).toBe(false);
  });
});

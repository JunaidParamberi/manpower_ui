import { describe, expect, it } from "vitest";

import { buildClientActivityTimeline } from "./client-activity";

describe("buildClientActivityTimeline", () => {
  it("combines client, project, and document activity with newest first", () => {
    const timeline = buildClientActivityTimeline({
      client: {
        id: "client-1",
        name: "Acme",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
      projects: [
        {
          id: "project-1",
          title: "Website",
          status: "active",
          updated_at: "2026-01-04T00:00:00.000Z",
        },
      ],
      documents: [
        {
          id: "doc-1",
          title: "Invoice INV-1",
          type: "invoice",
          status: "sent",
          updated_at: "2026-01-03T00:00:00.000Z",
        },
      ],
    });

    expect(timeline.map((item) => item.id)).toEqual([
      "project-project-1",
      "document-doc-1",
      "client-updated-client-1",
      "client-created-client-1",
    ]);
  });
});

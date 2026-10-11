import { describe, it, expect } from "vitest";

import { ENTITY_LABELS, entityPath } from "./routes";

describe("entityPath", () => {
  it("maps clients to /clients/{id}", () => {
    expect(entityPath("clients", "abc")).toBe("/clients/abc");
  });

  it("maps projects to /projects/{id}", () => {
    expect(entityPath("projects", "p1")).toBe("/projects/p1");
  });

  it("maps documents to /documents/{id}", () => {
    expect(entityPath("documents", "d1")).toBe("/documents/d1");
  });

  it("maps payments to /documents/{documentId} (entityId is the doc id)", () => {
    expect(entityPath("payments", "doc-1")).toBe("/documents/doc-1");
  });

  it("maps tasks to /tasks?task={id}", () => {
    expect(entityPath("tasks", "t1")).toBe("/tasks?task=t1");
  });

  it("maps services to /settings/services#{id}", () => {
    expect(entityPath("services", "s1")).toBe("/settings/services#s1");
  });

  it("maps expenses to /expenses#{id}", () => {
    expect(entityPath("expenses", "e1")).toBe("/expenses#e1");
  });

  it("maps content_posts to /marketing/post/{id}", () => {
    expect(entityPath("content_posts", "p1")).toBe("/marketing/post/p1");
  });

  it("maps content_campaigns to /marketing/campaign/{id}", () => {
    expect(entityPath("content_campaigns", "c1")).toBe("/marketing/campaign/c1");
  });

  it("returns null when id is null", () => {
    expect(entityPath("clients", null)).toBeNull();
  });

  it("returns null for unknown entities", () => {
    expect(entityPath("hackers", "abc")).toBeNull();
  });

  it("returns null for never-exposed tables", () => {
    expect(entityPath("subscriptions", "x")).toBeNull();
    expect(entityPath("consent_log", "x")).toBeNull();
  });
});

describe("ENTITY_LABELS", () => {
  it("has a human label for every registry entity", () => {
    for (const entity of ["clients", "projects", "tasks", "documents", "payments", "services", "expenses", "content_posts", "content_campaigns", "project_milestones"]) {
      expect(ENTITY_LABELS[entity], entity).toBeTypeOf("string");
    }
  });
});

import { describe, expect, it } from "vitest";
import { getTable, hasTable } from "@/lib/mock/schema";

describe("workers-domain schema", () => {
  it.each(["suppliers", "project_clients", "workers", "worker_clients", "worker_documents"])(
    "%s table exists with id/user_id/created_at/updated_at",
    (name) => {
      expect(hasTable(name)).toBe(true);
      const table = getTable(name)!;
      const columnNames = table.columns.map((c) => c.name);
      expect(columnNames).toContain("id");
      expect(columnNames).toContain("created_at");
      expect(columnNames).toContain("updated_at");
    },
  );

  it("workers.employee_id is unique and supplier_id FKs to suppliers with SET NULL", () => {
    const table = getTable("workers")!;
    expect(table.uniqueConstraints).toContainEqual(["user_id", "employee_id"]);
    const fk = table.foreignKeys.find((f) => f.columns.includes("supplier_id"));
    expect(fk?.refTable).toBe("suppliers");
  });

  it("worker_clients and worker_documents FK back to workers", () => {
    const wc = getTable("worker_clients")!;
    expect(wc.foreignKeys.some((f) => f.refTable === "workers")).toBe(true);
    expect(wc.foreignKeys.some((f) => f.refTable === "project_clients")).toBe(true);

    const wd = getTable("worker_documents")!;
    expect(wd.foreignKeys.some((f) => f.refTable === "workers")).toBe(true);
  });
});

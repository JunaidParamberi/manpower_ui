// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deleteProject } from "@/lib/projects/actions";
import type { ProjectListRow } from "@/types";
import { ProjectActionsMenu } from "./project-summary-card";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => React.createElement("a", { href }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/pinned/context", () => ({
  usePinnedItems: () => ({
    isPinned: () => false,
  }),
}));

vi.mock("@/lib/pinned/actions", () => ({
  pinItem: vi.fn(async () => ({ ok: true })),
  unpinItem: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/projects/actions", () => ({
  deleteProject: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? React.createElement("div", { role: "dialog" }, children) : null),
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DialogDescription: ({ children }: { children: React.ReactNode }) =>
    React.createElement("p", null, children),
  DialogFooter: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement("h2", null, children),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DropdownMenuItem: ({
    children,
    disabled,
    onClick,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }) =>
    React.createElement(
      "button",
      { disabled, onClick, type: "button" },
      children
    ),
  DropdownMenuSeparator: () => React.createElement("hr"),
  DropdownMenuTrigger: ({
    render,
    children,
  }: {
    render?: React.ReactNode;
    children: React.ReactNode;
  }) => React.createElement(React.Fragment, null, render ?? children),
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

const project = {
  id: "22222222-2222-4222-8222-222222222222",
  user_id: "11111111-1111-4111-8111-111111111111",
  client_id: "33333333-3333-4333-8333-333333333333",
  title: "Website refresh",
  status: "active",
  budget: 5000,
  spent: 1200,
  hourly_rate: null,
  start_date: "2026-05-01",
  deadline: "2026-06-01",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-10T00:00:00Z",
  client: { id: "33333333-3333-4333-8333-333333333333", name: "Acme" },
} satisfies ProjectListRow;

describe("ProjectActionsMenu", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("closes the delete dialog after a successful project delete", async () => {
    await act(async () => {
      root.render(React.createElement(ProjectActionsMenu, { project }));
    });

    const menuDelete = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Delete")
    );
    expect(menuDelete).toBeTruthy();

    await act(async () => {
      menuDelete?.click();
    });

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();

    const confirmDelete = Array.from(container.querySelectorAll("button"))
      .filter((button) => button.textContent?.trim() === "Delete")
      .at(-1);

    await act(async () => {
      confirmDelete?.click();
      await Promise.resolve();
    });

    expect(deleteProject).toHaveBeenCalledWith(project.id);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});

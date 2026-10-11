"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarRange,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  GripVertical,
  LayoutDashboard,
  ListChecks,
  Package,
  Receipt,
  RotateCcw,
  Settings,
  Settings2,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { useSidebar } from "@/components/ui/sidebar";
import { useShellLayout } from "@/lib/layout/shell-layout-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CollapsedNavFlyout } from "@/components/layout/collapsed-nav-flyout";
import { branding } from "@/config/branding";
import { DOCUMENT_TYPE_NAV, slugFromType } from "@/lib/documents/document-routes";
import { useActiveDocumentType } from "@/lib/documents/active-type-state";
import { updateNavLayout } from "@/lib/layout/nav-actions";
import {
  NAV_ITEM_IDS,
  NAV_ITEM_SECTION_INDEX,
  groupNavOrderBySection,
  mergeNavLayout,
  type NavItemId,
  type NavLayout,
} from "@/lib/layout/nav-registry";
import { cn } from "@/lib/utils";
import type { PinnedItem } from "@/lib/pinned/queries";

type NavItemDef = {
  id: string;
  label: string;
  href: string;
  Icon: React.ElementType;
  countKey?: "tasks";
  children?: { label: string; href: string }[];
};

type NavSectionDef = {
  label?: string;
  items: NavItemDef[];
};

const NAV_SECTIONS: NavSectionDef[] = [
  {
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
      { id: "tasks",     label: "Tasks",     href: "/tasks",     Icon: ListChecks,  countKey: "tasks" },
      { id: "time",      label: "Time",      href: "/time",      Icon: Timer },
    ],
  },
  {
    label: "Work",
    items: [
      { id: "clients",   label: "Clients",   href: "/clients",   Icon: Users },
      { id: "projects",  label: "Projects",  href: "/projects",  Icon: FolderKanban },
      {
        id: "documents",
        label: "Documents",
        href: "/documents",
        Icon: FileText,
        children: DOCUMENT_TYPE_NAV,
      },
      { id: "services",  label: "Services",  href: "/services",  Icon: Package },
      { id: "marketing", label: "Marketing", href: "/marketing", Icon: CalendarRange },
    ],
  },
  {
    label: "Money",
    items: [
      { id: "finance", label: "Finance", href: "/finance", Icon: TrendingUp },
      { id: "expenses", label: "Expenses", href: "/expenses", Icon: Receipt },
    ],
  },
];

const NAV_ITEM_BY_ID: Record<string, NavItemDef> = {};
for (const section of NAV_SECTIONS) {
  for (const item of section.items) NAV_ITEM_BY_ID[item.id] = item;
}

function navIsActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const PINNED_TYPE_ICON: Record<PinnedItem["item_type"], React.ElementType> = {
  project:  FolderKanban,
  client:   Users,
  document: FileText,
  task:     ListChecks,
};

const PINNED_TYPE_COLOR: Record<PinnedItem["item_type"], string> = {
  project:  "#E0995E",
  client:   "#6E83F0",
  document: "#9B7FD8",
  task:     "#3FB87D",
};

/**
 * Row wrapper for a top-level nav item while customizing the sidebar: adds
 * a drag handle + hide toggle around whatever `children` already renders
 * (the item's normal Link/accordion), so the item's own click/hover/active
 * behavior is untouched outside edit mode.
 */
function SortableNavItem({
  id,
  editing,
  hidden,
  onToggleHidden,
  children,
}: {
  id: NavItemId;
  editing: boolean;
  hidden: boolean;
  onToggleHidden: (id: NavItemId) => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editing,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative flex items-center gap-0.5", isDragging && "z-10 opacity-90", hidden && editing && "opacity-40")}
    >
      {editing && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${NAV_ITEM_BY_ID[id]?.label ?? id}`}
          className="flex h-7 w-5 shrink-0 cursor-grab items-center justify-center rounded text-[var(--fg-3)] hover:bg-[var(--bg-subtle)] hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical size={13} />
        </button>
      )}
      <div className="min-w-0 flex-1">{children}</div>
      {editing && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleHidden(id);
          }}
          aria-label={hidden ? `Show ${NAV_ITEM_BY_ID[id]?.label ?? id}` : `Hide ${NAV_ITEM_BY_ID[id]?.label ?? id}`}
          className="flex h-7 w-6 shrink-0 items-center justify-center rounded text-[var(--fg-3)] hover:bg-[var(--bg-subtle)] hover:text-foreground"
        >
          {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      )}
    </div>
  );
}

export type AppSidebarProps = {
  unreadCount: number;
  openTaskCount: number;
  pinnedItems?: PinnedItem[];
  navLayout?: NavLayout;
  onOpenSearch: () => void;
  onNavigate?: () => void;
  hideFooter?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function AppSidebar({
  openTaskCount,
  pinnedItems = [],
  navLayout,
  onNavigate,
  hideFooter,
  className,
  style,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { open, toggleSidebar } = useSidebar();
  const { sidebarWidth, isResizing } = useShellLayout();
  const collapsed = !open;

  const [navOrder, setNavOrder] = useState<NavItemId[]>(() => navLayout?.order ?? [...NAV_ITEM_IDS]);
  const [navHidden, setNavHidden] = useState<Set<NavItemId>>(() => new Set(navLayout?.hidden ?? []));
  const [navEditing, setNavEditing] = useState(false);
  const [, startNavTransition] = useTransition();

  const navSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const groupedNavOrder = useMemo(() => groupNavOrderBySection(navOrder), [navOrder]);

  const persistNavLayout = useCallback((order: NavItemId[], hidden: NavItemId[]) => {
    startNavTransition(() => {
      void updateNavLayout(order, hidden).then((result) => {
        if (!result.ok) toast.error("Couldn't save your navigation layout — try again");
      });
    });
  }, []);

  const onNavDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const activeId = active.id as NavItemId;
      const overId = over.id as NavItemId;
      if (NAV_ITEM_SECTION_INDEX[activeId] !== NAV_ITEM_SECTION_INDEX[overId]) return;

      const oldIndex = navOrder.indexOf(activeId);
      const newIndex = navOrder.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const next = arrayMove(navOrder, oldIndex, newIndex);
      setNavOrder(next);
      persistNavLayout(next, Array.from(navHidden));
    },
    [navOrder, navHidden, persistNavLayout],
  );

  const onToggleNavHidden = useCallback(
    (id: NavItemId) => {
      const next = new Set(navHidden);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setNavHidden(next);
      persistNavLayout(navOrder, Array.from(next));
    },
    [navOrder, navHidden, persistNavLayout],
  );

  const onResetNavLayout = useCallback(() => {
    const defaults = mergeNavLayout([], []);
    setNavOrder(defaults.order);
    setNavHidden(new Set());
    persistNavLayout(defaults.order, []);
    toast.success("Navigation layout reset");
  }, [persistNavLayout]);

  const enterNavEditing = useCallback(() => {
    if (collapsed) toggleSidebar();
    setNavEditing(true);
  }, [collapsed, toggleSidebar]);

  // Track which nav sections with children are expanded (accordion).
  // Auto-open the section when the user navigates into it.
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (item.children && navIsActive(pathname, item.href)) s.add(item.id);
      }
    }
    return s;
  });

  useEffect(() => {
    const onDocuments = pathname === "/documents" || pathname.startsWith("/documents/");
    setOpenSections((prev) => {
      const next = new Set(prev);
      for (const section of NAV_SECTIONS) {
        for (const item of section.items) {
          if (!item.children) continue;
          if (onDocuments && navIsActive(pathname, item.href)) {
            next.add(item.id);
          } else if (!onDocuments || !navIsActive(pathname, item.href)) {
            next.delete(item.id);
          }
        }
      }
      return next;
    });
  }, [pathname]);

  const COUNTS: Record<string, number> = { tasks: openTaskCount };

  // On /documents/{uuid} the URL doesn't encode the type — read from shared state set by the list pane.
  const isDocDetailPage = /^\/documents\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(pathname);
  const lastActiveDocType = useActiveDocumentType();
  const detailTypeHref = isDocDetailPage && lastActiveDocType
    ? `/documents/${slugFromType(lastActiveDocType)}`
    : null;

  return (
    <TooltipProvider delay={0}>
    <aside
      // Expanded follows the app theme; collapsed becomes a dark icon rail.
      // Every colour below is a token var, so flipping data-theme re-points
      // the whole subtree and the colour fades with the width.
      data-theme={collapsed ? "dark" : undefined}
      className={cn(
        "relative flex h-full shrink-0 flex-col overflow-hidden",
        "rounded-[var(--radius-panel)] border border-border bg-[var(--panel)] text-[var(--fg)]",
        className,
      )}
      // Width and its transition stay inline: the sidebar is drag-resizable,
      // so the value is live state and the animation is suppressed mid-drag.
      style={{
        width: collapsed ? 56 : sidebarWidth,
        transition: isResizing
          ? "none"
          : "width 200ms ease, background-color 200ms ease, border-color 200ms ease, color 200ms ease",
        ...style,
      }}
    >
      {/* ── Header ──────────────────────────────── */}
      <div
        className={cn(
          "flex h-[var(--topbar-h)] shrink-0 items-center gap-2 px-4",
          collapsed ? "justify-center" : "justify-start",
        )}
      >
        <Link
          href="/dashboard"
          aria-label="Manpower home"
          className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-[7px]"
        >
          <Image
            src={branding.mark}
            alt="Manpower"
            width={28}
            height={28}
            priority
            className="size-7 object-contain"
          />
        </Link>

        {!collapsed && (
          <div className="flex h-7 items-center">
            {/* Expanded follows the app theme, so render both and let the
                dark variant (`[data-theme="dark"] *`) pick one. */}
            <Image
              src={branding.wordmarkOnLightBg}
              alt="Manpower"
              width={88}
              height={18}
              priority
              className="block dark:hidden"
            />
            <Image
              src={branding.wordmarkOnDarkBg}
              alt=""
              aria-hidden
              width={88}
              height={18}
              priority
              className="hidden dark:block"
            />
          </div>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────── */}
      <div
        className={cn(
          "sidebar-nav-scroll flex-1 overflow-y-auto",
          collapsed ? "px-1 pb-3 pt-2" : "px-3 pb-3 pt-2",
        )}
      >
        {navEditing && (
          <div
            className="mb-1 flex items-center justify-between gap-1.5 rounded-[7px] bg-[var(--bg-subtle)] px-2.5 py-1.5 text-[11.5px] text-[var(--fg-2)]"
          >
            <span>Customizing navigation</span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onResetNavLayout}
                aria-label="Reset navigation layout"
                title="Reset to default"
                className="flex size-6 cursor-pointer items-center justify-center rounded-[6px] border-0 bg-transparent text-[var(--fg-3)]"
              >
                <RotateCcw size={13} />
              </button>
              <button
                type="button"
                onClick={() => setNavEditing(false)}
                aria-label="Done customizing navigation"
                title="Done"
                // bg-primary, not var(--accent): globals.css re-points --accent
                // at --accent-soft, so this confirm button was a white tick on a
                // near-white fill.
                className="flex size-6 cursor-pointer items-center justify-center rounded-[6px] border-0 bg-primary text-primary-foreground"
              >
                <Check size={13} />
              </button>
            </div>
          </div>
        )}

        <DndContext sensors={navSensors} collisionDetection={closestCenter} onDragEnd={onNavDragEnd}>
        {NAV_SECTIONS.map((section, si) => {
          const sectionItemIds = groupedNavOrder[si] ?? [];
          const sectionItems = sectionItemIds
            .map((id) => NAV_ITEM_BY_ID[id])
            .filter((item): item is NavItemDef => Boolean(item))
            .filter((item) => navEditing || !navHidden.has(item.id as NavItemId));

          return (
          <div key={si} className="mb-1 flex flex-col gap-1">
            {section.label && !collapsed && (
              <div
                className="flex items-center px-3 pb-1 pt-4"
              >
                <span
                  className="text-label font-medium uppercase tracking-[0.06em] text-[var(--fg-3)]"
                >
                  {section.label}
                </span>
              </div>
            )}
            {section.label && collapsed && (
              <div className="mx-2 my-1.5 h-px bg-border" />
            )}

            <SortableContext items={sectionItemIds} strategy={verticalListSortingStrategy}>
            {sectionItems.map((item) => {
              const { Icon } = item;
              const active = navIsActive(pathname, item.href);
              const count = item.countKey ? COUNTS[item.countKey] : undefined;

              // When a type sub-item is active (e.g. /documents/invoices), suppress the
              // parent item's background highlight so only the child appears selected.
              const typeChildActive = item.children
                ? item.children.some(
                    (child) =>
                      child.href !== item.href &&
                      (pathname === child.href || child.href === detailTypeHref),
                  )
                : false;
              const parentHighlighted = active && !typeChildActive;

              const itemStyle: React.CSSProperties = {
                display: "flex",
                alignItems: "center",
                gap: collapsed ? 0 : 12,
                padding: collapsed ? 0 : "8px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 8,
                width: collapsed ? 36 : "auto",
                height: collapsed ? 36 : "auto",
                marginInline: collapsed ? "auto" : undefined,
                fontSize: 13,
                color: active ? "var(--fg)" : "var(--fg-2)",
                fontWeight: active ? 500 : 400,
                background: parentHighlighted ? "var(--bg-subtle)" : "transparent",
                textDecoration: "none",
                transition: "background var(--dur-fast), color var(--dur-fast)",
                position: "relative",
              };

              const hoverOn = (e: React.MouseEvent<HTMLElement>) => {
                if (!parentHighlighted) {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)";
                  (e.currentTarget as HTMLElement).style.color = "var(--fg)";
                }
              };
              const hoverOff = (e: React.MouseEvent<HTMLElement>) => {
                if (!parentHighlighted) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--fg-2)";
                }
              };

              const sectionOpen = openSections.has(item.id);
              const toggleSection = item.children
                ? () => {
                    setOpenSections((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    });
                  }
                : undefined;

              const link = (
                <Link
                  key={item.id}
                  href={item.href}
                  style={itemStyle}
                  onMouseEnter={hoverOn}
                  onMouseLeave={hoverOff}
                  onClick={(e) => {
                    // Accordion toggle only when expanded; collapsed uses hover flyout
                    if (toggleSection && !collapsed) {
                      // If already on this section, just toggle; don't navigate away
                      if (active) e.preventDefault();
                      toggleSection();
                    }
                    onNavigate?.();
                  }}
                >
                  <span
                    className={cn(
                      // text-[var(--fg)], not text-foreground: this subtree is
                      // data-theme="dark", and the token variable inherits that
                      // override while the mapped utility does not.
                      "flex shrink-0 items-center",
                      active ? "text-[var(--fg)]" : "text-[var(--fg-3)]",
                    )}
                  >
                    <Icon size={collapsed ? 18 : 16} strokeWidth={1.6} />
                  </span>
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {!collapsed && typeof count === "number" && count > 0 && (
                    <span
                      className="shrink-0 text-[11.5px] tabular-nums text-[var(--fg-3)]"
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                  {collapsed && typeof count === "number" && count > 0 && (
                    <span
                      className="absolute right-1 top-[3px] text-[9px] font-semibold leading-none tabular-nums text-[var(--fg-3)]"
                    >
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                  {!collapsed && item.children && (
                    <ChevronRight
                      size={12}
                      strokeWidth={2}
                      className={cn(
                        "shrink-0 text-[var(--fg-3)] transition-transform duration-150",
                        sectionOpen ? "rotate-90" : "rotate-0",
                      )}
                    />
                  )}
                </Link>
              );

              if (collapsed) {
                if (item.children) {
                  const activeChild = item.children.find((child) =>
                    child.href === item.href
                      ? active &&
                        !typeChildActive &&
                        (!isDocDetailPage || !lastActiveDocType)
                      : pathname === child.href || child.href === detailTypeHref,
                  );

                  return (
                    <CollapsedNavFlyout
                      key={item.id}
                      label={item.label}
                      items={item.children}
                      activeHref={activeChild?.href ?? null}
                      onNavigate={onNavigate}
                      trigger={link}
                    />
                  );
                }

                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger render={link} />
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              const onParentRoute = navIsActive(pathname, item.href);

              if (item.children && !collapsed) {
                const accordionBlock = (
                  <div key={item.id} className="flex flex-col gap-1">
                    {link}
                    <Collapsible.Root open={sectionOpen}>
                      <Collapsible.Panel className="collapsible-panel">
                        <div className="mt-0.5 flex flex-col gap-1">
                          {item.children.map((child) => {
                            const childActive =
                              child.href === item.href
                                ? onParentRoute &&
                                  !typeChildActive &&
                                  (!isDocDetailPage || !lastActiveDocType)
                                : pathname === child.href || child.href === detailTypeHref;
                            const childStyle: React.CSSProperties = {
                              display: "flex",
                              alignItems: "center",
                              padding: "6px 12px 6px 40px",
                              borderRadius: 8,
                              fontSize: 13,
                              color: childActive ? "var(--fg)" : "var(--fg-2)",
                              fontWeight: childActive ? 500 : 400,
                              background: childActive ? "var(--bg-subtle)" : "transparent",
                              textDecoration: "none",
                              transition: "background var(--dur-fast), color var(--dur-fast)",
                            };
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                style={childStyle}
                                onMouseEnter={(e) => {
                                  if (!childActive) {
                                    (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)";
                                    (e.currentTarget as HTMLElement).style.color = "var(--fg)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!childActive) {
                                    (e.currentTarget as HTMLElement).style.background = "transparent";
                                    (e.currentTarget as HTMLElement).style.color = "var(--fg-2)";
                                  }
                                }}
                                onClick={onNavigate}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      </Collapsible.Panel>
                    </Collapsible.Root>
                  </div>
                );

                return navEditing ? (
                  <SortableNavItem
                    key={item.id}
                    id={item.id as NavItemId}
                    editing={navEditing}
                    hidden={navHidden.has(item.id as NavItemId)}
                    onToggleHidden={onToggleNavHidden}
                  >
                    {accordionBlock}
                  </SortableNavItem>
                ) : (
                  accordionBlock
                );
              }

              return navEditing ? (
                <SortableNavItem
                  key={item.id}
                  id={item.id as NavItemId}
                  editing={navEditing}
                  hidden={navHidden.has(item.id as NavItemId)}
                  onToggleHidden={onToggleNavHidden}
                >
                  {link}
                </SortableNavItem>
              ) : (
                link
              );
            })}
            </SortableContext>
          </div>
          );
        })}
        </DndContext>

        {/* ── Pinned ───────────────────────────────── */}
        {pinnedItems.length > 0 && (
          <div className="mb-1 flex flex-col gap-1">
            {!collapsed && (
              <div className="flex items-center px-3 pb-1 pt-4">
                <span
                  className="text-label font-medium uppercase tracking-[0.06em] text-[var(--fg-3)]"
                >
                  Pinned
                </span>
              </div>
            )}
            {collapsed && (
              <div className="mx-2 my-1.5 h-px bg-border" />
            )}
            {pinnedItems.map((pin) => {
              const PinIcon = PINNED_TYPE_ICON[pin.item_type];
              const iconColor = PINNED_TYPE_COLOR[pin.item_type];
              const active = pathname === pin.item_href || pathname.startsWith(`${pin.item_href}/`);
              const pinItemStyle: React.CSSProperties = {
                display: "flex",
                alignItems: "center",
                gap: collapsed ? 0 : 12,
                padding: collapsed ? 0 : "8px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 8,
                width: collapsed ? 36 : "auto",
                height: collapsed ? 36 : "auto",
                marginInline: collapsed ? "auto" : undefined,
                fontSize: 13,
                color: active ? "var(--fg)" : "var(--fg-2)",
                fontWeight: active ? 500 : 400,
                background: active ? "var(--bg-subtle)" : "transparent",
                textDecoration: "none",
                transition: "background var(--dur-fast), color var(--dur-fast)",
              };
              const pinLink = (
                <Link
                  key={pin.id}
                  href={pin.item_href}
                  style={pinItemStyle}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)";
                      (e.currentTarget as HTMLElement).style.color = "var(--fg)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--fg-2)";
                    }
                  }}
                  onClick={onNavigate}
                >
                  <span className="flex shrink-0 items-center" style={{ color: iconColor }}>
                    <PinIcon size={collapsed ? 17 : 15} strokeWidth={1.6} />
                  </span>
                  {!collapsed && (
                    <span className="flex-1 truncate">
                      {pin.item_label}
                    </span>
                  )}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={pin.id}>
                    <TooltipTrigger render={pinLink} />
                    <TooltipContent side="right" sideOffset={8}>
                      {pin.item_label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return pinLink;
            })}
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────── */}
      {/* Account lives in the header avatar menu; the sidebar keeps only what
          belongs to navigation itself. */}
      {!hideFooter && (
        <div className={cn("flex shrink-0 flex-col gap-1 border-t border-border", collapsed ? "items-center px-1 py-2" : "px-3 py-2")}>
          {(
            [
              { key: "settings", label: "Settings", Icon: Settings, href: "/settings" },
              { key: "customize", label: "Customize navigation", Icon: Settings2, onClick: enterNavEditing },
            ] as const
          ).map((entry) => {
            const rowClass = cn(
              "flex cursor-pointer items-center rounded-[8px] border-0 bg-transparent text-body text-[var(--fg-2)] no-underline",
              "transition-colors duration-[var(--dur-fast)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]",
              collapsed ? "size-9 justify-center" : "w-full gap-3 px-3 py-2 text-start",
            );
            const content = (
              <>
                <entry.Icon size={collapsed ? 18 : 16} strokeWidth={1.6} className="shrink-0" />
                {!collapsed && <span className="truncate">{entry.label}</span>}
              </>
            );
            const control =
              "href" in entry ? (
                <Link href={entry.href} aria-label={collapsed ? entry.label : undefined} className={rowClass} onClick={onNavigate}>
                  {content}
                </Link>
              ) : (
                <button type="button" aria-label={collapsed ? entry.label : undefined} className={rowClass} onClick={entry.onClick}>
                  {content}
                </button>
              );
            return collapsed ? (
              <Tooltip key={entry.key}>
                <TooltipTrigger render={control} />
                <TooltipContent side="right" sideOffset={8}>
                  {entry.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div key={entry.key}>{control}</div>
            );
          })}
        </div>
      )}
      {/* ── Resize handle ────────────────────────── */}
      <button
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize border-0 p-0",
          "bg-transparent transition-colors duration-[var(--dur-fast)]",
          "hover:bg-border",
        )}
      />
    </aside>
    </TooltipProvider>
  );
}

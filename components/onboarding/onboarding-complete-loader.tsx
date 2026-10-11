"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BanknoteIcon,
  CheckCircle2Icon,
  CheckIcon,
  FileTextIcon,
  FolderPlusIcon,
  LayoutDashboardIcon,
  ReceiptTextIcon,
  SparklesIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ONBOARDING_TITLE_CLASS } from "@/components/shared/title-classes";
import {
  activeStepIndex,
  buildSetupSteps,
  isSetupTimelineComplete,
  revealFraction,
  SETUP_STEP_MS,
  setupProgress,
  stepStateAt,
  type SetupStep,
  type SetupStepId,
  type SetupStepState,
} from "@/lib/onboarding/setup-steps";

/**
 * Post-onboarding "setup ceremony": instead of a blank flash, the user watches a
 * colourful mock dashboard build itself — a revenue figure counts up, a paid-ring
 * sweeps, client avatars pop in, a sparkline draws and bars grow — while a
 * personalised checklist ticks each setup step on a fixed ~3.5s timeline. Activity
 * "pings" drift in around the edges and the whole thing celebrates with confetti
 * when it lands.
 *
 * Every animated value is derived from a single `elapsed` clock so the scene is
 * deterministic and can be frozen for Storybook / tests.
 */

/** Module palette — each step maps to a real Manpower module colour. */
const STEP_COLOR: Record<SetupStepId, string> = {
  workspace: "#3550E0", // brand blue
  client: "#7C5CFF", // violet — clients
  invoicing: "#12B5A6", // teal — finance / invoicing
  dashboard: "#F5A524", // amber — dashboard / tasks
  ready: "#F2557A", // rose — celebrate
};

const STEP_ICON: Record<SetupStepId, LucideIcon> = {
  workspace: FolderPlusIcon,
  client: UserPlusIcon,
  invoicing: FileTextIcon,
  dashboard: LayoutDashboardIcon,
  ready: SparklesIcon,
};

type OnboardingCompleteLoaderProps = {
  /** Real client name added during onboarding; personalizes the headline + step. */
  clientName?: string | null;
  /** Fired once when the staged timeline finishes — used to trigger navigation. */
  onComplete?: () => void;
  /**
   * Freeze the timeline at a fixed elapsed time (ms) for Storybook / tests so a
   * mid-progress state can be captured. When set, the internal ticker is disabled.
   */
  frozenElapsedMs?: number;
  className?: string;
};

const TICK_MS = 50;

export function OnboardingCompleteLoader({
  clientName,
  onComplete,
  frozenElapsedMs,
  className,
}: OnboardingCompleteLoaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const steps = useMemo(() => buildSetupSteps(clientName), [clientName]);
  const stepCount = steps.length;

  const isFrozen = frozenElapsedMs !== undefined;
  const [elapsed, setElapsed] = useState(frozenElapsedMs ?? 0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (isFrozen) {
      setElapsed(frozenElapsedMs);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), TICK_MS);
    return () => clearInterval(id);
  }, [isFrozen, frozenElapsedMs]);

  useEffect(() => {
    if (isFrozen || completedRef.current) return;
    if (isSetupTimelineComplete(elapsed, stepCount, SETUP_STEP_MS)) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [elapsed, isFrozen, onComplete, stepCount]);

  const active = activeStepIndex(elapsed, stepCount, SETUP_STEP_MS);
  const progress = setupProgress(elapsed, stepCount, SETUP_STEP_MS);
  const finished = isSetupTimelineComplete(elapsed, stepCount, SETUP_STEP_MS);
  const headlineName = clientName?.trim();

  // Portal to <body> — a glass/blur ancestor (e.g. the onboarding card's
  // backdrop-blur) creates a containing block for `position: fixed`,
  // trapping this overlay inside that box instead of the viewport.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex h-dvh w-full flex-col items-center justify-center gap-6 overflow-hidden bg-[var(--bg-canvas)] px-6 py-8",
        className,
      )}
      role="status"
      aria-label="Setting up your workspace"
    >
      <Aurora reduced={reduced} />
      <GridNoise />
      <Sparkles reduced={reduced} />
      <FloatingPings activeStep={active} reduced={reduced} />
      {finished && <Confetti reduced={reduced} />}

      <header className="relative z-10 flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fg-3)]">
          Setting things up
        </span>
        <h1 className={ONBOARDING_TITLE_CLASS}>
          Building{" "}
          <span className="bg-gradient-to-r from-[#3550E0] via-[#7C5CFF] to-[#F2557A] bg-clip-text text-transparent">
            {headlineName ? `${headlineName}’s` : "your"} workspace
          </span>
        </h1>
      </header>

      <LivingDashboard elapsed={elapsed} activeStep={active} reduced={reduced} />

      <div className="relative z-10 flex w-full max-w-md flex-col gap-3">
        <ol className="flex flex-col gap-1.5">
          {steps.map((step, index) => (
            <SetupStepRow
              key={step.id}
              step={step}
              state={stepStateAt(index, elapsed, stepCount, SETUP_STEP_MS)}
              reduced={reduced}
            />
          ))}
        </ol>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--accent-soft)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#3550E0] via-[#7C5CFF] via-[#12B5A6] to-[#F2557A] bg-[length:300%_100%]"
            initial={false}
            animate={{
              width: `${Math.round(progress * 100)}%`,
              backgroundPositionX: reduced ? "0%" : ["0%", "100%"],
            }}
            transition={{
              width: reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 120, damping: 22 },
              backgroundPositionX: reduced
                ? { duration: 0 }
                : { duration: 3, repeat: Infinity, ease: "linear" },
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            <motion.span
              key={statusLine(active, finished)}
              className="text-xs font-medium text-[var(--fg-3)]"
              initial={reduced ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              {statusLine(active, finished)}
            </motion.span>
          </AnimatePresence>
          <span className="font-mono text-xs font-semibold tabular-nums text-[var(--fg-2)]">
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Status copy that advances one line per setup step. */
const STATUS_LINES = [
  "Spinning up your studio…",
  "Adding your clients…",
  "Setting up invoicing & tax…",
  "Preparing your dashboard…",
  "Putting it all together…",
];

function statusLine(activeStep: number, finished: boolean): string {
  if (finished) return "Welcome aboard — let’s go!";
  return STATUS_LINES[Math.min(activeStep, STATUS_LINES.length - 1)];
}

/* ------------------------------------------------------------------ */
/* Checklist row                                                       */
/* ------------------------------------------------------------------ */

function SetupStepRow({
  step,
  state,
  reduced,
}: {
  step: SetupStep;
  state: SetupStepState;
  reduced: boolean;
}) {
  const color = STEP_COLOR[step.id];
  const Icon = STEP_ICON[step.id];

  return (
    <li className="flex items-center gap-3">
      <span className="relative flex size-7 shrink-0 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {state === "done" ? (
            <motion.span
              key="done"
              className="flex size-7 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: color }}
              initial={reduced ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 500, damping: 24 }
              }
            >
              <CheckIcon className="size-3.5" strokeWidth={3} />
            </motion.span>
          ) : state === "active" ? (
            <motion.span
              key="active"
              className="flex size-7 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}1F`, color }}
              initial={reduced ? false : { scale: 0.7, opacity: 0 }}
              animate={
                reduced
                  ? { scale: 1, opacity: 1 }
                  : {
                      scale: 1,
                      opacity: 1,
                      boxShadow: [
                        `0 0 0 0 ${color}55`,
                        `0 0 0 6px ${color}00`,
                      ],
                    }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      boxShadow: {
                        duration: 1.1,
                        repeat: Infinity,
                        ease: "easeOut",
                      },
                    }
              }
            >
              <Icon className="size-3.5" strokeWidth={2.5} />
            </motion.span>
          ) : (
            <span
              key="pending"
              className="flex size-7 items-center justify-center rounded-full text-[var(--fg-3)] opacity-45"
            >
              <Icon className="size-3.5" strokeWidth={2} />
            </span>
          )}
        </AnimatePresence>
      </span>

      <span
        className={cn(
          "text-sm font-medium transition-colors duration-300",
          state === "pending" && "text-[var(--fg-3)]",
          state === "done" && "text-[var(--fg-2)]",
        )}
        style={state === "active" ? { color } : undefined}
      >
        {step.label}
      </span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Living dashboard preview                                            */
/* ------------------------------------------------------------------ */

function LivingDashboard({
  elapsed,
  activeStep,
  reduced,
}: {
  elapsed: number;
  activeStep: number;
  reduced: boolean;
}) {
  // Each piece reveals/animates off the shared elapsed clock, so the whole
  // dashboard is deterministic and freezable.
  const revenue = Math.round(12480 * revealFraction(elapsed, 2, 2));
  const clients = Math.round(1 * revealFraction(elapsed, 1, 1));
  const ringPct = revealFraction(elapsed, 2, 2); // 0..1 donut sweep
  const sparkDraw = revealFraction(elapsed, 3, 1); // 0..1 path length
  const barGrow = revealFraction(elapsed, 3, 1); // 0..1 bar height

  const tileIn = (revealAt: number) =>
    reduced
      ? { opacity: activeStep >= revealAt ? 1 : 0, y: 0, scale: 1 }
      : activeStep >= revealAt
        ? { opacity: 1, y: 0, scale: 1 }
        : { opacity: 0, y: 10, scale: 0.96 };

  const tileSpring = reduced
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 260, damping: 22 } as const);

  return (
    <div className="relative z-10">
      <div className="w-[300px] rounded-[var(--radius-xl)] border border-[var(--accent-soft-2)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-lg)]">
        {/* window chrome */}
        <div className="mb-3 flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#F2557A]" />
          <span className="size-2 rounded-full bg-[#F5A524]" />
          <span className="size-2 rounded-full bg-[#12B5A6]" />
          <span className="ml-2 h-2 w-20 rounded-full bg-[var(--accent-soft-2)]" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Revenue KPI — counts up */}
          <motion.div
            className="col-span-1 flex flex-col gap-1 rounded-[var(--radius-md)] bg-[#12B5A6]/10 p-2.5"
            initial={false}
            animate={tileIn(2)}
            transition={tileSpring}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#0E9486]">
              Revenue
            </span>
            <span className="font-heading text-lg font-semibold leading-none text-foreground">
              ${revenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-[var(--fg-3)]">this month</span>
          </motion.div>

          {/* Donut ring — sweeps to fill */}
          <motion.div
            className="col-span-1 flex items-center gap-2.5 rounded-[var(--radius-md)] bg-[#7C5CFF]/10 p-2.5"
            initial={false}
            animate={tileIn(2)}
            transition={tileSpring}
          >
            <DonutRing pct={ringPct} />
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A47E8]">
                Paid
              </span>
              <span className="font-heading text-base font-semibold leading-none text-foreground">
                {Math.round(ringPct * 100)}%
              </span>
            </div>
          </motion.div>

          {/* Client chips — pop in */}
          <motion.div
            className="col-span-2 flex items-center justify-between rounded-[var(--radius-md)] bg-[#3550E0]/10 p-2.5"
            initial={false}
            animate={tileIn(1)}
            transition={tileSpring}
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#3550E0]">
                Clients
              </span>
              <span className="font-heading text-base font-semibold leading-none text-foreground">
                {clients}
              </span>
            </div>
            <div className="flex -space-x-2">
              {["#3550E0", "#7C5CFF", "#12B5A6"].map((c, i) => (
                <motion.span
                  key={c}
                  className="flex size-6 items-center justify-center rounded-full border-2 border-[var(--bg-surface)] text-[9px] font-bold text-white"
                  style={{ backgroundColor: c }}
                  initial={reduced ? false : { scale: 0, opacity: 0 }}
                  animate={
                    activeStep >= 1
                      ? { scale: 1, opacity: 1 }
                      : { scale: 0, opacity: 0 }
                  }
                  transition={
                    reduced
                      ? { duration: 0 }
                      : {
                          type: "spring",
                          stiffness: 500,
                          damping: 18,
                          delay: i * 0.08,
                        }
                  }
                >
                  {String.fromCharCode(65 + i)}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Sparkline — draws itself */}
          <motion.div
            className="col-span-1 flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-[#F5A524]/10 p-2.5"
            initial={false}
            animate={tileIn(3)}
            transition={tileSpring}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#C77F12]">
              Cash flow
            </span>
            <Sparkline draw={sparkDraw} reduced={reduced} />
          </motion.div>

          {/* Bar chart — bars grow up */}
          <motion.div
            className="col-span-1 flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-[#3550E0]/10 p-2.5"
            initial={false}
            animate={tileIn(3)}
            transition={tileSpring}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#3550E0]">
              Hours
            </span>
            <BarChart grow={barGrow} reduced={reduced} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function DonutRing({ pct }: { pct: number }) {
  const r = 13;
  const c = 2 * Math.PI * r;
  return (
    <svg width={34} height={34} viewBox="0 0 34 34" className="shrink-0">
      <circle
        cx={17}
        cy={17}
        r={r}
        fill="none"
        stroke="#7C5CFF22"
        strokeWidth={4}
      />
      <circle
        cx={17}
        cy={17}
        r={r}
        fill="none"
        stroke="#7C5CFF"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 17 17)"
      />
    </svg>
  );
}

function Sparkline({ draw, reduced }: { draw: number; reduced: boolean }) {
  // A jaunty upward path that draws in via strokeDashoffset.
  const d = "M2 26 L14 18 L26 22 L38 10 L50 14 L62 4";
  const len = 90;
  return (
    <svg width="100%" height={28} viewBox="0 0 64 28" preserveAspectRatio="none">
      <path
        d={d}
        fill="none"
        stroke="#F5A524"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={reduced ? 0 : len * (1 - draw)}
      />
    </svg>
  );
}

function BarChart({ grow, reduced }: { grow: number; reduced: boolean }) {
  const bars = [0.45, 0.7, 0.35, 0.9, 0.6];
  return (
    <div className="flex h-7 items-end gap-1">
      {bars.map((h, i) => {
        // Each bar grows slightly after the previous for a cascading rise.
        const local = reduced
          ? 1
          : Math.min(1, Math.max(0, grow * bars.length - i));
        return (
          <span
            key={i}
            className="flex-1 rounded-[2px] bg-[#3550E0]"
            style={{ height: `${Math.max(6, h * local * 100)}%` }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating activity pings (fill the empty side space)                 */
/* ------------------------------------------------------------------ */

type Ping = {
  id: string;
  label: string;
  sub: string;
  color: string;
  icon: LucideIcon;
  revealAt: number;
  /** Tailwind position classes — scattered around the central column. */
  pos: string;
};

const PINGS: Ping[] = [
  {
    id: "ws",
    label: "Workspace created",
    sub: "Ready to roll",
    color: "#3550E0",
    icon: FolderPlusIcon,
    revealAt: 0,
    pos: "left-[6%] top-[20%]",
  },
  {
    id: "client",
    label: "New client added",
    sub: "Saved to CRM",
    color: "#7C5CFF",
    icon: UserPlusIcon,
    revealAt: 1,
    pos: "right-[7%] top-[16%]",
  },
  {
    id: "invoice",
    label: "Invoice paid",
    sub: "+ $1,200.00",
    color: "#12B5A6",
    icon: BanknoteIcon,
    revealAt: 2,
    pos: "left-[8%] top-[58%]",
  },
  {
    id: "tax",
    label: "Tax configured",
    sub: "VAT 5% • UAE",
    color: "#F5A524",
    icon: ReceiptTextIcon,
    revealAt: 2,
    pos: "right-[6%] top-[62%]",
  },
  {
    id: "task",
    label: "Task complete",
    sub: "Onboarding done",
    color: "#F2557A",
    icon: CheckCircle2Icon,
    revealAt: 3,
    pos: "right-[12%] top-[40%]",
  },
];

function FloatingPings({
  activeStep,
  reduced,
}: {
  activeStep: number;
  reduced: boolean;
}) {
  return (
    // Hidden on small screens (no room); fills the wide negative space on desktop.
    <div aria-hidden className="absolute inset-0 z-10 hidden lg:block">
      <AnimatePresence>
        {PINGS.filter((p) => activeStep >= p.revealAt).map((p) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.id}
              className={cn(
                "absolute flex items-center gap-2.5 rounded-[var(--radius-lg)] border border-[var(--accent-soft-2)] bg-[var(--bg-surface)] px-3 py-2 shadow-[var(--shadow-md)]",
                p.pos,
              )}
              initial={
                reduced ? { opacity: 1 } : { opacity: 0, scale: 0.8, y: 14 }
              }
              animate={
                reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: [0, -6, 0] }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      opacity: { duration: 0.3 },
                      scale: { type: "spring", stiffness: 400, damping: 20 },
                      y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    }
              }
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: p.color }}
              >
                <Icon className="size-3.5" strokeWidth={2.5} />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-foreground">
                  {p.label}
                </span>
                <span className="text-[11px] text-[var(--fg-3)]">{p.sub}</span>
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Atmosphere                                                          */
/* ------------------------------------------------------------------ */

function GridNoise() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 opacity-[0.4] [background-image:radial-gradient(var(--accent-soft-2)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
    />
  );
}

function Sparkles({ reduced }: { reduced: boolean }) {
  const colors = ["#3550E0", "#7C5CFF", "#12B5A6", "#F5A524", "#F2557A"];
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        top: `${(i * 53) % 100}%`,
        left: `${(i * 37 + 7) % 100}%`,
        color: colors[i % colors.length],
        delay: (i % 9) * 0.3,
        size: 3 + (i % 3) * 2,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (reduced) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full"
          style={{
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            backgroundColor: d.color,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0] }}
          transition={{
            duration: 2.6,
            delay: d.delay,
            repeat: Infinity,
            repeatDelay: 1.4,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function Aurora({ reduced }: { reduced: boolean }) {
  const blobs = [
    { c: "#3550E0", x: "8%", y: "14%", s: 320 },
    { c: "#7C5CFF", x: "78%", y: "10%", s: 280 },
    { c: "#12B5A6", x: "82%", y: "74%", s: 300 },
    { c: "#F2557A", x: "12%", y: "78%", s: 260 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      {blobs.map((b, i) => (
        <motion.div
          key={b.c}
          className="absolute rounded-full opacity-[0.18] blur-3xl"
          style={{
            left: b.x,
            top: b.y,
            width: b.s,
            height: b.s,
            backgroundColor: b.c,
          }}
          animate={
            reduced
              ? undefined
              : {
                  x: [0, 24, -16, 0],
                  y: [0, -20, 18, 0],
                  scale: [1, 1.12, 0.95, 1],
                }
          }
          transition={
            reduced
              ? undefined
              : {
                  duration: 9 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}

function Confetti({ reduced }: { reduced: boolean }) {
  const colors = ["#3550E0", "#7C5CFF", "#12B5A6", "#F5A524", "#F2557A"];
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        color: colors[i % colors.length],
        delay: (i % 6) * 0.05,
        drift: ((i * 53) % 60) - 30,
        rotate: (i * 71) % 360,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (reduced) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-[-5%] block size-2 rounded-[2px]"
          style={{ left: p.left, backgroundColor: p.color }}
          initial={{ y: "-10%", opacity: 0, rotate: 0 }}
          animate={{
            y: "110vh",
            x: p.drift,
            opacity: [0, 1, 1, 0],
            rotate: p.rotate,
          }}
          transition={{
            duration: 2.4,
            delay: p.delay,
            ease: "easeIn",
            repeat: Infinity,
            repeatDelay: 0.6,
          }}
        />
      ))}
    </div>
  );
}

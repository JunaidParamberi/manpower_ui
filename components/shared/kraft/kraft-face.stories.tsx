import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { KRAFT_EMOTIONS, type KraftEmotion } from "@/lib/kraft/emotions";
import { mascotStatusLine } from "@/lib/ai-panel/mascot-state";
import { KraftFace } from "./kraft-face";

const meta: Meta<typeof KraftFace> = {
  title: "Shared/Kraft/KraftFace",
  component: KraftFace,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Kraft, Manpower's assistant character: a flat squircle in the brand blue with two pill eyes — " +
          "no mouth, gradient or shine. Every feeling comes from eye shape (open height, eyelid cut and tilt, " +
          "happy `^^` arcs) and body motion (bob, hop, shake, pop), plus small accent marks. Live faces share " +
          "one rAF ticker, blink, glance around and follow the pointer in friendly emotions. " +
          "**Use** it wherever the AI assistant is present: the pill (30px), turn avatars (28px), drawer header " +
          "(40px) and empty state (80px). **Don't use** it as a generic AI sparkle on other surfaces " +
          "(marketing dialogs, health panels keep `<AIThinking>`), and never as the only label — it is `aria-hidden`.",
      },
    },
  },
  args: { emotion: "idle", size: 80, live: true },
  argTypes: {
    emotion: { control: "select", options: KRAFT_EMOTIONS },
    size: { control: { type: "range", min: 20, max: 160, step: 4 } },
  },
};

export default meta;
type Story = StoryObj<typeof KraftFace>;

/** Single face — use the controls to try every emotion and size. */
export const Playground: Story = {};

function EmotionSheet({ size, live = true }: { size: number; live?: boolean }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3">
      {KRAFT_EMOTIONS.map((emotion) => (
        <div
          key={emotion}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-2 pt-3.5 pb-3 text-center"
        >
          <KraftFace emotion={emotion} size={size} live={live} />
          <code className="font-[family-name:var(--font-mono)] text-[11.5px] text-[var(--border-focus)]">{emotion}</code>
          <span className="text-xs text-[var(--fg-2)]">{mascotStatusLine(emotion, null)}</span>
        </div>
      ))}
    </div>
  );
}

/** All 11 emotions at the pill size. */
export const Emotions32: Story = {
  name: "All emotions · 32px",
  render: () => <EmotionSheet size={32} />,
  parameters: { layout: "padded" },
};

/** All 11 emotions at the drawer-header size. */
export const Emotions40: Story = {
  name: "All emotions · 40px",
  render: () => <EmotionSheet size={40} />,
  parameters: { layout: "padded" },
};

/** All 11 emotions at the empty-state size, where the detail reads best. */
export const Emotions80: Story = {
  name: "All emotions · 80px",
  render: () => <EmotionSheet size={80} />,
  parameters: { layout: "padded" },
};

function Cycler() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % KRAFT_EMOTIONS.length), 1800);
    return () => clearInterval(timer);
  }, []);
  const emotion: KraftEmotion = KRAFT_EMOTIONS[index];
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid size-[200px] place-items-center rounded-full bg-[var(--bg-subtle)]">
        <KraftFace emotion={emotion} size={120} />
      </div>
      <code className="font-[family-name:var(--font-mono)] text-sm text-[var(--border-focus)]">{emotion}</code>
      <span className="text-sm text-[var(--fg-2)]">{mascotStatusLine(emotion, "Searching invoices…")}</span>
    </div>
  );
}

/** Steps through every emotion so transitions and impulses (hop, shake, pop) are visible. */
export const EmotionCycler: Story = {
  render: () => <Cycler />,
};

/** Same sheet on the dark theme — the body uses the dark accent, eyes stay on-accent white. */
export const DarkMode: Story = {
  render: () => <EmotionSheet size={40} />,
  globals: { theme: "Dark" },
  parameters: { layout: "padded" },
};

/**
 * What users with `prefers-reduced-motion` see: each emotion's resting pose
 * with no bob, blinks, impulses or accent loops. The face switches to this
 * automatically from the OS setting; `live={false}` shows the same thing.
 */
export const ReducedMotion: Story = {
  render: () => <EmotionSheet size={40} live={false} />,
  parameters: { layout: "padded" },
};

/** The sizes used in the product, side by side. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6 text-xs text-[var(--fg-3)]">
      {[
        [28, "Turn avatar · 28px"],
        [30, "Pill · 30px"],
        [40, "Drawer header · 40px"],
        [80, "Empty state · 80px"],
      ].map(([size, label]) => (
        <figure key={label} className="m-0 flex flex-col items-center gap-1.5">
          <KraftFace emotion="idle" size={Number(size)} />
          <figcaption>{label}</figcaption>
        </figure>
      ))}
    </div>
  ),
};

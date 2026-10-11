"use client";

import { motion } from "framer-motion";

import { AMBIENT_COLORS } from "./palette";

type AuroraDensity = "soft" | "default";

const BLOBS = [
  { c: AMBIENT_COLORS.blue, x: "8%", y: "14%", s: 320 },
  { c: AMBIENT_COLORS.violet, x: "78%", y: "10%", s: 280 },
  { c: AMBIENT_COLORS.teal, x: "82%", y: "74%", s: 300 },
  { c: AMBIENT_COLORS.rose, x: "12%", y: "78%", s: 260 },
];

const DENSITY_OPACITY: Record<AuroraDensity, number> = {
  default: 0.18,
  soft: 0.1,
};

/**
 * Drifting blurred colour blobs, ported from the onboarding-complete loader.
 * `density="soft"` drops the dimmest blob and lowers opacity for use behind
 * real form content where legibility matters more than spectacle.
 */
export function Aurora({
  reduced,
  density = "default",
}: {
  reduced: boolean;
  density?: AuroraDensity;
}) {
  const blobs = density === "soft" ? BLOBS.slice(0, 3) : BLOBS;
  const opacity = DENSITY_OPACITY[density];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {blobs.map((b, i) => (
        <motion.div
          key={b.c}
          className="absolute rounded-full blur-3xl"
          style={{
            left: b.x,
            top: b.y,
            width: b.s,
            height: b.s,
            backgroundColor: b.c,
            opacity,
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
              : { duration: 9 + i * 2, repeat: Infinity, ease: "easeInOut" }
          }
        />
      ))}
    </div>
  );
}

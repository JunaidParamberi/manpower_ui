"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

import { AMBIENT_PALETTE } from "./palette";

type SparklesDensity = "soft" | "default";

const DENSITY_COUNT: Record<SparklesDensity, number> = {
  default: 18,
  soft: 10,
};

/** Drifting twinkle dots in the module palette, ported from the loader. */
export function Sparkles({
  reduced,
  density = "default",
}: {
  reduced: boolean;
  density?: SparklesDensity;
}) {
  const count = DENSITY_COUNT[density];
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: `${(i * 53) % 100}%`,
        left: `${(i * 37 + 7) % 100}%`,
        color: AMBIENT_PALETTE[i % AMBIENT_PALETTE.length],
        delay: (i % 9) * 0.3,
        size: 3 + (i % 3) * 2,
      })),
    [count],
  );

  if (reduced) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
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

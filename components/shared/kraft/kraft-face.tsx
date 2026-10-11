"use client";

import { useEffect, useId, useRef } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import {
  IMPULSE,
  KRAFT_ACCENTS,
  TRACK,
  targetParams,
  type KraftAccent,
  type KraftEmotion,
  type KraftImpulseKind,
  type KraftParams,
} from "@/lib/kraft/emotions";
import {
  blinkFactor,
  bodyTransform,
  eyeGeometry,
  gazeToward,
  impulseOffset,
  stepParams,
  type EyeSide,
} from "@/lib/kraft/rig";
import {
  getKraftPointer,
  getKraftPointerActivityAt,
  getKraftScrollEpoch,
  useKraftTicker,
} from "@/components/shared/kraft/use-kraft-ticker";

type KraftFaceProps = {
  emotion: KraftEmotion;
  /** Rendered width and height in px. */
  size: number;
  /**
   * Animate the face (bob, blinks, eased transitions, cursor tracking,
   * impulses). Static faces render the emotion's resting pose and cost
   * nothing per frame — use them for frozen avatars on older turns.
   */
  live?: boolean;
  className?: string;
};

type FaceState = {
  params: KraftParams;
  impulse: { kind: KraftImpulseKind; startedAt: number } | null;
  seed: number;
  glance: [number, number];
  nextGlanceAt: number;
  nextBlinkAt: number;
  blinkAt: number | null;
  rect: DOMRect | null;
  rectAt: number;
  rectEpoch: number;
};

const SIDES: EyeSide[] = [0, 1];

function star(cx: number, cy: number, r: number): string {
  const k = r * 0.1;
  return (
    `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} ` +
    `Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} ` +
    `Q${cx - k} ${cy - k} ${cx} ${cy - r} Z`
  );
}

function accentOpacity(params: KraftParams, accent: KraftAccent): string {
  return Math.max(0, Math.min(1, params[accent])).toFixed(2);
}

/**
 * Kraft, Manpower's assistant: a flat squircle in the brand blue with two
 * pill eyes. All emotion comes from eye shape and body motion (see
 * `lib/kraft/emotions.ts` and `lib/kraft/rig.ts`). Values are written as SVG
 * attributes from a shared rAF ticker — never inline styles — and the face
 * is `aria-hidden`: pair it with visible or screen-reader text.
 */
export function KraftFace({ emotion, size, live = true, className }: KraftFaceProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const animated = live && !reducedMotion;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const svgRef = useRef<SVGSVGElement | null>(null);
  const poseRef = useRef<SVGGElement | null>(null);
  const eyeRefs = useRef<(SVGRectElement | null)[]>([]);
  const lidRefs = useRef<(SVGPolygonElement | null)[]>([]);
  const arcRefs = useRef<(SVGPathElement | null)[]>([]);
  const accentRefs = useRef<Partial<Record<KraftAccent, SVGGElement | null>>>({});

  const target = targetParams(emotion);
  const stateRef = useRef<FaceState | null>(null);
  if (stateRef.current === null) {
    stateRef.current = {
      params: target,
      impulse: null,
      seed: Math.random() * 1000,
      glance: [0, 0],
      nextGlanceAt: 0,
      nextBlinkAt: 0,
      blinkAt: null,
      rect: null,
      rectAt: 0,
      rectEpoch: -1,
    };
  }

  // Entering an emotion with an impulse (hop, shake, pop) plays it once.
  const previousEmotion = useRef(emotion);
  useEffect(() => {
    const face = stateRef.current;
    if (!face || previousEmotion.current === emotion) {
      return;
    }
    previousEmotion.current = emotion;
    const kind = IMPULSE[emotion];
    face.impulse = kind && animated ? { kind, startedAt: performance.now() } : null;
    if (!animated) {
      face.params = targetParams(emotion);
    }
  }, [emotion, animated]);

  useKraftTicker((now, dt) => {
    const face = stateRef.current;
    const svg = svgRef.current;
    if (!face || !svg) {
      return;
    }

    // Gaze: emotion target + pointer tracking + idle glances.
    let gx = target.gx;
    let gy = target.gy;
    const tracking = TRACK[emotion] ?? 0;
    const pointer = getKraftPointer();
    if (tracking && pointer) {
      const epoch = getKraftScrollEpoch();
      if (!face.rect || now - face.rectAt > 400 || face.rectEpoch !== epoch) {
        face.rect = svg.getBoundingClientRect();
        face.rectAt = now;
        face.rectEpoch = epoch;
      }
      if (face.rect.width) {
        const { tx, ty } = gazeToward(
          { x: face.rect.left + face.rect.width / 2, y: face.rect.top + face.rect.height / 2 },
          pointer,
        );
        gx += tx * tracking;
        gy += ty * tracking;
      }
    }
    if (emotion === "idle") {
      if (now > face.nextGlanceAt) {
        face.glance =
          Math.random() < 0.35 ? [0, 0] : [(Math.random() * 2 - 1) * 0.9, (Math.random() * 2 - 1) * 0.6];
        face.nextGlanceAt = now + 1800 + Math.random() * 3500;
      }
      const pointerRecentlyMoved = pointer !== null && now - getKraftPointerActivityAt() < 1500;
      if (!pointerRecentlyMoved) {
        gx += face.glance[0];
        gy += face.glance[1];
      }
    }
    face.params = stepParams(face.params, target, dt, { gx, gy });
    const params = face.params;

    // Blinks every 2.4–5.6s; none while happy or asleep.
    if (face.nextBlinkAt === 0) {
      face.nextBlinkAt = now + 800 + Math.random() * 3000;
    }
    if (now > face.nextBlinkAt && emotion !== "sleepy" && params.happy < 0.5) {
      face.blinkAt = now;
      face.nextBlinkAt = now + 2400 + Math.random() * 3200;
    }
    let blink = 1;
    if (face.blinkAt !== null) {
      const factor = blinkFactor(now - face.blinkAt);
      if (factor === null) {
        face.blinkAt = null;
      } else {
        blink = factor;
      }
    }

    let impulse = null;
    if (face.impulse) {
      impulse = impulseOffset(face.impulse.kind, now - face.impulse.startedAt);
      if (impulse === null) {
        face.impulse = null;
      }
    }

    for (const side of SIDES) {
      const eye = eyeGeometry(params, side, blink);
      const rect = eyeRefs.current[side];
      if (rect) {
        rect.setAttribute("x", eye.x.toFixed(2));
        rect.setAttribute("y", eye.y.toFixed(2));
        rect.setAttribute("width", eye.width.toFixed(2));
        rect.setAttribute("height", eye.height.toFixed(2));
        rect.setAttribute("rx", eye.rx.toFixed(2));
        rect.setAttribute("opacity", eye.eyeOpacity.toFixed(2));
      }
      lidRefs.current[side]?.setAttribute("points", eye.lidPoints);
      const arc = arcRefs.current[side];
      if (arc) {
        arc.setAttribute("d", eye.arcPath);
        arc.setAttribute("opacity", eye.arcOpacity.toFixed(2));
      }
    }
    poseRef.current?.setAttribute("transform", bodyTransform(params, emotion, impulse, now, face.seed));
    for (const accent of KRAFT_ACCENTS) {
      accentRefs.current[accent]?.setAttribute("opacity", accentOpacity(params, accent));
    }
  }, animated);

  // Server render and static faces: the emotion's resting pose.
  const resting = animated ? (stateRef.current?.params ?? target) : target;
  const eyes = SIDES.map((side) => eyeGeometry(resting, side));
  const accent = (key: KraftAccent) => (node: SVGGElement | null) => {
    accentRefs.current[key] = node;
  };

  return (
    <svg
      ref={svgRef}
      className={cn("kraft-face", className)}
      data-emotion={emotion}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <g ref={accent("ring")} className="kraft-face__ring" opacity={accentOpacity(resting, "ring")}>
        <path d={star(32, 6, 2.6)} />
        <path d={star(32, 62, 2)} />
      </g>
      <g ref={poseRef} transform={bodyTransform(resting, emotion, null, 0, 0, true)}>
        <rect className="kraft-face__body" x="10" y="12" width="44" height="44" rx="15" />
        {SIDES.map((side) => {
          const eye = eyes[side];
          const clipId = `kraft-${uid}-lid-${side}`;
          return (
            <g key={side}>
              <clipPath id={clipId}>
                <polygon
                  ref={(node) => {
                    lidRefs.current[side] = node;
                  }}
                  points={eye.lidPoints}
                />
              </clipPath>
              <g clipPath={`url(#${clipId})`}>
                <rect
                  ref={(node) => {
                    eyeRefs.current[side] = node;
                  }}
                  className="kraft-face__eye"
                  x={eye.x.toFixed(2)}
                  y={eye.y.toFixed(2)}
                  width={eye.width.toFixed(2)}
                  height={eye.height.toFixed(2)}
                  rx={eye.rx.toFixed(2)}
                  opacity={eye.eyeOpacity.toFixed(2)}
                />
              </g>
              <path
                ref={(node) => {
                  arcRefs.current[side] = node;
                }}
                className="kraft-face__arc"
                d={eye.arcPath}
                opacity={eye.arcOpacity.toFixed(2)}
                fill="none"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </g>
      <g ref={accent("dots")} className="kraft-face__dots" opacity={accentOpacity(resting, "dots")}>
        <circle cx="50" cy="10" r="2" />
        <circle cx="56" cy="7.5" r="2" />
        <circle cx="62" cy="5" r="2" />
      </g>
      <g ref={accent("zzz")} className="kraft-face__zzz" opacity={accentOpacity(resting, "zzz")}>
        <text x="47" y="15" fontSize="9">
          z
        </text>
        <text x="54" y="8" fontSize="7">
          z
        </text>
      </g>
      <g ref={accent("q")} className="kraft-face__q" opacity={accentOpacity(resting, "q")}>
        <text x="50" y="15" fontSize="14">
          ?
        </text>
      </g>
      <g ref={accent("bang")} className="kraft-face__bang" opacity={accentOpacity(resting, "bang")}>
        <text x="51" y="15" fontSize="14">
          !
        </text>
      </g>
      <g ref={accent("spark")} className="kraft-face__spark" opacity={accentOpacity(resting, "spark")}>
        <path d={star(8, 14, 4)} />
        <path d={star(57, 18, 3)} />
      </g>
    </svg>
  );
}

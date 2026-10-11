import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock,
  HeartCrack,
  Send,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type { ComponentType } from "react";

import { AiIcon } from "@/components/shared/ai-icon";
import type { NotificationType } from "@/types";

/**
 * Lucide icons and the app's own AiIcon both satisfy this, so an AI-authored
 * notification can carry the product's AI mark instead of a generic sparkle.
 */
type NotificationIcon = ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

/**
 * Colour carries meaning here, it does not decorate: green means money
 * arrived, red means something is wrong, amber means a clock is running, and
 * the brand accent is reserved for the one surface the AI authors — the daily
 * brief. Everything resolves to a token in styles/tokens.css so the panel
 * reads as part of the app rather than stock Tailwind dropped into it.
 *
 * Note `text-primary` for the brand blue, not `var(--accent)`: globals.css
 * re-points --accent at --accent-soft for shadcn's hover backgrounds, so
 * `text-[var(--accent)]` silently renders the pale tint. See the alias block
 * in styles/globals.css.
 */
export const NOTIFICATION_STYLES: Record<
  NotificationType,
  {
    icon: NotificationIcon;
    container: string;
    iconClass: string;
  }
> = {
  invoice_paid: {
    icon: CheckCircle2,
    container: "bg-[var(--success-soft)]",
    iconClass: "text-[var(--success)]",
  },
  invoice_overdue: {
    icon: AlertCircle,
    container: "bg-[var(--danger-soft)]",
    iconClass: "text-[var(--danger)]",
  },
  quote_approved: {
    icon: ThumbsUp,
    container: "bg-[var(--success-soft)]",
    iconClass: "text-[var(--success)]",
  },
  proposal_approved: {
    icon: ThumbsUp,
    container: "bg-[var(--success-soft)]",
    iconClass: "text-[var(--success)]",
  },
  quote_declined: {
    icon: ThumbsDown,
    container: "bg-[var(--danger-soft)]",
    iconClass: "text-[var(--danger)]",
  },
  doc_sent: {
    icon: Send,
    container: "bg-[var(--info-soft)]",
    iconClass: "text-[var(--info)]",
  },
  task_due: {
    icon: Clock,
    container: "bg-[var(--warning-soft)]",
    iconClass: "text-[var(--warning)]",
  },
  task_overdue: {
    icon: Clock,
    container: "bg-[var(--danger-soft)]",
    iconClass: "text-[var(--danger)]",
  },
  daily_digest: {
    // The brief is written by the assistant, so it carries the app's AI mark —
    // the same glyph used on AI affordances elsewhere (attention cards, the AI
    // panel), not a generic Lucide sparkle.
    icon: AiIcon,
    container: "bg-[var(--accent-soft)]",
    iconClass: "text-primary",
  },
  follow_up_pending: {
    icon: BellRing,
    container: "bg-[var(--warning-soft)]",
    iconClass: "text-[var(--warning)]",
  },
  client_health_drop: {
    icon: HeartCrack,
    container: "bg-[var(--danger-soft)]",
    iconClass: "text-[var(--danger)]",
  },
};

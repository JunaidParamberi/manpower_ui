import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  headline: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  icon: Icon = Inbox,
  headline,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        padding: "48px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "var(--bg-subtle)",
          color: "var(--fg-3)",
          display: "grid",
          placeItems: "center",
          marginBottom: 12,
        }}
      >
        <Icon size={22} strokeWidth={1.6} />
      </div>
      <h3
        style={{
          fontSize: 17,
          fontWeight: 500,
          color: "var(--fg)",
          margin: "0 0 4px",
        }}
      >
        {headline}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 13,
            color: "var(--fg-2)",
            maxWidth: 280,
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: 16 }}>{action}</div>
      )}
    </div>
  );
}

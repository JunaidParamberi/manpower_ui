import { cn } from "@/lib/utils";

const STEP_LABELS = ["Your profile", "Brand kit", "First client"] as const;

export function OnboardingProgressStrip({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-3">
      {STEP_LABELS.map((label, i) => {
        const idx = (i + 1) as 1 | 2 | 3;
        const reached = idx <= step;
        const current = idx === step;
        return (
          <div key={label} className="flex flex-1 flex-col gap-2">
            <div
              className={cn(
                "h-[3px] rounded-full transition-colors",
                reached ? "bg-primary" : "bg-[var(--bg-subtle)]",
              )}
            />
            <div
              className={cn(
                "text-[11px] transition-colors",
                current
                  ? "font-medium text-foreground"
                  : "text-[var(--fg-3)]",
              )}
            >
              {idx}. {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

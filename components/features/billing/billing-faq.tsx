"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from the billing portal at any time. You keep full access until the end of your paid period — no prorating, no cancellation fees.",
  },
  {
    q: "What happens when I hit a plan limit?",
    a: "You'll see a clear warning before hitting the limit. Nothing breaks — you're prompted to upgrade, and you can continue once you do.",
  },
  {
    q: "Is my data safe if I downgrade?",
    a: "All your data is preserved when you downgrade. You may lose access to certain features, but nothing is deleted. Upgrade again at any time to restore access.",
  },
  {
    q: "Do you offer refunds?",
    a: "We don't offer refunds for partial periods, but you can cancel before your next renewal and won't be charged again.",
  },
];

export function BillingFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mt-10 border-t border-border pt-8">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Common questions
      </p>
      <div className="flex flex-col gap-1">
        {FAQS.map((faq, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-border">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-muted/40"
            >
              {faq.q}
              <ChevronDown
                className={cn(
                  "ml-3 size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                  open === i && "rotate-180",
                )}
                strokeWidth={1.6}
              />
            </button>
            {open === i && (
              <div className="border-t border-border px-4 pb-3 pt-2.5 text-[13px] leading-relaxed text-muted-foreground">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

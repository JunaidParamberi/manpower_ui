"use client";

import { AiComposer } from "@/components/features/ai-panel/ai-composer";
import { AiThread } from "@/components/features/ai-panel/ai-thread";

/**
 * Shared body for the AI panel: a scrollable turn thread above a pinned
 * composer. Consumers (e.g. the panel shell/sheet) are responsible for
 * sizing/positioning this within their own layout — this component only
 * owns the internal flex column.
 */
export function AiPanelBody() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <AiThread />
      </div>
      <AiComposer />
    </div>
  );
}

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import { useKraftMascot } from "@/lib/ai-panel/kraft-mascot-context";
import { rehypeFadeWords } from "@/lib/ai-panel/rehype-fade-words";
import { tidyAssistantText } from "@/lib/ai-panel/tidy-text";
import { extractChoices } from "@/lib/ai-panel/choices";
import { useSmoothText } from "@/hooks/use-smooth-text";

type AiTextResponseProps = {
  text: string;
  streaming: boolean;
};

const COMPONENTS = {
  a: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  ),
  code: ({ className, children, ...rest }: React.HTMLAttributes<HTMLElement>) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <pre className="rounded-lg border border-[var(--border)] bg-[var(--bg-canvas)] p-3 text-sm overflow-x-auto">
          <code className={className} {...rest}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code className="rounded bg-[var(--bg-surface)] px-1 py-0.5 font-mono text-[13px]" {...rest}>
        {children}
      </code>
    );
  },
};

const FADE_PLUGINS = [rehypeFadeWords];

/**
 * Kraft's live status ("Thinking…", "Looking up invoices…") with the shimmer
 * sweep, shown before the first word. The turn's live Kraft avatar sits
 * beside it, so together they replace `<AIThinking>` inside the panel.
 */
function KraftStatusLine() {
  const { statusLine, emotion } = useKraftMascot();
  const text = emotion === "idle" || emotion === "greet" ? "Thinking…" : statusLine;
  return (
    <p className="kraft-step__shimmer py-1 text-[13px] font-medium" role="status">
      {text}
    </p>
  );
}

/**
 * Renders assistant text as Markdown. While a reply streams in, words are
 * released at a steady pace (`useSmoothText`) and each one fades in, so the
 * answer flows instead of jumping chunk by chunk. Replies are tidied
 * (`tidyAssistantText`) so a stray em dash never reaches the screen.
 */
export function AiTextResponse({ text: raw, streaming }: AiTextResponseProps) {
  // `[[choice: …]]` lines become buttons (AiChoiceButtons), not prose.
  const text = extractChoices(raw).body;
  const shown = useSmoothText(text, streaming);
  const revealing = streaming || shown.length < text.length;

  if (revealing && shown.length === 0) {
    return <KraftStatusLine />;
  }

  return (
    <div className={cn("ai-prose max-w-none text-foreground", revealing && "kraft-revealing")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={revealing ? FADE_PLUGINS : undefined}
        components={COMPONENTS}
      >
        {tidyAssistantText(shown)}
      </ReactMarkdown>
    </div>
  );
}

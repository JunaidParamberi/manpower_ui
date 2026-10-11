"use client";

import { useState } from "react";

import { AIThinking } from "@/components/shared/ai-thinking";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAIStream } from "@/hooks/use-ai-stream";
import type { AIStreamState } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

export type AIStreamPreviewDisplayState = AIStreamState;

type AIStreamPreviewProps = {
  /** Storybook-only: render fixed visual state without calling the API. */
  displayState?: AIStreamPreviewDisplayState;
  className?: string;
};

function AIStreamOutput({
  state,
}: {
  state: AIStreamPreviewDisplayState;
}) {
  if (state.status === "error" && state.error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {state.error}
      </p>
    );
  }

  const hasRoute = state.route != null;
  const hasText = state.text.length > 0;

  if (!hasText && !hasRoute && state.status !== "streaming") {
    return (
      <p className="text-sm text-muted-foreground">
        Response will appear here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {hasText ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {state.text}
        </p>
      ) : null}
      {hasRoute && state.route ? (
        <dl className="grid gap-1 text-sm text-muted-foreground">
          <div>
            <dt className="sr-only">Agent</dt>
            <dd>
              <span className="font-medium text-foreground">
                {state.route.agent}
              </span>
              {" · "}
              {Math.round(state.route.confidence * 100)}% confidence
            </dd>
          </div>
          <div>
            <dt className="sr-only">Summary</dt>
            <dd>{state.route.payload.summary}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

export function AIStreamPreview({
  displayState,
  className,
}: AIStreamPreviewProps) {
  const live = useAIStream();
  const [prompt, setPrompt] = useState("Draft a friendly invoice follow-up email.");

  const state = displayState ?? {
    status: live.status,
    text: live.text,
    route: live.route,
    error: live.error,
    donePayload: live.donePayload,
  };

  const isStreaming = state.status === "streaming";
  const isControlled = displayState !== undefined;

  return (
    <Card
      size="sm"
      className={cn("w-full border border-border shadow-xs", className)}
    >
      <CardHeader className="pb-0">
        <CardTitle>Stream preview</CardTitle>
        <CardDescription>
          Preview how AI responses stream in word by word.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-0">
        {!isControlled ? (
          <InputGroup className="w-full">
            <InputGroupInput
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Enter a prompt…"
              disabled={isStreaming}
              aria-label="AI prompt"
            />
            <InputGroupAddon align="inline-end" className="gap-1 pe-1">
              {isStreaming ? (
                <InputGroupButton type="button" onClick={live.abort}>
                  Stop
                </InputGroupButton>
              ) : (
                <InputGroupButton type="button" onClick={live.reset}>
                  Reset
                </InputGroupButton>
              )}
              <InputGroupButton
                type="button"
                onClick={() => void live.stream({ prompt })}
                disabled={isStreaming || prompt.trim().length === 0}
              >
                Send
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        ) : null}

        {isStreaming ? <AIThinking label="Streaming response…" /> : null}

        <div className="min-h-24 rounded-lg border border-border bg-muted/30 p-4">
          <AIStreamOutput state={state} />
        </div>
      </CardContent>
    </Card>
  );
}

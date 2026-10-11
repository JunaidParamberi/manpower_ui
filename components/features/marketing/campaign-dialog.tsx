"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AIThinking } from "@/components/shared/ai-thinking";
import { FormDatePicker } from "@/components/shared/form-date-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAIStream } from "@/hooks/use-ai-stream";
import { saveGeneratedCampaign } from "@/lib/marketing/campaign-actions";
import { cn } from "@/lib/utils";
import {
  contentCampaignSchema,
  type ContentCampaignInput,
} from "@/lib/validations/content-campaign";

type CampaignFormValues = z.input<typeof contentCampaignSchema>;

const CADENCE_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

type CampaignDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Array<{ id: string; name: string }>;
};

const DEFAULT_VALUES: CampaignFormValues = {
  name: "",
  goal: "",
  clientId: null,
  startDate: "",
  endDate: "",
  platforms: [],
  cadencePerWeek: 3,
};

/**
 * No co-located Storybook story: this is a pure orchestration component
 * wired directly to the server action saveGeneratedCampaign, the Next.js
 * router (router.refresh after save), and live useAIStream SSE state for
 * AI campaign generation — none of which can be safely mocked in Storybook
 * without duplicating real backend/streaming logic. Its child form
 * components already carry full Storybook coverage where applicable. See
 * MarketingView for the same documented carve-out.
 */
export function CampaignDialog({
  open,
  onOpenChange,
  clients,
}: CampaignDialogProps) {
  const router = useRouter();
  const aiStream = useAIStream();
  const [platformInput, setPlatformInput] = useState("");
  const [pendingInput, setPendingInput] = useState<ContentCampaignInput | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(contentCampaignSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(DEFAULT_VALUES);
    setPlatformInput("");
    setPendingInput(null);
    setSaving(false);
    setSaveError(null);
    aiStream.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Once the campaign draft completes, save it and refresh the calendar.
  useEffect(() => {
    if (aiStream.status !== "done" || !pendingInput) return;

    const drafts = aiStream.donePayload?.campaignDrafts;
    if (!drafts || drafts.length === 0) {
      setSaveError(
        "The AI didn't return any posts. Try adjusting the goal or date range.",
      );
      return;
    }

    setSaving(true);
    void saveGeneratedCampaign(pendingInput, drafts).then((result) => {
      setSaving(false);
      if (!result.ok) {
        setSaveError(result.message);
        return;
      }
      toast.success(`Added ${result.postCount} posts to your calendar.`);
      setPendingInput(null);
      aiStream.reset();
      onOpenChange(false);
      router.refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiStream.status, aiStream.donePayload, pendingInput]);

  const platforms = form.watch("platforms") ?? [];

  function addPlatform() {
    const next = platformInput.trim();
    if (!next || platforms.length >= 8) {
      setPlatformInput("");
      return;
    }
    if (platforms.some((p) => p.toLowerCase() === next.toLowerCase())) {
      setPlatformInput("");
      return;
    }
    form.setValue("platforms", [...platforms, next], { shouldDirty: true });
    setPlatformInput("");
  }

  function removePlatform(platform: string) {
    form.setValue(
      "platforms",
      platforms.filter((p) => p !== platform),
      { shouldDirty: true },
    );
  }

  function onSubmit(data: CampaignFormValues) {
    setSaveError(null);
    const input: ContentCampaignInput = {
      name: data.name,
      goal: data.goal,
      clientId: data.clientId ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
      platforms: data.platforms ?? [],
      cadencePerWeek: data.cadencePerWeek,
    };
    setPendingInput(input);
    void aiStream.stream({
      agent: "content-marketer",
      input: {
        mode: "generate-campaign",
        goal: input.goal,
        startDate: input.startDate,
        endDate: input.endDate,
        platforms: input.platforms,
        clientId: input.clientId,
        cadencePerWeek: input.cadencePerWeek,
      },
    });
  }

  function retry() {
    setSaveError(null);
    setPendingInput(null);
    aiStream.reset();
  }

  const isStreaming = aiStream.status === "streaming";
  const isWorking = isStreaming || saving;
  const showForm = aiStream.status !== "streaming" && !saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
          <DialogDescription>
            Describe a goal and Manpower drafts a batch of posts across your
            date range.
          </DialogDescription>
        </DialogHeader>

        {isWorking ? (
          <div className="flex items-center justify-center py-10">
            <AIThinking
              label={
                saving ? "Saving your campaign…" : "Generating campaign…"
              }
            />
          </div>
        ) : (
          <form
            id="campaign-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className={cn(!showForm && "hidden")}
          >
            <FieldGroup className="gap-4">
              <Field data-invalid={form.formState.errors.name ? true : undefined}>
                <FieldLabel htmlFor="campaign-name">Name</FieldLabel>
                <Input
                  id="campaign-name"
                  placeholder="e.g. Autumn product launch"
                  maxLength={120}
                  {...form.register("name")}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>

              <Field data-invalid={form.formState.errors.goal ? true : undefined}>
                <FieldLabel htmlFor="campaign-goal">Goal</FieldLabel>
                <Textarea
                  id="campaign-goal"
                  rows={3}
                  maxLength={1000}
                  placeholder="What's this campaign trying to achieve?"
                  className="resize-y"
                  {...form.register("goal")}
                />
                <FieldError errors={[form.formState.errors.goal]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="campaign-client">Client</FieldLabel>
                <Controller
                  name="clientId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(v) => field.onChange(v || null)}
                    >
                      <SelectTrigger id="campaign-client" className="w-full min-w-0">
                        <SelectValue placeholder="No client">
                          {field.value
                            ? clients.find((c) => c.id === field.value)?.name
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldDescription>Optional — ties every post to a client.</FieldDescription>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  data-invalid={form.formState.errors.startDate ? true : undefined}
                >
                  <FieldLabel htmlFor="campaign-start-date">Start date</FieldLabel>
                  <Controller
                    name="startDate"
                    control={form.control}
                    render={({ field }) => (
                      <FormDatePicker
                        id="campaign-start-date"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        aria-invalid={
                          form.formState.errors.startDate ? true : undefined
                        }
                      />
                    )}
                  />
                  <FieldError errors={[form.formState.errors.startDate]} />
                </Field>
                <Field
                  data-invalid={form.formState.errors.endDate ? true : undefined}
                >
                  <FieldLabel htmlFor="campaign-end-date">End date</FieldLabel>
                  <Controller
                    name="endDate"
                    control={form.control}
                    render={({ field }) => (
                      <FormDatePicker
                        id="campaign-end-date"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        aria-invalid={
                          form.formState.errors.endDate ? true : undefined
                        }
                      />
                    )}
                  />
                  <FieldError errors={[form.formState.errors.endDate]} />
                </Field>
              </div>

              <Field
                data-invalid={form.formState.errors.platforms ? true : undefined}
              >
                <FieldLabel htmlFor="campaign-platforms">Platforms</FieldLabel>
                {platforms.length > 0 ? (
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    {platforms.map((platform) => (
                      <Badge key={platform} variant="secondary" className="gap-1 pr-1">
                        {platform}
                        <button
                          type="button"
                          aria-label={`Remove platform ${platform}`}
                          onClick={() => removePlatform(platform)}
                          className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                          <X className="size-3" aria-hidden />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <Input
                  id="campaign-platforms"
                  value={platformInput}
                  onChange={(e) => setPlatformInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addPlatform();
                    }
                  }}
                  placeholder="e.g. Instagram — press Enter"
                  disabled={platforms.length >= 8}
                />
                <FieldError errors={[form.formState.errors.platforms]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="campaign-cadence">Posts per week</FieldLabel>
                <Controller
                  name="cadencePerWeek"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger id="campaign-cadence" className="w-full min-w-0">
                        <span className="truncate text-start">
                          {field.value}×/week
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {CADENCE_OPTIONS.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}×/week
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              {aiStream.status === "error" && aiStream.error ? (
                <p className="text-sm text-destructive">{aiStream.error}</p>
              ) : null}
              {saveError ? (
                <p className="text-sm text-destructive">{saveError}</p>
              ) : null}
            </FieldGroup>
          </form>
        )}

        {showForm ? (
          <DialogFooter>
            {aiStream.status === "error" || saveError ? (
              <Button type="button" variant="outline" onClick={retry}>
                Reset
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="campaign-form">
              Generate
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

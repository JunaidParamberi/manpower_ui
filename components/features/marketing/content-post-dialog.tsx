"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileIcon, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
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
import {
  createContentPost,
  deleteContentPost,
  getMediaSignedUrl,
  updateContentPost,
  uploadPostMedia,
} from "@/lib/marketing/content-post-actions";
import type { ContentPostRow } from "@/lib/marketing/content-post-queries";
import { COMMON_PLATFORMS } from "@/lib/marketing/platform-icon";
import { postStatusLabel } from "@/lib/marketing/post-display";
import {
  combineScheduledAt,
  splitScheduledAt,
} from "@/lib/marketing/schedule-utils";
import { cn } from "@/lib/utils";
import {
  POST_STATUSES,
  contentPostSchema,
  type PostStatus,
} from "@/lib/validations/content-post";

/**
 * `contentPostSchema` uses `.default()` on several fields, so its Zod *input*
 * type (what `zodResolver` type-checks the form against) has those fields
 * optional, while `z.infer` (the *output* type) has them required. We always
 * populate every field via `buildDefaultValues`, so using the input type here
 * is safe and keeps `useForm` + `zodResolver` in sync.
 */
type ContentPostFormValues = z.input<typeof contentPostSchema>;
type MediaFormItem = NonNullable<ContentPostFormValues["media"]>[number];

const PLATFORM_DATALIST_ID = "content-post-platform-options";

type ContentPostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: ContentPostRow;
  defaultDate?: string;
  clients: Array<{ id: string; name: string }>;
};

function buildDefaultValues(
  post: ContentPostRow | undefined,
  defaultDate: string | undefined,
): ContentPostFormValues {
  if (post) {
    return {
      title: post.title,
      clientId: post.clientId,
      campaignId: post.campaignId,
      platform: post.platform,
      caption: post.caption,
      hashtags: post.hashtags,
      media: post.media,
      status: post.status,
      scheduledAt:
        post.scheduledAt == null
          ? null
          : new Date(post.scheduledAt).toISOString(),
    };
  }
  return {
    title: "",
    clientId: null,
    campaignId: null,
    platform: "",
    caption: "",
    hashtags: [],
    media: [],
    status: "idea",
    scheduledAt: defaultDate ? combineScheduledAt(defaultDate, "09:00") : null,
  };
}

function MediaThumbnail({
  item,
  onRemove,
}: {
  item: MediaFormItem;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  // UI-only effect: resolves a signed URL for a private storage object. Not
  // data fetching in the "should be a server component" sense — the path is
  // already in the form state.
  useEffect(() => {
    let cancelled = false;
    void getMediaSignedUrl(item.path).then((result) => {
      if (!cancelled && result.ok) setUrl(result.url);
    });
    return () => {
      cancelled = true;
    };
  }, [item.path]);

  const isImage = item.mime.startsWith("image/");

  return (
    <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
      {isImage && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" />
      ) : url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 p-1 text-muted-foreground"
        >
          <FileIcon className="size-5" aria-hidden />
        </a>
      ) : (
        <FileIcon className="size-5 text-muted-foreground" aria-hidden />
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-0.5 top-0.5 size-5 rounded-full bg-background/90 text-muted-foreground hover:text-destructive"
        aria-label="Remove media"
        onClick={onRemove}
      >
        <X className="size-3" aria-hidden />
      </Button>
    </div>
  );
}

/**
 * Create/edit a content post.
 *
 * A centered dialog rather than the right-side sheet this replaces: the
 * caption is the field the AI streams into and the field users spend the most
 * time in, and a 384px sheet gave it roughly half the width it needs. The
 * two-column body puts caption plus AI drafting on the left and media plus
 * hashtags on the right, collapsing to one column below `md`.
 */
export function ContentPostDialog({
  open,
  onOpenChange,
  post,
  defaultDate,
  clients,
}: ContentPostDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [hashtagInput, setHashtagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiStream = useAIStream();

  const isEditMode = Boolean(post);

  const form = useForm<ContentPostFormValues>({
    resolver: zodResolver(contentPostSchema),
    defaultValues: buildDefaultValues(post, defaultDate),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(buildDefaultValues(post, defaultDate));
    setHashtagInput("");
    setAiPromptOpen(false);
    setAiTopic("");
    setAiTone("");
    aiStream.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post?.id, defaultDate]);

  // Live-stream the drafted caption into the form as tokens arrive.
  useEffect(() => {
    if (aiStream.status === "streaming" || aiStream.status === "done") {
      form.setValue("caption", aiStream.text, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiStream.text, aiStream.status]);

  // On completion, also apply the drafted hashtags and close the prompt.
  useEffect(() => {
    if (aiStream.status === "done" && aiStream.donePayload?.hashtags) {
      form.setValue("hashtags", aiStream.donePayload.hashtags, {
        shouldDirty: true,
      });
      setAiPromptOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiStream.status, aiStream.donePayload]);

  const hashtags = form.watch("hashtags") ?? [];
  const media = form.watch("media") ?? [];
  const status = form.watch("status");
  const clientId = form.watch("clientId");
  const platform = form.watch("platform");
  const scheduledAt = form.watch("scheduledAt");
  const { date: scheduledDate, time: scheduledTime } = splitScheduledAt(
    scheduledAt ?? null,
  );

  function addHashtag() {
    const next = hashtagInput.trim().replace(/^#/, "");
    if (!next || hashtags.length >= 60) {
      setHashtagInput("");
      return;
    }
    if (hashtags.includes(next)) {
      setHashtagInput("");
      return;
    }
    form.setValue("hashtags", [...hashtags, next], { shouldDirty: true });
    setHashtagInput("");
  }

  function removeHashtag(tag: string) {
    form.setValue(
      "hashtags",
      hashtags.filter((t) => t !== tag),
      { shouldDirty: true },
    );
  }

  async function handleFileChange(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadPostMedia(fd);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    form.setValue("media", [...media, result.media], { shouldDirty: true });
  }

  function removeMedia(path: string) {
    form.setValue(
      "media",
      media.filter((m) => m.path !== path),
      { shouldDirty: true },
    );
  }

  function generateWithAI() {
    if (!aiTopic.trim()) {
      toast.error("Enter a topic to draft from.");
      return;
    }
    void aiStream.stream({
      agent: "content-marketer",
      input: {
        mode: "draft-single",
        platform: platform || "Instagram",
        topic: aiTopic.trim(),
        clientId: clientId || null,
        tone: aiTone.trim() || null,
      },
    });
  }

  function onSubmit(data: ContentPostFormValues) {
    startTransition(async () => {
      const result = post
        ? await updateContentPost(post.id, data)
        : await createContentPost(data);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(isEditMode ? "Post updated" : "Post created");
      onOpenChange(false);
    });
  }

  function onDelete() {
    if (!post) return;
    if (!window.confirm("Delete this post?")) return;
    startTransition(async () => {
      const result = await deleteContentPost(post.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Post deleted");
      onOpenChange(false);
    });
  }

  const isStreaming = aiStream.status === "streaming";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 pt-6 pb-5 text-start">
          <DialogTitle className="font-heading text-xl tracking-tight">
            {isEditMode ? "Edit post" : "New post"}
          </DialogTitle>
          <DialogDescription className="text-pretty leading-relaxed">
            Plan a social post, draft the caption with AI, and schedule it.
          </DialogDescription>
        </DialogHeader>

        <form
          id="content-post-form"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="min-h-0 flex-1 overflow-y-auto px-6 py-6"
        >
          <FieldGroup className="gap-5">
            <Field data-invalid={form.formState.errors.title ? true : undefined}>
              <FieldLabel htmlFor="post-title">Title</FieldLabel>
              <Input
                id="post-title"
                placeholder="e.g. Product launch teaser"
                maxLength={140}
                {...form.register("title")}
              />
              <FieldError errors={[form.formState.errors.title]} />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field
                data-invalid={form.formState.errors.platform ? true : undefined}
              >
                <FieldLabel htmlFor="post-platform">Platform</FieldLabel>
                <Input
                  id="post-platform"
                  list={PLATFORM_DATALIST_ID}
                  placeholder="e.g. Instagram"
                  maxLength={60}
                  {...form.register("platform")}
                />
                <datalist id={PLATFORM_DATALIST_ID}>
                  {COMMON_PLATFORMS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                <FieldError errors={[form.formState.errors.platform]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="post-status">Status</FieldLabel>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as PostStatus)}
                    >
                      <SelectTrigger id="post-status" className="w-full min-w-0">
                        <span className="truncate text-start">
                          {postStatusLabel(field.value)}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {POST_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {postStatusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="post-client">Client</FieldLabel>
                <Controller
                  name="clientId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(v) => field.onChange(v || null)}
                    >
                      <SelectTrigger id="post-client" className="w-full min-w-0">
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
                <FieldDescription>Optional.</FieldDescription>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <Field
                data-invalid={
                  form.formState.errors.scheduledAt ? true : undefined
                }
              >
                <FieldLabel htmlFor="post-scheduled-date">Date</FieldLabel>
                <FormDatePicker
                  id="post-scheduled-date"
                  value={scheduledDate}
                  onChange={(next) => {
                    form.setValue(
                      "scheduledAt",
                      combineScheduledAt(next, scheduledTime || "09:00"),
                      { shouldDirty: true, shouldValidate: true },
                    );
                  }}
                  aria-invalid={
                    form.formState.errors.scheduledAt ? true : undefined
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="post-scheduled-time">Time</FieldLabel>
                <Input
                  id="post-scheduled-time"
                  type="time"
                  value={scheduledTime || "09:00"}
                  disabled={!scheduledDate}
                  onChange={(e) => {
                    form.setValue(
                      "scheduledAt",
                      combineScheduledAt(scheduledDate, e.target.value),
                      { shouldDirty: true, shouldValidate: true },
                    );
                  }}
                />
              </Field>
            </div>
            {status === "scheduled" || status === "posted" ? (
              <FieldError errors={[form.formState.errors.scheduledAt]} />
            ) : null}

            <div className="grid grid-cols-1 gap-6 border-t border-border/60 pt-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-4">
                {!aiPromptOpen ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit gap-1.5"
                    onClick={() => setAiPromptOpen(true)}
                  >
                    <Sparkles className="size-3.5" aria-hidden />
                    Draft with AI
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/20 p-3">
                    <Field>
                      <FieldLabel htmlFor="ai-topic">Topic</FieldLabel>
                      <Textarea
                        id="ai-topic"
                        rows={2}
                        placeholder="What's this post about?"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        disabled={isStreaming}
                        className="resize-y bg-background"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="ai-tone">Tone (optional)</FieldLabel>
                      <Input
                        id="ai-tone"
                        placeholder="e.g. playful, professional"
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        disabled={isStreaming}
                        className="bg-background"
                      />
                    </Field>
                    {aiStream.status === "error" && aiStream.error ? (
                      <p className="text-xs text-destructive">{aiStream.error}</p>
                    ) : null}
                    <div className="flex items-center gap-2">
                      {isStreaming ? (
                        <AIThinking label="Drafting caption…" />
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={generateWithAI}
                            disabled={!aiTopic.trim()}
                          >
                            Generate
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setAiPromptOpen(false)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="post-caption">Caption</FieldLabel>
                  <Textarea
                    id="post-caption"
                    rows={10}
                    maxLength={5000}
                    placeholder="Write the caption, or draft it with AI above."
                    className="resize-y"
                    {...form.register("caption")}
                  />
                  <FieldError errors={[form.formState.errors.caption]} />
                </Field>
              </div>

              <div className="flex min-w-0 flex-col gap-5">
                <Field>
                  <FieldLabel>Media</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {media.map((item) => (
                      <MediaThumbnail
                        key={item.path}
                        item={item}
                        onRemove={() => removeMedia(item.path)}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || media.length >= 10}
                      className={cn(
                        "flex size-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border/80 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-50",
                      )}
                    >
                      <span className="text-xs">{uploading ? "…" : "+ Add"}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="sr-only"
                      onChange={(e) => void handleFileChange(e.target.files)}
                    />
                  </div>
                  <FieldDescription>Up to 10 files per post.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="post-hashtags">Hashtags</FieldLabel>
                  {hashtags.length > 0 ? (
                    <div className="mb-1.5 flex flex-wrap gap-1.5">
                      {hashtags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                          #{tag}
                          <button
                            type="button"
                            aria-label={`Remove hashtag ${tag}`}
                            onClick={() => removeHashtag(tag)}
                            className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                          >
                            <X className="size-3" aria-hidden />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <Input
                    id="post-hashtags"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addHashtag();
                      }
                    }}
                    placeholder="Type a tag, press Enter"
                    disabled={hashtags.length >= 60}
                  />
                </Field>
              </div>
            </div>
          </FieldGroup>
        </form>

        <DialogFooter className="shrink-0 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur-sm sm:justify-between">
          {isEditMode ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="content-post-form"
              disabled={isPending}
              className="sm:min-w-[9rem]"
            >
              {isPending
                ? "Saving…"
                : isEditMode
                  ? "Save changes"
                  : "Create post"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { BookmarkPlus } from "lucide-react";
import { useState, useTransition } from "react";

import { saveAsTemplate } from "@/lib/documents/document-mutations";
import { DOCUMENT_LIMITS } from "@/lib/validations/document";
import type { DocumentType, TiptapDoc } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  type: DocumentType;
  content: TiptapDoc;
  defaultName: string;
};

export function SaveAsTemplateButton({ type, content, defaultName }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await saveAsTemplate({
        type,
        name,
        description,
        content_json: content,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      setName(defaultName);
      setDescription("");
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-center gap-2"
        onClick={() => {
          setName(defaultName);
          setOpen(true);
        }}
      >
        <BookmarkPlus className="size-4" />
        Save as template
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
            <DialogDescription>
              Reuse this document as a starting point. It will appear in your
              template picker.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                value={name}
                maxLength={DOCUMENT_LIMITS.template_name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="template-desc">Description (optional)</Label>
              <Textarea
                id="template-desc"
                value={description}
                maxLength={DOCUMENT_LIMITS.template_description}
                rows={3}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this template for?"
              />
            </div>
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={isPending || !name.trim()}>
              {isPending ? "Saving…" : "Save template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { createTemplateFromProject } from "@/lib/projects/template-actions";
import { TEMPLATE_LIMITS } from "@/lib/validations/project-template";

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

type SaveProjectAsTemplateDialogProps = {
  projectId: string;
  defaultName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function SaveProjectAsTemplateDialog({
  projectId,
  defaultName,
  open,
  onOpenChange,
  onSuccess,
}: SaveProjectAsTemplateDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [templateName, setTemplateName] = useState(defaultName);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setTemplateName(defaultName);
      setDescription("");
    }
  }, [open, defaultName]);

  function handleSave() {
    const name = templateName.trim();
    if (!name) return;

    startTransition(async () => {
      const result = await createTemplateFromProject({
        name,
        projectId,
        description,
      });
      if (!result.ok) {
        toast.error(result.message ?? "Failed to save template");
        return;
      }
      onOpenChange(false);
      setTemplateName("");
      setDescription("");
      toast.success("Template saved — use it when creating a new project");
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setTemplateName("");
          setDescription("");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
          <DialogDescription>
            Milestones and top-level tasks will be copied into the template.
            Use it to start future projects with the same structure.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-template-name">Template name</Label>
            <Input
              id="project-template-name"
              value={templateName}
              maxLength={TEMPLATE_LIMITS.name}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Website redesign"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-template-description">
              Description (optional)
            </Label>
            <Textarea
              id="project-template-description"
              value={description}
              maxLength={TEMPLATE_LIMITS.description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this template for?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={isPending || !templateName.trim()}
            onClick={handleSave}
          >
            {isPending ? "Saving…" : "Save template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

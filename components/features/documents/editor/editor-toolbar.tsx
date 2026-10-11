"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Undo2,
} from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import { VariableMenu } from "./variable-menu";

type EditorToolbarProps = {
  editor: Editor | null;
};

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const insertVariable = useCallback(
    (key: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(`{{${key}}}`).run();
    },
    [editor],
  );

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const openLinkPopover = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(prev ?? "");
    setLinkOpen(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
    }
    setLinkOpen(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  }, [editor]);

  if (!editor) {
    return (
      <div className="h-12 border-b border-border/60 bg-muted/40" aria-hidden />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-muted/40 px-2 py-1.5">
      <ToolbarBtn
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2 className="size-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 className="size-4" />
      </ToolbarBtn>
      <ToolbarSep />
      <ToolbarBtn
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <Heading1 className="size-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="size-4" />
      </ToolbarBtn>
      <ToolbarSep />
      <ToolbarBtn
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarBtn>
      <ToolbarSep />
      <ToolbarBtn
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Ordered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="size-4" />
      </ToolbarBtn>
      <ToolbarSep />
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger
          aria-label="Link"
          title="Link"
          onClick={openLinkPopover}
          className={cn(
            "size-8 rounded-md text-muted-foreground hover:bg-background hover:text-foreground inline-flex items-center justify-center",
            editor.isActive("link") && "bg-background text-foreground shadow-[inset_0_0_0_1px_var(--border)]",
          )}
        >
          <Link2 className="size-4" />
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Link URL</p>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
                if (e.key === "Escape") {
                  setLinkOpen(false);
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={applyLink}
              >
                Apply
              </Button>
              {editor.isActive("link") ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={removeLink}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <ToolbarSep />
      <ToolbarBtn
        label="Insert pricing table"
        onClick={() =>
          editor.chain().focus().insertContent({
            type: "pricingTable",
            attrs: { id: Math.random().toString(36).slice(2, 9) },
          }).run()
        }
      >
        <Table className="size-4" />
      </ToolbarBtn>
      <ToolbarSep />
      <VariableMenu onInsert={insertVariable} />
    </div>
  );
}

function ToolbarSep() {
  return (
    <Separator
      orientation="vertical"
      className="mx-1 h-5 bg-border/70"
    />
  );
}

function ToolbarBtn({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "size-8 rounded-md text-muted-foreground hover:bg-background hover:text-foreground",
        active && "bg-background text-foreground shadow-[inset_0_0_0_1px_var(--border)]",
      )}
    >
      {children}
    </Button>
  );
}

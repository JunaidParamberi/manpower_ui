"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";
import type { TiptapDoc } from "@/types";

import { PricingTableExtension } from "./pricing-table-node";
import type { PricingTableAttrs } from "./pricing-table-view";
import { EditorToolbar } from "./editor-toolbar";

type TiptapEditorProps = {
  value: TiptapDoc;
  onChange: (next: TiptapDoc) => void;
  placeholder?: string;
  className?: string;
  /**
   * "card" is the standalone editor with its own border. "plain" sits inside the paper:
   * no frame, a floating toolbar, and the text takes the paper's colours.
   */
  variant?: "card" | "plain";
};

export interface TiptapEditorHandle {
  getJSON: () => TiptapDoc;
}

export const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  function TiptapEditorInner(
    { value, onChange, placeholder = "Start writing…", className, variant = "card" },
    ref,
  ) {
  const skipExternalSyncRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4 hover:opacity-80",
          rel: "noopener noreferrer",
        },
      }),
      Typography,
      PricingTableExtension,
    ],
    content: value as JSONContent,
    editorProps: {
      attributes: {
        class:
          variant === "plain"
            ? "doc-prose min-h-[12rem] focus:outline-none py-2"
            : "doc-prose min-h-[24rem] focus:outline-none px-10 py-10 sm:px-16 sm:py-14",
      },
    },
    onUpdate: ({ editor: ed }) => {
      skipExternalSyncRef.current = true;
      onChange(ed.getJSON() as TiptapDoc);
    },
  });

  useImperativeHandle(ref, () => ({
    getJSON: () => {
      if (!editor) return value;
      const json = editor.getJSON() as TiptapDoc;
      const extStorage = editor.storage as unknown as Record<string, { tables?: Record<string, PricingTableAttrs> }>;
      const storage = extStorage.pricingTable?.tables;
      if (!storage) return json;
      return enrichPricingTables(json, storage);
    },
  }), [editor, value]);

  useEffect(() => {
    if (!editor) return;
    if (skipExternalSyncRef.current) {
      skipExternalSyncRef.current = false;
      return;
    }
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value);
    if (current !== next) {
      editor.commands.setContent(value as JSONContent, { emitUpdate: false });
    }
  }, [value, editor]);

  if (variant === "plain") {
    return (
      <div className={className}>
        <div className="sticky top-2 z-10 mb-3 overflow-hidden rounded-[var(--surface-radius)] border border-border bg-[var(--bg-surface)] text-[var(--fg)] shadow-[var(--shadow-sm)] print:hidden">
          <EditorToolbar editor={editor} />
        </div>
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border border-border/70 rounded-2xl bg-card shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_24px_48px_-32px_rgba(15,23,42,0.18)] overflow-hidden",
        className,
      )}
    >
      <EditorToolbar editor={editor} />
      <div className="bg-card border-t border-border/60">
        <EditorContent editor={editor} className="mx-auto max-w-[68ch]" />
      </div>
    </div>
  );
  }
);

function enrichPricingTables(
  doc: TiptapDoc,
  storage: Record<string, PricingTableAttrs>,
): TiptapDoc {
  const enrichNode = (node: import("@/types").TiptapNode): import("@/types").TiptapNode => {
    if (node.type === "pricingTable") {
      const tableId = node.attrs?.id as string | undefined;
      const stored = tableId ? storage[tableId] : undefined;
      if (stored) {
        return { ...node, attrs: { ...node.attrs, ...stored } };
      }
    }
    if (node.content) {
      return { ...node, content: node.content.map(enrichNode) };
    }
    return node;
  };

  return {
    ...doc,
    content: (doc.content ?? []).map(enrichNode),
  };
}

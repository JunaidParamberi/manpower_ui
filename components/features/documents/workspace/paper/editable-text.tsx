"use client";

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent, type Ref } from "react";
import { cn } from "@/lib/utils";

/**
 * Plain-text contentEditable that edits in place on the paper. Syncs `value` only while
 * unfocused so the caret never jumps. Pasted text is inserted as plain text.
 */
export function EditableText({
  value, onChange, placeholder, multiline = false, readOnly = false, className,
  onEnter, onBackspaceEmpty, inputRef, "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  multiline?: boolean;
  readOnly?: boolean;
  className?: string;
  /** Enter without Shift. In single-line mode Enter is always swallowed. */
  onEnter?: () => void;
  onBackspaceEmpty?: () => void;
  inputRef?: Ref<HTMLDivElement>;
  "aria-label": string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) el.textContent = value;
  }, [value]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" && !e.shiftKey && (!multiline || onEnter)) {
      e.preventDefault();
      onEnter?.();
    }
    if (e.key === "Backspace" && !e.currentTarget.textContent && onBackspaceEmpty) {
      e.preventDefault();
      onBackspaceEmpty();
    }
  }
  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    // execCommand is the only way to insert into a contentEditable with native undo.
    document.execCommand("insertText", false, multiline ? text : text.replace(/\s*\n\s*/g, " "));
  }

  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (typeof inputRef === "function") inputRef(el);
        else if (inputRef) (inputRef as { current: HTMLDivElement | null }).current = el;
      }}
      role="textbox"
      aria-label={ariaLabel}
      aria-multiline={multiline || undefined}
      aria-readonly={readOnly || undefined}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={(e) => onChange(e.currentTarget.textContent ?? "")}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      className={cn(
        "rounded-[5px] caret-[var(--sheet-accent)] outline-1 outline-offset-[3px] outline-transparent transition-[outline-color]",
        "empty:before:text-[var(--sheet-faint)] empty:before:content-[attr(data-placeholder)]",
        !readOnly && "cursor-text outline-dashed hover:outline-[var(--sheet-line-strong)] focus:outline-2 focus:outline-solid focus:outline-[var(--sheet-accent)]",
        multiline && "whitespace-pre-wrap",
        className,
      )}
    >
      {value}
    </div>
  );
}

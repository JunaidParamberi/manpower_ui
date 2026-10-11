import type { TiptapNode } from "@/types";

export type PreviewSegment =
  | { kind: "text"; text: string }
  | { kind: "var"; name: string; label: string };

// "project_" stays: "Title" alone would not say whose title.
const PREFIXES = ["brand_", "client_", "sender_"];
const KEEP_PREFIX = new Set(["client_name"]);

export function variableLabel(name: string): string {
  let n = name.trim();
  if (!KEEP_PREFIX.has(n)) {
    for (const p of PREFIXES) {
      if (n.startsWith(p) && n.length > p.length) {
        n = n.slice(p.length);
        break;
      }
    }
  }
  const words = n.split("_").filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function plainText(content: { content?: TiptapNode[] } | null): string {
  if (!content?.content) return "";
  const parts: string[] = [];
  const walk = (node: TiptapNode) => {
    if (typeof node.text === "string") parts.push(node.text);
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  content.content.forEach(walk);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function mergeText(segs: PreviewSegment[]): PreviewSegment[] {
  return segs.reduce<PreviewSegment[]>((acc, s) => {
    const prev = acc.at(-1);
    if (s.kind === "text" && prev?.kind === "text") prev.text += s.text;
    else acc.push({ ...s });
    return acc;
  }, []);
}

export function templatePreview(content: { content?: TiptapNode[] } | null, maxChars = 160): PreviewSegment[] {
  const text = plainText(content);
  const out: PreviewSegment[] = [];
  let used = 0;
  const re = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  const pushText = (t: string): boolean => {
    if (!t) return true;
    if (used + t.length > maxChars) {
      out.push({ kind: "text", text: t.slice(0, maxChars - used) + "…" });
      used = maxChars;
      return false;
    }
    out.push({ kind: "text", text: t });
    used += t.length;
    return true;
  };
  while ((m = re.exec(text))) {
    if (!pushText(text.slice(last, m.index))) return mergeText(out);
    const label = variableLabel(m[1]);
    if (used + label.length > maxChars) return mergeText(out);
    out.push({ kind: "var", name: m[1], label });
    used += label.length;
    last = m.index + m[0].length;
  }
  pushText(text.slice(last));
  return mergeText(out);
}

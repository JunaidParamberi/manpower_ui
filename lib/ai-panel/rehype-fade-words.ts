/**
 * Rehype plugin for streaming answers: wraps each word of prose in
 * `<span class="kraft-word">` so it can fade in. React keys children by
 * position, so words already on screen keep their DOM nodes and only the
 * newly revealed ones mount, and so animate. Code is left alone.
 */

type HastText = { type: "text"; value: string };
type HastElement = {
  type: "element";
  tagName: string;
  properties: Record<string, unknown>;
  children: HastNode[];
};
type HastNode = HastText | HastElement | { type: string; children?: HastNode[] };

const SKIP = new Set(["code", "pre"]);

function isElement(node: HastNode): node is HastElement {
  return node.type === "element";
}

function isText(node: HastNode): node is HastText {
  return node.type === "text";
}

export function splitWords(value: string): HastNode[] {
  return value
    .split(/(\s+)/)
    .filter((part) => part.length > 0)
    .map((part) =>
      /^\s+$/.test(part)
        ? { type: "text", value: part }
        : { type: "element", tagName: "span", properties: { className: ["kraft-word"] }, children: [{ type: "text", value: part }] },
    );
}

function wrap(node: HastNode): void {
  if (!("children" in node) || !node.children) {
    return;
  }
  if (isElement(node) && SKIP.has(node.tagName)) {
    return;
  }
  node.children = node.children.flatMap((child) => {
    if (isText(child)) {
      return splitWords(child.value);
    }
    wrap(child);
    return [child];
  });
}

export function rehypeFadeWords() {
  return (tree: HastNode) => {
    wrap(tree);
  };
}

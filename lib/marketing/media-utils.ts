function safeName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot) : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "file"}${ext.toLowerCase()}`;
}

export function buildMediaPath(userId: string, fileName: string): string {
  const id = crypto.randomUUID();
  return `${userId}/${id}-${safeName(fileName)}`;
}

export function mediaFolderOwner(path: string): string {
  return path.split("/")[0] ?? "";
}

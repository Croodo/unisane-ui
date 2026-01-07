export function toSlug(base: string): string {
  const s = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
  return s || "workspace";
}

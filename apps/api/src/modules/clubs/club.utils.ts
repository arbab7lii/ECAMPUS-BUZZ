/** URL-safe slug from club name. */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = base || "club";
  let suffix = 0;
  while (await exists(slug)) {
    suffix += 1;
    slug = `${base}-${suffix}`.slice(0, 80);
  }
  return slug;
}

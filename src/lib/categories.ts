import type { Category, CategoryKind } from "./types";

export function categoryRank(category: Pick<Category, "id" | "slug" | "name" | "kind">) {
  const text = `${category.id} ${category.slug} ${category.name}`.toLowerCase();
  if (category.kind === "extra" || text.includes("extra")) return 2;
  if (/(bebida|jugo|bebestible|soda|drink|caliente|cafe|caf[eé]|t[eé])/.test(text)) return 1;
  return 0;
}

export function nextCategoryOrder(
  categories: Category[],
  kind: CategoryKind,
  name = "",
  slug = ""
) {
  const rank = categoryRank({ id: "", slug, name, kind });
  const max = categories
    .filter((item) => categoryRank(item) === rank)
    .reduce((current, item) => Math.max(current, item.order), 0);
  return max + 1;
}

export function sortPublicCategories(categories: Category[]) {
  return [...categories].sort((a, b) => {
    const rank = categoryRank(a) - categoryRank(b);
    return rank || a.order - b.order;
  });
}

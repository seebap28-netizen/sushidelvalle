export type CategoryKind =
  | "menu"
  | "wrap"
  | "wrap_premium"
  | "protein"
  | "filling"
  | "extra";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  note: string;
  kind: CategoryKind;
  order: number;
  parentId?: string;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  extraPrice: number;
  details: string[];
  available: boolean;
  featured: boolean;
  order: number;
  image: string;
};

export type MenuData = {
  categories: Category[];
  products: Product[];
};

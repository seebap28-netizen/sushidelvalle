import type { MenuData, Product } from "./types";

const byId: Record<string, string> = {
  "premium-18": "/photos/premium-rolls.png",
  "wrap-tempura": "/photos/tempura-shrimp.png",
  "wrap-panko": "/photos/panko-roll.png",
  "wrap-ciboulette": "/photos/premium-wrap.png",
  "wrap-queso": "/photos/cream-cheese-roll.png",
  "wrap-queso-merken": "/photos/cream-cheese-roll.png",
  "wrap-queso-sesamo": "/photos/cream-cheese-roll.png",
  "wrap-palta": "/photos/avocado-roll.png",
  "wrap-serrano": "/photos/premium-wrap.png",
  "wrap-sesamo": "/photos/hosomaki.png",
  "wrap-nori": "/photos/hosomaki.png",
  "wrap-nori-panko": "/photos/panko-roll.png",
  "wrap-qc-ciboulette": "/photos/cream-cheese-roll.png",
  "wrap-qc-almendra": "/photos/cream-cheese-roll.png",
  "wrap-salmon": "/photos/salmon-wrap.png",
  "wrap-pistacho": "/photos/premium-wrap.png",
  "wrap-salmon-panko": "/photos/panko-roll.png",
  "wrap-mix-salmon": "/photos/salmon-wrap.png",
  "wrap-frutos": "/photos/premium-wrap.png",
  "sin-arroz": "/photos/salmon-wrap.png",
  "apa-salmon": "/photos/salmon-sticks.png",
  "apa-camaron": "/photos/salmon-sticks.png",
  "apa-pollo": "/photos/salmon-sticks.png",
  "apa-queso": "/photos/panko-balls.png",
  "apa-balls-cam": "/photos/panko-balls.png",
  "apa-balls-ceb": "/photos/panko-balls.png",
  "temaki-salmon": "/photos/temaki.png",
  "primavera": "/photos/spring-rolls.png",
  "poke-salmon": "/photos/poke-bowl.png",
  "poke-cam-apa": "/photos/poke-shrimp.png",
  "poke-cam-salt": "/photos/poke-shrimp.png",
  "poke-pollo": "/photos/poke-bowl.png",
  "poke-kani": "/photos/poke-bowl.png",
  "papas": "/photos/fries.png",
  "papas-nuggets": "/photos/fries-nuggets.png",
  "salchipapas": "/photos/fries-nuggets.png",
  "ex-acevicha": "/photos/ceviche-roll.png",
  "jugo-pina": "/photos/juice-pineapple.png",
  "fanta": "/photos/soda-fanta.png",
  "sprite": "/photos/soda-sprite.png",
};

const byCategory: Record<string, string> = {
  "cat-promos": "/photos/promo-platter.png",
  "cat-premium": "/photos/premium-rolls.png",
  "cat-wraps": "/photos/avocado-roll.png",
  "cat-wraps-premium": "/photos/salmon-wrap.png",
  "cat-sin-arroz": "/photos/salmon-wrap.png",
  "cat-proteinas": "/photos/tempura-shrimp.png",
  "cat-rellenos": "/photos/avocado-roll.png",
  "cat-apanados": "/photos/salmon-sticks.png",
  "cat-hosomaki": "/photos/hosomaki.png",
  "cat-nigiri": "/photos/nigiri.png",
  "cat-temaki": "/photos/temaki.png",
  "cat-primavera": "/photos/spring-rolls.png",
  "cat-poke": "/photos/poke-bowl.png",
  "cat-papas": "/photos/fries.png",
  "cat-bebidas": "/photos/soda.png",
  "cat-jugos": "/photos/juice.png",
  "cat-extras": "/photos/extras.png",
};

export function imageFor(product: Pick<Product, "id" | "categoryId" | "name">) {
  return byId[product.id] || byCategory[product.categoryId] || "/photos/promo-platter.png";
}

export function attachImages(menu: {
  categories: MenuData["categories"];
  products: Array<Omit<Product, "image"> & { image?: string }>;
}): MenuData {
  return {
    categories: menu.categories,
    products: menu.products.map((product) => ({
      ...product,
      image: product.image || imageFor(product),
    })),
  };
}

import type { MenuData, Product } from "./types";

const byId: Record<string, string> = {
  "promo-20": "/photos/promo-20.png",
  "promo-30": "/photos/promo-30.png",
  "promo-40": "/photos/promo-40.png",
  "promo-60": "/photos/promo-60.png",
  "promo-80": "/photos/promo-80.png",
  "premium-18": "/photos/premium-18.png",
  "premium-30-panko": "/photos/premium-30-panko.png",
  "premium-30-cam": "/photos/premium-30-cam.png",
  "premium-40": "/photos/premium-40.png",
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
  "nigiri-camaron": "/photos/nigiri-shrimp.png",
  "poke-cam-apa": "/photos/poke-shrimp.png",
  "poke-cam-salt": "/photos/poke-shrimp-sauteed.png",
  "poke-pollo": "/photos/poke-bowl.png",
  "poke-kani": "/photos/poke-bowl.png",
  "papas": "/photos/fries.png",
  "papas-nuggets": "/photos/fries-nuggets.png",
  "salchipapas": "/photos/salchipapas.png",
  "ex-acevicha": "/photos/ceviche-roll.png",
  "ex-envoltura": "/photos/extra-envoltura.png",
  "ex-prot-pollo": "/photos/extra-prot-pollo.png",
  "ex-prot-kani": "/photos/extra-prot-kani.png",
  "ex-prot-cam-sal": "/photos/extra-prot-cam-sal.png",
  "ex-sin-nori": "/photos/extra-sin-nori.png",
  "ex-prot-apa": "/photos/extra-prot-apa.png",
  "ex-nori-panko": "/photos/extra-nori-panko.png",
  "ex-nori-tempura": "/photos/extra-nori-tempura.png",
  "ex-soya-pote": "/photos/extra-soya-pote.png",
  "ex-soya-sachet": "/photos/extra-soya-sachet.png",
  "ex-agridulce": "/photos/extra-agridulce.png",
  "ex-merken": "/photos/extra-merken.png",
  "ex-jengibre": "/photos/extra-jengibre.png",
  "ex-wasabi": "/photos/extra-wasabi.png",
  "jugo-pina": "/photos/juice-pineapple.png",
  "fanta": "/photos/soda-fanta.png",
  "sprite": "/photos/soda-sprite.png",
};

const byCategory: Record<string, string> = {
  "cat-promos": "/photos/promo-60.png",
  "cat-premium": "/photos/premium-18.png",
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

const genericPromoPhotos = new Set([
  "",
  "/photos/promo-platter.png",
  "/photos/premium-rolls.png",
]);

export function imageFor(product: Pick<Product, "id" | "categoryId" | "name"> & { image?: string }) {
  if (byId[product.id]) return byId[product.id];
  if (product.image && !genericPromoPhotos.has(product.image)) return product.image;
  return byCategory[product.categoryId] || "/photos/promo-platter.png";
}

export function attachImages(menu: {
  categories: MenuData["categories"];
  products: Array<Omit<Product, "image"> & { image?: string }>;
}): MenuData {
  return {
    categories: menu.categories,
    products: menu.products.map((product) => ({
      ...product,
      image: imageFor(product),
    })),
  };
}

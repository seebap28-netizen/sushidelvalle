import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { imageFor } from "./images";
import { seedMenu } from "./seed";
import type { Category, MenuData, Product } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "menu.json");

function ensureStore() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(dataFile)) {
    writeFileSync(dataFile, JSON.stringify(seedMenu, null, 2), "utf8");
  }
}

export function readMenu(): MenuData {
  ensureStore();
  const raw = JSON.parse(readFileSync(dataFile, "utf8")) as MenuData;
  let changed = false;
  const products = raw.products.map((product) => {
    if (product.image) return product;
    changed = true;
    const seeded = seedMenu.products.find((item) => item.id === product.id);
    return { ...product, image: seeded?.image || imageFor(product) };
  });
  const menu = { ...raw, products };
  if (changed) writeMenu(menu);
  return menu;
}

export function writeMenu(data: MenuData) {
  ensureStore();
  writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf8");
}

export function resetMenu() {
  writeMenu(structuredClone(seedMenu));
  return readMenu();
}

export function upsertCategory(category: Category) {
  const menu = readMenu();
  const index = menu.categories.findIndex((item) => item.id === category.id);
  if (index >= 0) menu.categories[index] = category;
  else menu.categories.push(category);
  menu.categories.sort((a, b) => a.order - b.order);
  writeMenu(menu);
  return category;
}

export function deleteCategory(id: string) {
  const menu = readMenu();
  menu.categories = menu.categories.filter((item) => item.id !== id);
  menu.products = menu.products.filter((item) => item.categoryId !== id);
  writeMenu(menu);
}

export function upsertProduct(product: Product) {
  const menu = readMenu();
  const index = menu.products.findIndex((item) => item.id === product.id);
  if (index >= 0) menu.products[index] = product;
  else menu.products.push(product);
  menu.products.sort((a, b) => a.order - b.order);
  writeMenu(menu);
  return product;
}

export function deleteProduct(id: string) {
  const menu = readMenu();
  menu.products = menu.products.filter((item) => item.id !== id);
  writeMenu(menu);
}

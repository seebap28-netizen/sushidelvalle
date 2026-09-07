import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { imageFor } from "./images";
import { seedMenu } from "./seed";
import { slugify } from "./format";
import type { Category, MenuData, Product } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "menu.json");
const isVercel = process.env.VERCEL === "1";
const githubOwner = process.env.VERCEL_GIT_REPO_OWNER || "seebap28-netizen";
const githubRepo = process.env.VERCEL_GIT_REPO_SLUG || "sushidelvalle";
const githubBranch = process.env.MENU_GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main";
const githubToken = process.env.GITHUB_TOKEN || process.env.MENU_GITHUB_TOKEN || "";

type Cache = { menu: MenuData; at: number };

let cache: Cache | null = null;

export class PersistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistError";
  }
}

function withImages(menu: MenuData): MenuData {
  return {
    ...menu,
    products: menu.products.map((product) => ({
      ...product,
      image: product.image || imageFor(product),
    })),
  };
}

function cloneSeed() {
  return withImages(structuredClone(seedMenu));
}

function uniqueSlug(input: string, categories: Category[], id: string) {
  const base = slugify(input) || "categoria";
  let slug = base;
  let n = 2;
  while (categories.some((item) => item.slug === slug && item.id !== id)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function readLocalFile(): MenuData | null {
  try {
    if (!existsSync(dataFile)) return null;
    return withImages(JSON.parse(readFileSync(dataFile, "utf8")) as MenuData);
  } catch {
    return null;
  }
}

function writeLocalFile(data: MenuData) {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  const payload = JSON.stringify(data, null, 2);
  const tmp = `${dataFile}.${process.pid}.tmp`;
  writeFileSync(tmp, payload, "utf8");
  try {
    renameSync(tmp, dataFile);
  } catch {
    writeFileSync(dataFile, payload, "utf8");
    try {
      if (existsSync(tmp)) writeFileSync(tmp, "");
    } catch {
      // El temporal se puede quedar si OneDrive bloquea el rename.
    }
  }
}

function githubHeaders(accept = "application/vnd.github+json") {
  return {
    Authorization: `Bearer ${githubToken}`,
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "sushidelvalle-admin",
  };
}

function githubContentsUrl() {
  return `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/data/menu.json`;
}

async function readGithub(): Promise<MenuData | null> {
  if (!githubToken) return null;
  try {
    const response = await fetch(`${githubContentsUrl()}?ref=${githubBranch}`, {
      headers: githubHeaders("application/vnd.github.raw+json"),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return withImages((await response.json()) as MenuData);
  } catch {
    return null;
  }
}

async function writeGithub(data: MenuData, attempt = 0) {
  if (!githubToken) {
    throw new PersistError(
      "No se pudo guardar en la carta publicada. Hay que configurar el guardado del servidor."
    );
  }

  const current = await fetch(`${githubContentsUrl()}?ref=${githubBranch}`, {
    headers: githubHeaders(),
    cache: "no-store",
  });
  if (!current.ok) {
    throw new PersistError("No se pudo leer la carta para guardar los cambios.");
  }

  const payload = (await current.json()) as { sha?: string };
  const saved = await fetch(githubContentsUrl(), {
    method: "PUT",
    headers: {
      ...githubHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Actualiza la carta desde el admin",
      content: Buffer.from(JSON.stringify(data, null, 2), "utf8").toString("base64"),
      sha: payload.sha,
      branch: githubBranch,
    }),
  });

  if (saved.status === 409 && attempt < 2) {
    cache = null;
    return writeGithub(data, attempt + 1);
  }
  if (!saved.ok) {
    throw new PersistError("No se pudo guardar la categoría en la carta publicada.");
  }
}

export async function readMenu(): Promise<MenuData> {
  if (isVercel && cache && Date.now() - cache.at < 8000) {
    return structuredClone(cache.menu);
  }

  const menu = isVercel
    ? (await readGithub()) || readLocalFile() || cloneSeed()
    : readLocalFile() || cloneSeed();

  if (isVercel) cache = { menu, at: Date.now() };
  return structuredClone(menu);
}

export async function writeMenu(data: MenuData) {
  cache = { menu: structuredClone(data), at: Date.now() };
  if (isVercel) {
    await writeGithub(data);
    return;
  }
  try {
    writeLocalFile(data);
  } catch {
    throw new PersistError("No se pudo guardar el archivo de la carta.");
  }
}

export function persistFailResponse(error: unknown) {
  return {
    error:
      error instanceof PersistError
        ? error.message
        : "No se pudo guardar. Inténtalo de nuevo.",
  };
}

export async function resetMenu() {
  await writeMenu(structuredClone(seedMenu));
  return readMenu();
}

export async function upsertCategory(category: Category) {
  const menu = await readMenu();
  const next = {
    ...category,
    slug: uniqueSlug(category.slug || category.name, menu.categories, category.id),
  };
  const index = menu.categories.findIndex((item) => item.id === next.id);
  if (index >= 0) menu.categories[index] = next;
  else menu.categories.push(next);
  menu.categories.sort((a, b) => a.order - b.order);
  await writeMenu(menu);
  return next;
}

export async function deleteCategory(id: string) {
  const menu = await readMenu();
  menu.categories = menu.categories.filter((item) => item.id !== id);
  menu.products = menu.products.filter((item) => item.categoryId !== id);
  await writeMenu(menu);
}

export async function upsertProduct(product: Product) {
  const menu = await readMenu();
  const index = menu.products.findIndex((item) => item.id === product.id);
  if (index >= 0) menu.products[index] = product;
  else menu.products.push(product);
  menu.products.sort((a, b) => a.order - b.order);
  await writeMenu(menu);
  return product;
}

export async function deleteProduct(id: string) {
  const menu = await readMenu();
  menu.products = menu.products.filter((item) => item.id !== id);
  await writeMenu(menu);
}

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
const githubBranch = process.env.MENU_GITHUB_BRANCH || "main";
const githubToken = process.env.GITHUB_TOKEN || process.env.MENU_GITHUB_TOKEN || "";

type Cache = { menu: MenuData; at: number };

let cache: Cache | null = null;

export class PersistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistError";
  }
}

class ConflictError extends Error {
  constructor() {
    super("conflict");
    this.name = "ConflictError";
  }
}

function withImages(menu: MenuData): MenuData {
  return {
    ...menu,
    products: menu.products.map((product) => ({
      ...product,
      image: imageFor(product),
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

function parseMenu(data: unknown): MenuData | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as MenuData & { content?: string };
  if (Array.isArray(raw.categories) && Array.isArray(raw.products)) {
    return withImages({
      categories: raw.categories,
      products: raw.products,
    });
  }
  if (typeof raw.content === "string") {
    try {
      return parseMenu(JSON.parse(Buffer.from(raw.content.replace(/\s/g, ""), "base64").toString("utf8")));
    } catch {
      return null;
    }
  }
  return null;
}

function readLocalFile(): MenuData | null {
  try {
    if (!existsSync(dataFile)) return null;
    return parseMenu(JSON.parse(readFileSync(dataFile, "utf8")));
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

async function readGithub(): Promise<{ menu: MenuData; sha: string } | null> {
  if (!githubToken) return null;
  try {
    const response = await fetch(`${githubContentsUrl()}?ref=${githubBranch}`, {
      headers: githubHeaders(),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { sha?: string; content?: string };
    const menu = parseMenu(payload);
    if (!menu || !payload.sha) return null;
    return { menu, sha: payload.sha };
  } catch {
    return null;
  }
}

async function writeGithub(data: MenuData, sha: string) {
  if (!githubToken) {
    throw new PersistError(
      "No se pudo guardar en la carta publicada. Hay que configurar el guardado del servidor."
    );
  }

  const saved = await fetch(githubContentsUrl(), {
    method: "PUT",
    headers: {
      ...githubHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Actualiza la carta desde el admin",
      content: Buffer.from(JSON.stringify(data, null, 2), "utf8").toString("base64"),
      sha,
      branch: githubBranch,
    }),
  });

  if (saved.status === 409) throw new ConflictError();
  if (!saved.ok) {
    throw new PersistError("No se pudo guardar la carta publicada.");
  }
}

export async function readMenu(): Promise<MenuData> {
  if (isVercel && cache && Date.now() - cache.at < 2000) {
    return structuredClone(cache.menu);
  }

  if (isVercel) {
    const remote = await readGithub();
    if (remote) {
      cache = { menu: remote.menu, at: Date.now() };
      return structuredClone(remote.menu);
    }
  }

  return structuredClone(readLocalFile() || cloneSeed());
}

async function mutateMenu(mutator: (menu: MenuData) => void) {
  if (!isVercel) {
    const menu = readLocalFile() || cloneSeed();
    mutator(menu);
    try {
      writeLocalFile(menu);
    } catch {
      throw new PersistError("No se pudo guardar el archivo de la carta.");
    }
    return menu;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const remote = await readGithub();
    if (!remote) {
      throw new PersistError("No se pudo leer la carta para guardar los cambios.");
    }
    const menu = structuredClone(remote.menu);
    mutator(menu);
    try {
      await writeGithub(menu, remote.sha);
      cache = { menu, at: Date.now() };
      return menu;
    } catch (error) {
      if (error instanceof ConflictError && attempt < 2) continue;
      throw error instanceof PersistError
        ? error
        : new PersistError("No se pudo guardar la carta publicada.");
    }
  }

  throw new PersistError("No se pudo guardar la carta publicada.");
}

export async function writeMenu(data: MenuData) {
  await mutateMenu((menu) => {
    menu.categories = data.categories;
    menu.products = data.products;
  });
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
  let saved = category;
  await mutateMenu((menu) => {
    saved = {
      ...category,
      slug: uniqueSlug(category.slug || category.name, menu.categories, category.id),
    };
    const index = menu.categories.findIndex((item) => item.id === saved.id);
    if (index >= 0) menu.categories[index] = saved;
    else menu.categories.push(saved);
    menu.categories.sort((a, b) => a.order - b.order);
  });
  return saved;
}

export async function deleteCategory(id: string) {
  await mutateMenu((menu) => {
    menu.categories = menu.categories.filter((item) => item.id !== id);
    menu.products = menu.products.filter((item) => item.categoryId !== id);
  });
}

export async function upsertProduct(product: Product) {
  await mutateMenu((menu) => {
    const index = menu.products.findIndex((item) => item.id === product.id);
    if (index >= 0) menu.products[index] = product;
    else menu.products.push(product);
    menu.products.sort((a, b) => a.order - b.order);
  });
  return product;
}

export async function deleteProduct(id: string) {
  await mutateMenu((menu) => {
    menu.products = menu.products.filter((item) => item.id !== id);
  });
}

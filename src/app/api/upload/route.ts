import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { createId } from "@/lib/format";

export const dynamic = "force-dynamic";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxBytes = 4 * 1024 * 1024;
const isVercel = process.env.VERCEL === "1";
const githubOwner = process.env.VERCEL_GIT_REPO_OWNER || "seebap28-netizen";
const githubRepo = process.env.VERCEL_GIT_REPO_SLUG || "sushidelvalle";
const githubBranch = process.env.MENU_GITHUB_BRANCH || "main";
const githubToken = process.env.GITHUB_TOKEN || process.env.MENU_GITHUB_TOKEN || "";

function extension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

async function uploadToGithub(filename: string, bytes: Buffer) {
  if (!githubToken) {
    throw new Error("No se pudo guardar la foto en el servidor.");
  }

  const filePath = `public/uploads/${filename}`;
  const response = await fetch(
    `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "sushidelvalle-admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Agrega foto ${filename}`,
        content: bytes.toString("base64"),
        branch: githubBranch,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("No se pudo guardar la foto en la carta publicada.");
  }

  return `https://raw.githubusercontent.com/${githubOwner}/${githubRepo}/${githubBranch}/${filePath}`;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "Sube una imagen." }, { status: 400 });
    }
    if (!allowed.has(file.type)) {
      return NextResponse.json({ error: "Usa JPG, PNG o WEBP." }, { status: 400 });
    }
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: "La foto pesa demasiado. Usa una imagen de menos de 4 MB." },
        { status: 400 }
      );
    }

    const filename = `${createId()}.${extension(file.type)}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    if (isVercel) {
      const url = await uploadToGithub(filename, bytes);
      return NextResponse.json({ url });
    }

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    const message =
      error instanceof Error && error.message.startsWith("No se pudo")
        ? error.message
        : "No se pudo subir la foto.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

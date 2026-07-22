import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { del, get, list, put } from "@vercel/blob";
import { readFile } from "fs/promises";
import path from "path";
import { CONTENT_PREFIX } from "@/app/lib/content";

/**
 * Reads and writes the content Jane edits — announcement, hours, services,
 * add-ons, blog posts — in the Blob store.
 *
 * This replaced a route that committed to GitHub with a personal access token.
 * The token expired after 67 days and every content tab went silently blank;
 * Blob's credential is injected and rotated by Vercel, so there is nothing left
 * to renew.
 */

/** Only these may be read or written — a path from the browser picks the file. */
function resolve(requested: string | null): string | null {
  if (!requested) return null;
  if (requested === "blog") return "blog";
  const allowed = /^(siteConfig\.json|services\.json|addons\.json|blog\/[a-z0-9-]+\.md)$/;
  return allowed.test(requested) ? requested : null;
}

async function readStored(name: string): Promise<string | null> {
  try {
    // Always origin: the editor must open what was last saved, not a cached copy.
    const stored = await get(`${CONTENT_PREFIX}${name}`, {
      access: "private",
      useCache: false,
    });
    if (stored) return await new Response(stored.stream).text();
  } catch {
    /* not in the store — fall back to what shipped in the repo */
  }
  try {
    return await readFile(path.join(process.cwd(), "content", name), "utf-8");
  } catch {
    return null;
  }
}

/**
 * Keeps the version being replaced. Editing used to produce a git commit that
 * could be read back or reverted; a timestamped copy per save is what stands in
 * for that now.
 */
async function archive(name: string) {
  const previous = await readStored(name);
  if (previous === null) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await put(`content-history/${name}.${stamp}`, previous, {
    access: "private",
    addRandomSuffix: false,
    contentType: "text/plain",
  });
}

/** Content feeds every marketing page, so an edit invalidates the whole tree. */
function refreshSite() {
  revalidatePath("/", "layout");
}

export async function GET(req: Request) {
  const name = resolve(new URL(req.url).searchParams.get("path"));
  if (!name) return NextResponse.json({ error: "Unknown content path" }, { status: 400 });

  if (name === "blog") {
    const { blobs } = await list({ prefix: `${CONTENT_PREFIX}blog/` });
    const files = blobs
      .map((b) => ({ name: b.pathname.slice(`${CONTENT_PREFIX}blog/`.length) }))
      .filter((f) => f.name.endsWith(".md"));
    return NextResponse.json({ files });
  }

  const content = await readStored(name);
  if (content === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ content });
}

export async function POST(req: Request) {
  const { path: requested, content } = (await req.json()) as {
    path?: string;
    content?: string;
  };
  const name = resolve(requested ?? null);
  if (!name || name === "blog" || content === undefined) {
    return NextResponse.json({ error: "Unknown content path" }, { status: 400 });
  }

  await archive(name);
  await put(`${CONTENT_PREFIX}${name}`, content, {
    access: "private",
    addRandomSuffix: false,
    // Saving the same file twice is the whole point of an editor; without this
    // the store rejects the second save as a duplicate.
    allowOverwrite: true,
    contentType: name.endsWith(".json") ? "application/json" : "text/markdown",
  });
  refreshSite();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { path: requested } = (await req.json()) as { path?: string };
  const name = resolve(requested ?? null);
  if (!name || !name.startsWith("blog/")) {
    return NextResponse.json({ error: "Only blog posts can be deleted" }, { status: 400 });
  }

  await archive(name);
  await del(`${CONTENT_PREFIX}${name}`);
  refreshSite();
  return NextResponse.json({ ok: true });
}

/**
 * One-time move of the editable content from the repo into the Blob store.
 *
 * The reader falls back to these same files when the store is empty, so running
 * this is not strictly required — it just makes the store the live source
 * straight away instead of on Jane's first save.
 *
 * Usage: node --env-file=<file with BLOB_READ_WRITE_TOKEN> scripts/seed-content-blob.mjs
 */
import { list, put } from "@vercel/blob";
import { readFile, readdir } from "fs/promises";
import path from "path";

const CONTENT_PREFIX = "content/";
const root = process.cwd();

const files = ["siteConfig.json", "services.json", "addons.json"];
const blogDir = path.join(root, "content", "blog");
for (const name of await readdir(blogDir)) {
  if (name.endsWith(".md")) files.push(`blog/${name}`);
}

for (const name of files) {
  const body = await readFile(path.join(root, "content", name), "utf-8");
  await put(`${CONTENT_PREFIX}${name}`, body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: name.endsWith(".json") ? "application/json" : "text/markdown",
  });
  console.log(`seeded ${name} (${body.length} bytes)`);
}

const { blobs } = await list({ prefix: CONTENT_PREFIX });
console.log(`\nstore now holds ${blobs.length} content objects:`);
for (const b of blobs) console.log("  -", b.pathname, b.size, "bytes");

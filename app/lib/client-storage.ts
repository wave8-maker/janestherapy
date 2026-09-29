import {
  mkdir,
  readdir,
  readFile,
  writeFile,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { get, list, put } from "@vercel/blob";

export class RecordConflict extends Error {}
export interface Stored<T> {
  value: T;
  version: string;
}
const root = path.join(process.cwd(), "data", "clients");
function blobEnabled() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  if (process.env.VERCEL) throw new Error("Client storage is not configured");
  return false;
}
function safeKey(key: string) {
  if (!/^(profiles|links)\/[a-zA-Z0-9-]+$/.test(key))
    throw new Error("Invalid record key");
  return `${key}.json`;
}
export async function readRecord<T>(key: string): Promise<Stored<T> | null> {
  const filename = safeKey(key);
  if (blobEnabled()) {
    const result = await get(`clients/${filename}`, {
      access: "private",
      useCache: false,
    });
    if (!result) return null;
    return {
      value: JSON.parse(await new Response(result.stream).text()),
      version: result.blob.etag,
    };
  }
  try {
    const source = await readFile(path.join(root, filename), "utf8");
    return { value: JSON.parse(source), version: source };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
export async function writeRecord<T>(
  key: string,
  value: T,
  version?: string,
): Promise<void> {
  const filename = safeKey(key);
  const content = JSON.stringify(value);
  if (blobEnabled()) {
    try {
      await put(`clients/${filename}`, content, {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
        allowOverwrite: version !== undefined,
        ...(version !== undefined ? { ifMatch: version } : {}),
      });
    } catch (error) {
      if (
        /precondition|already exists|etag|condition.*fail/i.test(String(error))
      )
        throw new RecordConflict("Record changed");
      throw error;
    }
    return;
  }
  const destination = path.join(root, filename);
  await mkdir(path.dirname(destination), { recursive: true });
  // An exclusive lock spans the comparison and atomic replacement, even across local processes.
  const lock = `${destination}.lock`;
  try {
    await writeFile(lock, "", { flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST")
      throw new RecordConflict("Record is being saved");
    throw error;
  }
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    const current = await readRecord<T>(key);
    if (current?.version !== version)
      throw new RecordConflict("Record changed");
    await writeFile(temporary, content);
    await rename(temporary, destination);
  } finally {
    await unlink(temporary).catch(() => {});
    await unlink(lock);
  }
}
export async function listRecords<T>(kind: "profiles" | "links"): Promise<T[]> {
  let keys: string[];
  if (blobEnabled()) {
    keys = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: `clients/${kind}/`, cursor });
      keys.push(
        ...page.blobs.map((b) =>
          b.pathname.replace(/^clients\//, "").replace(/\.json$/, ""),
        ),
      );
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  } else {
    const dir = path.join(root, kind);
    await mkdir(dir, { recursive: true });
    keys = (await readdir(dir))
      .filter((f) => f.endsWith(".json"))
      .map((f) => `${kind}/${f.slice(0, -5)}`);
  }
  const values: T[] = [];
  // Bound simultaneous reads when there are many clients.
  for (let i = 0; i < keys.length; i += 20) {
    const batch = await Promise.all(
      keys.slice(i, i + 20).map((key) => readRecord<T>(key)),
    );
    for (const item of batch) if (item) values.push(item.value);
  }
  return values;
}

import { mkdir, readdir, readFile, writeFile, unlink } from "fs/promises";
import path from "path";
import { get, list, put, del } from "@vercel/blob";
import type { IntakeFormData, IntakeSubmission } from "./intake-types";

const LOCAL_DIR = path.join(process.cwd(), "data", "intakes");
const BLOB_PREFIX = "intakes/";

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function blobPath(id: string): string {
  return `${BLOB_PREFIX}${id}.json`;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function ensureLocalDir() {
  await mkdir(LOCAL_DIR, { recursive: true });
}

export async function saveIntake(data: IntakeFormData): Promise<IntakeSubmission> {
  const submission: IntakeSubmission = {
    ...data,
    id: newId(),
    submittedAt: new Date().toISOString(),
  };
  const content = JSON.stringify(submission, null, 2);

  if (useBlob()) {
    await put(blobPath(submission.id), content, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
    });
  } else {
    await ensureLocalDir();
    await writeFile(path.join(LOCAL_DIR, `${submission.id}.json`), content, "utf-8");
  }

  return submission;
}

export async function listIntakes(): Promise<IntakeSubmission[]> {
  if (useBlob()) {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    const submissions = await Promise.all(
      blobs.map(async (blob) => readBlobSubmission(blob.pathname))
    );
    const valid = submissions.filter((s): s is IntakeSubmission => s !== null);
    return valid.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  await ensureLocalDir();
  const files = (await readdir(LOCAL_DIR)).filter((f) => f.endsWith(".json"));
  const submissions = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(LOCAL_DIR, file), "utf-8");
      return JSON.parse(raw) as IntakeSubmission;
    })
  );
  return submissions.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

async function readBlobSubmission(pathname: string): Promise<IntakeSubmission | null> {
  const result = await get(pathname, { access: "private" });
  if (!result) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as IntakeSubmission;
}

export async function getIntake(id: string): Promise<IntakeSubmission | null> {
  if (useBlob()) {
    return readBlobSubmission(blobPath(id));
  }

  const filePath = path.join(LOCAL_DIR, `${id}.json`);
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as IntakeSubmission;
  } catch {
    return null;
  }
}

export async function deleteIntake(id: string): Promise<boolean> {
  if (useBlob()) {
    await del(blobPath(id));
    return true;
  }

  const filePath = path.join(LOCAL_DIR, `${id}.json`);
  try {
    await unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

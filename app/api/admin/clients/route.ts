import { isAdminAuthenticated } from "@/app/lib/admin-auth";
import { getIntake } from "@/app/lib/intake-storage";
import {
  ClientInputError,
  validateProfile,
  validateSession,
  validateNote,
  summarizeClient,
} from "@/app/lib/client-types";
import type { ClientRecord, IntakeLink } from "@/app/lib/client-types";
import {
  listRecords,
  readRecord,
  writeRecord,
  RecordConflict,
} from "@/app/lib/client-storage";

export const runtime = "nodejs";
const response = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
function id(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(value))
    throw new ClientInputError("Invalid id");
  return value;
}
function failure(error: unknown) {
  if (error instanceof ClientInputError || error instanceof SyntaxError)
    return response({ error: "invalid" }, 400);
  if (error instanceof RecordConflict)
    return response({ error: "conflict" }, 409);
  console.error(
    "Client record operation failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return response({ error: "storage" }, 503);
}
export async function GET(req: Request) {
  if (!(await isAdminAuthenticated()))
    return response({ error: "unauthorized" }, 401);
  try {
    const clientId = new URL(req.url).searchParams.get("id");
    const links = await listRecords<IntakeLink>("links");
    if (clientId) {
      const stored = await readRecord<ClientRecord>(`profiles/${id(clientId)}`);
      if (!stored) return response({ error: "notFound" }, 404);
      return response({
        client: stored.value,
        links: links.filter((link) => link.clientId === clientId),
      });
    }
    const clients = (await listRecords<ClientRecord>("profiles"))
      .map(summarizeClient)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return response({ clients, links });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated()))
    return response({ error: "unauthorized" }, 401);
  try {
    const body = await req.json();
    if (!body || typeof body !== "object")
      throw new ClientInputError("Invalid input");
    const clientId = id(body.id);
    const profile = validateProfile(body.profile);
    const now = new Date().toISOString();
    const client: ClientRecord = {
      ...profile,
      id: clientId,
      createdAt: now,
      updatedAt: now,
      revision: 1,
      sessions: [],
      notes: [],
    };
    await writeRecord(`profiles/${clientId}`, client);
    return response({ client }, 201);
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated()))
    return response({ error: "unauthorized" }, 401);
  try {
    const body = await req.json();
    if (!body || typeof body !== "object")
      throw new ClientInputError("Invalid input");
    const clientId = id(body.id);
    const stored = await readRecord<ClientRecord>(`profiles/${clientId}`);
    if (!stored) return response({ error: "notFound" }, 404);
    if (body.action === "linkIntake") {
      const intakeId = id(body.intakeId);
      const intake = await getIntake(intakeId);
      if (!intake) return response({ error: "notFound" }, 404);
      const previous = await readRecord<IntakeLink>(`links/${intakeId}`);
      if (previous)
        return previous.value.clientId === clientId
          ? response({ ok: true })
          : response({ error: "alreadyLinked" }, 409);
      await writeRecord(`links/${intakeId}`, {
        intakeId,
        submittedAt: intake.submittedAt,
        clientId,
        createdAt: new Date().toISOString(),
      });
      return response({ ok: true });
    }
    if (body.revision !== stored.value.revision)
      throw new RecordConflict("Record changed");
    const client = stored.value;
    const now = new Date().toISOString();
    if (body.action === "profile")
      Object.assign(client, validateProfile(body.data));
    else if (body.action === "session" || body.action === "note") {
      const recordId = id(body.recordId);
      if (body.action === "session") {
        const data = validateSession(body.data);
        const previous = client.sessions.find((item) => item.id === recordId);
        client.sessions = [
          ...client.sessions.filter((item) => item.id !== recordId),
          {
            ...data,
            id: recordId,
            createdAt: previous?.createdAt ?? now,
            updatedAt: now,
          },
        ];
      } else {
        const data = validateNote(body.data);
        const previous = client.notes.find((item) => item.id === recordId);
        client.notes = [
          ...client.notes.filter((item) => item.id !== recordId),
          {
            ...data,
            id: recordId,
            createdAt: previous?.createdAt ?? now,
            updatedAt: now,
          },
        ];
      }
    } else throw new ClientInputError("Invalid action");
    client.updatedAt = now;
    client.revision += 1;
    await writeRecord(`profiles/${clientId}`, client, stored.version);
    return response({ client });
  } catch (error) {
    return failure(error);
  }
}

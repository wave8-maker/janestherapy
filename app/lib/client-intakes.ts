import { createHash } from "node:crypto";
import type {
  ClientProfile,
  ClientRecord,
  IntakeLink,
} from "@/app/lib/client-types";
import type { IntakeSubmission } from "@/app/lib/intake-types";
import { listIntakes } from "@/app/lib/intake-storage";
import {
  listRecords,
  readRecord,
  writeRecord,
  RecordConflict,
} from "@/app/lib/client-storage";

const nameKey = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();
const emailKey = (value: string) => value.trim().toLowerCase();
const phoneKey = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1")
    ? digits.slice(1)
    : digits;
};
function birthday(value: string): string {
  const parts = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  const date = parts
    ? `${parts[3]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`
    : value;
  return /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date
    ? date
    : "";
}
function profileFromIntake(intake: IntakeSubmission): ClientProfile {
  return {
    name: intake.name.trim() || intake.printedName?.trim() || "Unnamed client",
    phone: intake.phone.trim(),
    email: intake.email.trim(),
    birthday: birthday(intake.birthday),
    precautions: "",
  };
}
function sameIdentity(client: ClientProfile, incoming: ClientProfile): boolean {
  if (nameKey(client.name) !== nameKey(incoming.name)) return false;
  const phone = phoneKey(incoming.phone),
    otherPhone = phoneKey(client.phone);
  const email = emailKey(incoming.email),
    otherEmail = emailKey(client.email);
  if (phone && otherPhone && phone !== otherPhone) return false;
  if (email && otherEmail && email !== otherEmail) return false;
  if (
    incoming.birthday &&
    client.birthday &&
    incoming.birthday !== client.birthday
  )
    return false;
  return Boolean(
    (phone.length >= 7 && phone === otherPhone) ||
    (email.includes("@") && email === otherEmail),
  );
}

/** Repeated runs resume safely; signed originals and existing staff records never change. */
export async function syncClientIntakes(): Promise<void> {
  const [intakes, clients, links] = await Promise.all([
    listIntakes(),
    listRecords<ClientRecord>("profiles"),
    listRecords<IntakeLink>("links"),
  ]);
  const linkedIds = new Set(links.map((link) => link.intakeId));
  for (const intake of [...intakes].sort(
    (a, b) =>
      a.submittedAt.localeCompare(b.submittedAt) || a.id.localeCompare(b.id),
  )) {
    if (linkedIds.has(intake.id)) continue;
    // A stable ID also recovers a profile whose link failed to save on an earlier attempt.
    const generatedId = `intake-${createHash("sha256").update(intake.id).digest("hex").slice(0, 32)}`;
    const profile = profileFromIntake(intake);
    let client = clients.find((item) => item.id === generatedId);
    if (!client) {
      const candidates = clients.filter((item) => sameIdentity(item, profile));
      if (candidates.length === 1) client = candidates[0];
    }
    const now = new Date().toISOString();
    if (!client) {
      client = {
        ...profile,
        id: generatedId,
        createdAt: now,
        updatedAt: now,
        revision: 1,
        sessions: [],
        notes: [],
      };
      try {
        await writeRecord(`profiles/${generatedId}`, client);
      } catch (error) {
        if (!(error instanceof RecordConflict)) throw error;
        const existing = await readRecord<ClientRecord>(
          `profiles/${generatedId}`,
        );
        if (!existing) throw error;
        client = existing.value;
      }
      clients.push(client);
    }
    const link: IntakeLink = {
      intakeId: intake.id,
      clientId: client.id,
      submittedAt: intake.submittedAt,
      createdAt: now,
    };
    try {
      await writeRecord(`links/${intake.id}`, link);
    } catch (error) {
      if (
        !(error instanceof RecordConflict) ||
        !(await readRecord<IntakeLink>(`links/${intake.id}`))
      )
        throw error;
    }
    linkedIds.add(intake.id);
  }
}

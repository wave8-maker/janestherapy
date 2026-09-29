export interface ClientProfile {
  name: string;
  phone: string;
  email: string;
  birthday: string;
  precautions: string;
}
export interface SessionInput {
  date: string;
  service: string;
  duration: string;
  concerns: string;
  treatment: string;
  feedback: string;
  nextVisit: string;
  notes: string;
}
export interface NoteInput {
  text: string;
  pinned: boolean;
}
export interface RecordStamp {
  id: string;
  createdAt: string;
  updatedAt: string;
}
export type MassageSession = SessionInput & RecordStamp;
export type ClientNote = NoteInput & RecordStamp;
export interface ClientRecord extends ClientProfile, RecordStamp {
  revision: number;
  sessions: MassageSession[];
  notes: ClientNote[];
}
export interface ClientSummary extends ClientProfile {
  id: string;
  updatedAt: string;
  lastVisit: string;
  sessionCount: number;
}
export interface IntakeLink {
  submittedAt?: string;
  intakeId: string;
  clientId: string;
  createdAt: string;
}
export class ClientInputError extends Error {}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ClientInputError("Invalid input");
  return value as Record<string, unknown>;
}
function text(data: Record<string, unknown>, key: string, max = 10000): string {
  const value = data[key] ?? "";
  if (typeof value !== "string" || value.length > max)
    throw new ClientInputError(`Invalid ${key}`);
  return value.trim();
}
function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validateProfile(value: unknown): ClientProfile {
  const data = object(value);
  const profile = {
    name: text(data, "name", 200),
    phone: text(data, "phone", 80),
    email: text(data, "email", 254),
    birthday: text(data, "birthday", 10),
    precautions: text(data, "precautions"),
  };
  if (!profile.name) throw new ClientInputError("Name is required");
  if (profile.birthday && !validDate(profile.birthday))
    throw new ClientInputError("Invalid birthday");
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
    throw new ClientInputError("Invalid email");
  return profile;
}
export function validateSession(value: unknown): SessionInput {
  const data = object(value);
  const session = {
    date: text(data, "date", 10),
    service: text(data, "service", 200),
    duration: text(data, "duration", 4),
    concerns: text(data, "concerns"),
    treatment: text(data, "treatment"),
    feedback: text(data, "feedback"),
    nextVisit: text(data, "nextVisit"),
    notes: text(data, "notes"),
  };
  if (!validDate(session.date)) throw new ClientInputError("Invalid date");
  if (
    session.duration &&
    (!/^\d+$/.test(session.duration) ||
      +session.duration < 1 ||
      +session.duration > 1440)
  )
    throw new ClientInputError("Invalid duration");
  if (
    ![
      session.service,
      session.concerns,
      session.treatment,
      session.feedback,
      session.nextVisit,
      session.notes,
    ].some(Boolean)
  )
    throw new ClientInputError("Add session details or notes");
  return session;
}
export function validateNote(value: unknown): NoteInput {
  const data = object(value);
  const valueText = text(data, "text");
  if (
    !valueText ||
    (data.pinned !== undefined && typeof data.pinned !== "boolean")
  )
    throw new ClientInputError("Invalid note");
  return { text: valueText, pinned: data.pinned === true };
}
export function matchesClient(
  client: Pick<ClientProfile, "name" | "phone" | "email">,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  return (
    !q ||
    [client.name, client.phone, client.email].some((v) =>
      v.toLowerCase().includes(q),
    ) ||
    (/^[+\d\s().-]+$/.test(q) &&
      digits.length > 0 &&
      client.phone.replace(/\D/g, "").includes(digits))
  );
}
export function summarizeClient(client: ClientRecord): ClientSummary {
  const { id, name, phone, email, birthday, precautions, updatedAt } = client;
  return {
    id,
    name,
    phone,
    email,
    birthday,
    precautions,
    updatedAt,
    lastVisit:
      client.sessions
        .map((s) => s.date)
        .sort()
        .at(-1) ?? "",
    sessionCount: client.sessions.length,
  };
}

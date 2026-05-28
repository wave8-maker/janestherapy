import { cookies } from "next/headers";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin-session")?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;
  return Boolean(secret && session === secret);
}

export function isAdminSession(session: string | undefined): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return Boolean(secret && session === secret);
}

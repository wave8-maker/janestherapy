import { cookies } from "next/headers";
import { verifySessionToken } from "./admin-session";

/** Server-component / route helper: is the current request an authenticated admin? */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin-session")?.value;
  return verifySessionToken(session);
}

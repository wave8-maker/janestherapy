import { notFound } from "next/navigation";
import AdminPage from "../page";
import { TABS } from "../tabs";

// Every section is the same admin app; the address only says which one is open.
export function generateStaticParams() {
  return TABS.map((item) => ({ tab: item.path }));
}

export default async function AdminTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  if (!TABS.some((item) => item.path === tab)) notFound();
  return <AdminPage />;
}

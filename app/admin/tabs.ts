/** Admin sections and the address each one lives at (/admin/<path>). */
export const TABS = [
  { key: "settings", path: "settings", label: "nav.settings" },
  { key: "services", path: "services", label: "nav.services" },
  { key: "addons", path: "addons", label: "nav.addons" },
  { key: "blog", path: "blog", label: "nav.blog" },
  { key: "intake", path: "clients", label: "nav.intake" },
  { key: "invoice", path: "invoices", label: "nav.invoice" },
] as const;
export type Tab = (typeof TABS)[number]["key"];

export const tabHref = (tab: Tab) =>
  `/admin/${TABS.find((item) => item.key === tab)!.path}`;

/** `/admin` itself opens the first section. */
export function tabFromPath(pathname: string | null): Tab {
  const segment = pathname?.split("/")[2] ?? "";
  return TABS.find((item) => item.path === segment)?.key ?? "settings";
}

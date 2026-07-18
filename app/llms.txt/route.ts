import {
  getServices,
  getAddons,
  getServiceModes,
  getSiteConfig,
  slugify,
} from "../lib/content";
import { SITE_URL, SITE_NAME, BUSINESS } from "../lib/seo";

export const dynamic = "force-static";

/**
 * llms.txt — a plain-markdown overview of the practice for AI assistants
 * and answer engines (see llmstxt.org). Generated from the same content
 * files that power the site, so pricing and hours never drift.
 */
export function GET() {
  const services = getServices();
  const addons = getAddons();
  const { modes } = getServiceModes();
  const { hours } = getSiteConfig();

  const mobile = modes.find((m) => m.key === "mobile");

  const priceLine = (pricing: { duration: string | null; price: string }[]) =>
    pricing
      .map((p) => (p.duration ? `${p.duration}: ${p.price}` : p.price))
      .join(" · ");

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> Solo massage therapy practice of ${BUSINESS.legalName} (Certified Massage Therapist) in ${BUSINESS.city}, ${BUSINESS.region}. Every session is one-on-one with Jane — deep tissue, Swedish, lymphatic drainage, prenatal/postpartum, sports recovery, and Traditional Chinese Medicine bodywork (cupping, Gua Sha, moxibustion). Available in her private studio or as mobile visits across the South Bay.`,
    "",
    "## Services & Pricing (USD)",
    "",
    ...services.map(
      (s) =>
        `- **${s.name}** — ${priceLine(s.pricing)}. ${s.description} Learn more: ${SITE_URL}/services/${slugify(s.name)}`,
    ),
    "",
    "## Add-ons",
    "",
    ...addons.map(
      (a) => `- **${a.name}** — ${priceLine(a.pricing)}. ${a.description}`,
    ),
    "",
    "## Locations",
    "",
    `- **In studio**: private home studio in ${BUSINESS.city}, ${BUSINESS.region}; exact address shared once an appointment is confirmed.`,
  ];

  if (mobile) {
    lines.push(
      `- **Mobile (outcall)**: Jane brings the table, linens, and oils to your home, hotel, or office. Areas served: ${(mobile.areas ?? []).join(", ")}.${mobile.note ? ` ${mobile.note}` : ""}`,
    );
  }

  lines.push(
    "",
    "## Hours",
    "",
    ...hours.map((h) => `- ${h.day}: ${h.time}`),
    "",
    "## Contact & Booking",
    "",
    `- Book online: https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services`,
    `- Text (no calls — Jane has no front desk): ${BUSINESS.telephone}`,
    `- Email: ${BUSINESS.email}`,
    `- Gift cards: https://app.squareup.com/gift/MLXZ54Y84T053/order`,
    "",
    "## Pages",
    "",
    `- [Home](${SITE_URL}/): practice overview, conditions treated, client reviews`,
    `- [Services & Pricing](${SITE_URL}/services): full treatment menu with prices`,
    `- [About Jane](${SITE_URL}/about): Jane Zhang's background and approach`,
    `- [Location & Contact](${SITE_URL}/location): hours, service areas, FAQ`,
    `- [Blog](${SITE_URL}/blog): wellness articles by Jane`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

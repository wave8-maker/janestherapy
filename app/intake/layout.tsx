import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Client Intake Form",
  description: "Complete your intake form before your massage session.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/intake" },
};

/**
 * No site header, no footer, no links out — on the studio tablet the wizard is
 * the whole world. The chrome lives in the (site) route group instead.
 */
export default function IntakeLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen flex-1 bg-cream bg-warm-glow">{children}</main>;
}

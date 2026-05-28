import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Client Intake – Jane's Therapy",
  description: "Complete your intake form before your massage session.",
  robots: { index: false, follow: false },
};

export default function IntakeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      {children}
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Jane Zhang – Jane's Therapy",
  description:
    "Jane Zhang, CMT, graduated from the National Holistic Institute with 800+ hours of training. Learn about her background and approach to massage therapy.",
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold text-bark mb-2">About Me</h1>
      <p className="text-brand italic mb-12">Jane Zhang, CMT</p>

      <div className="grid sm:grid-cols-3 gap-12 items-start">
        {/* Photo placeholder */}
        <div className="sm:col-span-1 flex flex-col items-center">
          <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden">
            <Image
              src="/jane-photo.webp"
              alt="Jane Zhang, CMT"
              fill
              className="object-cover"
            />
          </div>
          <p className="mt-2 text-sm text-center text-bark-light italic">Jane Zhang, CMT</p>
        </div>

        {/* Bio */}
        <div className="sm:col-span-2 space-y-5 text-bark-light leading-relaxed">
          <p>
            I am Jane Zhang. As a graduate of the{" "}
            <strong className="text-bark">National Holistic Institute (NHI)</strong>{" "}
            with over 800 hours of training in various modalities of massage
            therapy and health education, I am deeply passionate about enhancing
            people&apos;s well-being.
          </p>
          <p>
            My background in{" "}
            <strong className="text-bark">traditional Chinese medicine</strong>{" "}
            significantly informs my approach to bodywork and chronic pain
            management. Over the years, I have successfully helped numerous
            clients alleviate ailments such as lower and upper back pain, neck
            pain, headaches and migraines, frozen shoulder, sciatic nerve pain,
            plantar fasciitis, as well as ankle, knee, and wrist issues.
          </p>
          <p>
            My commitment as a trained professional is to prioritize my
            clients&apos; satisfaction, striving to provide a serene and
            therapeutic massage experience that caters to their individual needs.
          </p>
          <p>
            Outside of my professional life, I cherish my time cooking and
            exploring music. Playing the piano brings joy and balance to my
            life, complementing my journey as a lifelong learner.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 bg-brand-light rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-bark mb-3">
          Ready to experience the difference?
        </h2>
        <p className="text-bark-light mb-6 text-sm">
          Every session is with Jane directly—no front desk staff, no handoffs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-sage text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Book Now
          </Link>
          <Link
            href="/services"
            className="border border-brand text-brand px-8 py-3 rounded-full font-semibold hover:bg-brand-light transition-colors"
          >
            View Services
          </Link>
        </div>
      </div>
    </div>
  );
}

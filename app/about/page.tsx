import Image from "next/image";
import Link from "next/link";
import JsonLd from "../components/JsonLd";
import { pageMeta, personJsonLd } from "../lib/seo";

const BOOKING_URL =
  "https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services";

export const metadata = pageMeta({
  title: "About Jane Zhang, CMT",
  description:
    "Meet Jane Zhang, CMT. Learn about her journey building a trusted, word-of-mouth massage practice and her Traditional Chinese Medicine approach to pain relief, athletic recovery, and women's wellness.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <JsonLd data={personJsonLd()} />

      <div className="mb-14">
        <p className="eyebrow">Meet your therapist</p>
        <h1 className="font-display text-4xl sm:text-5xl text-bark mt-3">About Jane</h1>
        <p className="text-brand mt-2 text-lg">Jane Zhang, CMT</p>
      </div>

      {/* Photo floats left; the bio wraps around it on sm+ screens */}
      <div className="text-bark-light text-[1.0625rem] leading-relaxed space-y-5 [&_strong]:font-semibold [&_strong]:text-bark">
        <div className="max-w-sm mx-auto sm:max-w-none sm:mx-0 sm:float-left sm:w-64 md:w-80 sm:mr-10 sm:mb-4 mb-4">
          <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden">
            <Image
              src="/jane-photo.webp"
              alt="Jane Zhang, CMT"
              fill
              sizes="(min-width: 768px) 20rem, (min-width: 640px) 16rem, 100vw"
              className="object-cover"
            />
          </div>
          <p className="mt-2 text-sm text-center text-bark-light italic">Jane Zhang, CMT</p>
        </div>

        <p>
          Two years ago, after gaining extensive experience at a highly
          regarded massage therapy center, I made the decision to begin my own
          practice. I rented a treatment room inside a chiropractic clinic and
          started seeing clients independently, with a vision of creating a
          practice built on <strong>trust, clinical excellence, and
          personalized care</strong>.
        </p>
        <p>
          I am deeply grateful to the clients who believed in me from the very
          beginning. Many have remained with me throughout the years, referring
          their family members, friends, and colleagues. Their continued trust
          has allowed my practice to grow almost entirely through{" "}
          <strong>word of mouth</strong>—a reflection of the relationships I
          have built and the results my clients experience.
        </p>
        <p>
          Building a business has been a journey. During the early years, I
          traveled back to China several times to continue my professional
          education, studying advanced therapeutic techniques, including{" "}
          <strong>acupuncture and Traditional Chinese Medicine</strong>. I also
          returned to spend time with my family. Even during these periods
          away, my clients patiently waited for my return, something I will
          always appreciate.
        </p>
        <p>
          Today, I have the privilege of helping people from all walks of life.
          I work with clients experiencing <strong>chronic neck and shoulder
          pain</strong>, <strong>upper and lower back pain</strong>, headaches,
          muscle tension, <strong>repetitive strain injuries</strong>, and
          postural imbalances. Every treatment is customized to the individual
          because no two bodies—and no two stories—are the same.
        </p>
        <p>
          I also enjoy supporting <strong>athletes</strong> in their recovery
          and performance. I have worked with competitive athletes, including{" "}
          <strong>swimmers training at an elite level</strong>, as well as
          musicians whose demanding practice schedules place unique stress on
          their bodies.
        </p>
        <p>
          <strong>Women&apos;s wellness</strong> is another area I am
          passionate about. I have helped women through{" "}
          <strong>fertility massage</strong>, celebrated with many as they
          returned for <strong>prenatal care</strong> during pregnancy, and now
          support new mothers with <strong>postpartum bodywork</strong> to
          encourage recovery, restore balance, and promote overall well-being.
        </p>
        <p>
          I believe that effective bodywork is more than relieving pain—it is
          about <strong>helping the body function at its best</strong>. My
          approach combines skilled hands, careful listening, and a genuine
          commitment to each client&apos;s health and recovery.
        </p>
        <p>
          Whether you are seeking <strong>pain relief</strong>, stress
          reduction, improved mobility, <strong>athletic recovery</strong>, or
          support through <strong>pregnancy and postpartum</strong>, I look
          forward to helping you move with greater comfort, confidence, and
          ease.
        </p>
      </div>

      {/* CTA */}
      <div className="clear-both mt-16 bg-brand-light rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-bark mb-3">
          Ready to experience the difference?
        </h2>
        <p className="text-bark-light mb-6 text-sm">
          Every session is with Jane directly—no front desk staff, no handoffs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Book Now
          </Link>
          <Link href="/services" className="btn btn-secondary">
            View Services
          </Link>
        </div>
      </div>
    </div>
  );
}

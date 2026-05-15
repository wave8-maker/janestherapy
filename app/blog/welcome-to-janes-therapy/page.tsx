import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Welcome to Jane's Therapy – Blog",
  description:
    "Welcome to the inaugural post on the Jane's Therapy blog, dedicated to massage therapy, wellness tips, and community stories in Palo Alto.",
};

export default function WelcomePost() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link
        href="/blog"
        className="text-sm text-brand hover:underline mb-8 block"
      >
        ← Back to Blog
      </Link>

      <p className="text-xs text-bark-light/70 mb-2">July 9, 2024</p>
      <h1 className="text-3xl font-semibold text-bark mb-10">
        Welcome to Jane&apos;s Therapy
      </h1>

      <div className="prose prose-stone max-w-none space-y-5 text-bark-light leading-relaxed">
        <p>
          Welcome to the inaugural post on the Jane&apos;s Therapy blog, a space
          dedicated to sharing the art and science of massage therapy, tips on
          wellness, and stories that resonate with our community in Palo Alto and
          the surrounding Mid-Peninsula area. As the owner and a passionate
          massage therapist, I&apos;m thrilled to welcome you into our world where
          health meets relaxation and every session is a step toward holistic
          well-being.
        </p>

        <h2 className="text-xl font-semibold text-bark mt-8">
          Discover Jane&apos;s Therapy: Your Local Oasis for Wellness
        </h2>
        <p>
          Nestled in the heart of Palo Alto, CA, Jane&apos;s Therapy offers a
          sanctuary from the stresses of daily life. We believe in the power of a
          great massage not just to relax but to heal. Our signature services,
          including the luxurious{" "}
          <strong className="text-bark">Glow from Head to Toe</strong>, the
          intensive{" "}
          <strong className="text-bark">Clinical Deep Tissue</strong>, and the
          rejuvenating{" "}
          <strong className="text-bark">Lymphatic Drainage</strong>, are designed
          to cater to a variety of needs, ensuring personalized care for each
          client.
        </p>

        <h2 className="text-xl font-semibold text-bark mt-8">
          Why Choose Us?
        </h2>
        <p>
          At Jane&apos;s Therapy, we&apos;re not just about massages; we&apos;re
          about creating a tailored experience that addresses your specific
          wellness needs. Here&apos;s why our clients choose us:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong className="text-bark">Expertise:</strong> With years of
            experience and a deep understanding of body mechanics, our treatments
            are more than just routine; they are a blend of technique, knowledge,
            and intuition.
          </li>
          <li>
            <strong className="text-bark">Personalization:</strong> Every session
            is tailored to meet the unique needs of our clients. Whether it&apos;s
            managing chronic pain, recovering from an injury, or simply seeking a
            moment of peace, we are here to facilitate your journey to wellness.
          </li>
          <li>
            <strong className="text-bark">Community Focus:</strong> As a local
            business, we are dedicated to the health and wellness of our neighbors.
            We strive to be a part of our clients&apos; wellness journey and a
            positive force in the community.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-bark mt-8">
          Join Us on Our Journey
        </h2>
        <p>
          We invite you to follow our blog, where each post will delve deeper into
          the benefits of massage, share wellness tips, and highlight how
          Jane&apos;s Therapy can play a part in enhancing your quality of life. We
          are here to support your wellness journey and ensure that every visit
          leaves you feeling better than when you arrived.
        </p>
        <p>
          Thank you for choosing Jane&apos;s Therapy. We look forward to serving you
          and helping you achieve your wellness goals. Remember, your journey to a
          healthier, more relaxed self is just an appointment away.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-brand-light text-center">
        <Link
          href="https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-sage text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
        >
          Book a Session
        </Link>
      </div>
    </div>
  );
}

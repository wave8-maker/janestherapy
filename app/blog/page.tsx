import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog – Jane's Therapy",
  description:
    "Wellness tips, massage therapy insights, and updates from Jane's Therapy in Palo Alto.",
};

const posts = [
  {
    slug: "welcome-to-janes-therapy",
    title: "Welcome to Jane's Therapy",
    date: "July 9, 2024",
    excerpt:
      "Welcome to the inaugural post on the Jane's Therapy blog, a space dedicated to sharing the art and science of massage therapy, tips on wellness, and stories that resonate with our community in Palo Alto.",
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold text-bark mb-2">Blog</h1>
      <p className="text-bark-light mb-12">
        Wellness tips, therapy insights, and updates from Jane.
      </p>

      <div className="space-y-6">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="bg-white border border-brand-light rounded-xl p-6 shadow-sm"
          >
            <p className="text-xs text-bark-light/70 mb-2">{post.date}</p>
            <h2 className="text-xl font-semibold text-bark mb-2">
              <Link
                href={`/blog/${post.slug}`}
                className="hover:text-brand transition-colors"
              >
                {post.title}
              </Link>
            </h2>
            <p className="text-sm text-bark-light leading-relaxed">
              {post.excerpt}
            </p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-4 inline-block text-brand text-sm font-semibold hover:underline"
            >
              Read more →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

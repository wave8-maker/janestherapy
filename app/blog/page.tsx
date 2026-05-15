import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPosts } from "../lib/content";

export const metadata: Metadata = {
  title: "Blog – Jane's Therapy",
  description: "Wellness tips, massage therapy insights, and updates from Jane's Therapy in Palo Alto.",
};

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold text-bark mb-2">Blog</h1>
      <p className="text-bark-light mb-12">Wellness tips, therapy insights, and updates from Jane.</p>
      <div className="space-y-6">
        {posts.map((post) => {
          const dateStr = new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          });
          return (
            <article
              key={post.slug}
              className="bg-white border border-brand-light rounded-xl p-6 shadow-sm"
            >
              <p className="text-xs text-bark-light/70 mb-2">{dateStr}</p>
              <h2 className="text-xl font-semibold text-bark mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-brand transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-sm text-bark-light leading-relaxed">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 inline-block text-brand text-sm font-semibold hover:underline"
              >
                Read more →
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}

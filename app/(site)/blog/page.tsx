import Link from "next/link";
import { getBlogPosts } from "@/app/lib/content";
import { pageMeta } from "@/app/lib/seo";

export const metadata = pageMeta({
  title: "Blog",
  description:
    "Wellness tips, massage therapy insights, and updates from Jane's Therapy in San Jose.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="mb-14">
        <p className="eyebrow">Journal</p>
        <h1 className="font-display text-4xl sm:text-5xl text-bark mt-3 mb-3">Blog</h1>
        <p className="text-bark-light text-lg">
          Wellness tips, therapy insights, and updates from Jane.
        </p>
      </div>
      <div className="space-y-6">
        {posts.map((post) => {
          const dateStr = new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          });
          return (
            <article
              key={post.slug}
              className="card-soft p-7 transition-transform duration-300 hover:-translate-y-1"
            >
              <p className="eyebrow text-bark-light/60 mb-3">{dateStr}</p>
              <h2 className="font-display text-2xl text-bark mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-brand transition-colors">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && (
                <p className="text-bark-light leading-relaxed">{post.excerpt}</p>
              )}
              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 inline-flex items-center gap-1 text-brand text-sm font-semibold link-underline"
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

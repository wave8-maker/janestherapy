import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPost, getBlogPosts } from "../../lib/content";
import { marked } from "marked";

export async function generateStaticParams() {
  return getBlogPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  return { title: `${post.title} – Jane's Therapy`, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  const html = marked.parse(post.content) as string;
  const dateStr = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href="/blog" className="text-sm text-brand hover:underline mb-8 block">
        ← Back to Blog
      </Link>
      <p className="text-xs text-bark-light/70 mb-2">{dateStr}</p>
      <h1 className="text-3xl font-semibold text-bark mb-10">{post.title}</h1>
      <div
        className="prose prose-stone max-w-none text-bark-light leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-bark [&_h2]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-bark [&_h3]:mt-6 [&_strong]:text-bark [&_ul]:list-disc [&_ul]:ml-4 [&_li]:my-1"
        dangerouslySetInnerHTML={{ __html: html }}
      />
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

import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPost, getBlogPosts } from "@/app/lib/content";
import JsonLd from "@/app/components/JsonLd";
import { SITE_URL, SITE_NAME } from "@/app/lib/seo";
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
  const description =
    post.excerpt || `${post.title} — wellness insights from Jane's Therapy in San Jose.`;
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/blog/${slug}`,
      siteName: SITE_NAME,
      title: `${post.title} – ${SITE_NAME}`,
      description,
      publishedTime: post.date,
    },
    twitter: { card: "summary_large_image", title: post.title, description },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  // Content from the rich editor is HTML; legacy posts may be markdown
  const html = post.content.trimStart().startsWith("<")
    ? post.content
    : (marked.parse(post.content) as string);
  const dateStr = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
    author: { "@type": "Person", name: "Jane Zhang", jobTitle: "Certified Massage Therapist" },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <JsonLd data={blogPostingLd} />
      <Link href="/blog" className="text-sm text-brand link-underline mb-8 inline-block">
        ← Back to Blog
      </Link>
      <p className="eyebrow text-bark-light/60 mb-3">{dateStr}</p>
      <h1 className="font-display text-3xl sm:text-4xl text-bark leading-tight mb-10">{post.title}</h1>
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

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { get, list } from "@vercel/blob";

const contentDir = path.join(process.cwd(), "content");

/**
 * Content Jane edits in the admin lives in the Blob store; the files under
 * `content/` are the defaults it was seeded from and the fallback whenever the
 * store has nothing to say — local development, and the first request after a
 * deploy to a fresh store.
 *
 * Blob is what removed the GitHub token from this path. Vercel injects and
 * rotates its credential, so there is nothing left to expire and no admin tab
 * that can quietly go blank when it does.
 */
export const CONTENT_PREFIX = "content/";

async function readContent(name: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // The CDN cache is on by default and would keep serving the previous
      // text after a save, so the page would regenerate with the old wording.
      // These reads happen at build time and on revalidation only — rare enough
      // to always go to origin.
      const stored = await get(`${CONTENT_PREFIX}${name}`, {
        access: "private",
        useCache: false,
      });
      if (stored) return await new Response(stored.stream).text();
    } catch {
      /* not in the store yet — fall through to the packaged default */
    }
  }
  return fs.readFileSync(path.join(contentDir, name), "utf-8");
}

export async function getSiteConfig() {
  const raw = await readContent("siteConfig.json");
  return JSON.parse(raw) as {
    announcement: string;
    hours: { day: string; time: string }[];
  };
}

export async function getServices() {
  const raw = await readContent("services.json");
  return (JSON.parse(raw) as { items: Service[] }).items;
}

/** URL slug for a service, derived from its name so services.json never has to store one. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getServiceBySlug(slug: string) {
  return (await getServices()).find((s) => slugify(s.name) === slug);
}

export async function getAddons() {
  const raw = await readContent("addons.json");
  return (JSON.parse(raw) as { items: Addon[] }).items;
}

/**
 * Slugs of every post, from the store when it has any, otherwise from disk.
 *
 * A store that refuses the request must not take the build down with it — the
 * packaged posts are a worse answer than the live ones, but they are an answer.
 */
export async function listBlogSlugs(): Promise<string[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: `${CONTENT_PREFIX}blog/` });
      const slugs = blobs
        .map((b) => b.pathname.slice(`${CONTENT_PREFIX}blog/`.length))
        .filter((name) => name.endsWith(".md"))
        .map((name) => name.replace(/\.md$/, ""));
      if (slugs.length) return slugs;
    } catch {
      /* unreachable store — fall back to what shipped in the repo */
    }
  }
  const dir = path.join(contentDir, "blog");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export async function getBlogPosts() {
  const slugs = await listBlogSlugs();
  const posts = await Promise.all(slugs.map((slug) => getBlogPost(slug)));
  return posts
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map(({ slug, title, date, excerpt }) => ({ slug, title, date, excerpt }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getBlogPost(slug: string) {
  let raw: string;
  try {
    raw = await readContent(`blog/${slug}.md`);
  } catch {
    return null;
  }
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    excerpt: data.excerpt as string,
    content,
  };
}

export function getReviews() {
  const raw = fs.readFileSync(path.join(contentDir, "reviews.json"), "utf-8");
  return JSON.parse(raw) as ReviewsContent;
}

export function getServiceModes() {
  const raw = fs.readFileSync(path.join(contentDir, "serviceModes.json"), "utf-8");
  return JSON.parse(raw) as ServiceModesContent;
}

export interface Review {
  name: string;
  location: string;
  rating: number;
  date: string;
  source: string;
  text: string;
}

export interface ReviewsContent {
  googleReviewUrl: string;
  yelpPageUrl: string;
  yelpReviewUrl: string;
  items: Review[];
}

export interface Pricing {
  duration: string;
  price: string;
}

export interface Service {
  name: string;
  badge?: string;
  description: string;
  pricing: Pricing[];
  details?: string[];
  /** Short hook shown on the detail page, e.g. "Relax. Rejuvenate. Radiate." */
  tagline?: string;
  /** Long-form narrative paragraphs for the detail page. Falls back to `description` if absent. */
  story?: string[];
}

export interface Addon {
  name: string;
  description: string;
  pricing: Pricing[];
}

export interface ServiceMode {
  key: string;
  label: string;
  title: string;
  description: string;
  meta: string;
  areas?: string[];
  note?: string;
}

export interface ServiceModesContent {
  bookingUrl: string;
  eyebrow: string;
  heading: string;
  subheading: string;
  modes: ServiceMode[];
}

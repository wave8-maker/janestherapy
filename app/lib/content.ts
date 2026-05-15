import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");

export function getSiteConfig() {
  const raw = fs.readFileSync(path.join(contentDir, "siteConfig.json"), "utf-8");
  return JSON.parse(raw) as {
    announcement: string;
    hours: { day: string; time: string }[];
  };
}

export function getServices() {
  const raw = fs.readFileSync(path.join(contentDir, "services.json"), "utf-8");
  return (JSON.parse(raw) as { items: Service[] }).items;
}

export function getAddons() {
  const raw = fs.readFileSync(path.join(contentDir, "addons.json"), "utf-8");
  return (JSON.parse(raw) as { items: Addon[] }).items;
}

export function getBlogPosts() {
  const dir = path.join(contentDir, "blog");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const { data } = matter(fs.readFileSync(path.join(dir, file), "utf-8"));
      return {
        slug: file.replace(/\.md$/, ""),
        title: data.title as string,
        date: data.date as string,
        excerpt: data.excerpt as string,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBlogPost(slug: string) {
  const raw = fs.readFileSync(path.join(contentDir, `blog/${slug}.md`), "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    excerpt: data.excerpt as string,
    content,
  };
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
}

export interface Addon {
  name: string;
  description: string;
  pricing: Pricing[];
}

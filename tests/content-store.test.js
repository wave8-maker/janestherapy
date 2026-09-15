const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const content = read("app/lib/content.ts");
const route = read("app/api/admin/content/route.ts");
const adminPage = read("app/admin/page.tsx");

// ── nothing left to expire ────────────────────────────────────────────────────
// A GitHub token expired after 67 days and every content tab silently emptied.
// Blob's credential is Vercel's to rotate, so the token is gone from this path.
assert.ok(
  !fs.existsSync(path.join(root, "app/api/admin/github/route.ts")),
  "the GitHub-backed content route should be gone"
);
for (const [name, source] of [["content lib", content], ["content route", route], ["admin page", adminPage]]) {
  assert.doesNotMatch(source, /GITHUB_PAT|api\.github\.com|api\/admin\/github/, `${name} should no longer reach for GitHub`);
}

// ── a store that says no must not take the site down ──────────────────────────
assert.match(content, /readFileSync\(path\.join\(contentDir, name\)/, "reads must fall back to the packaged files");
assert.match(
  content,
  /try \{[\s\S]*?list\(\{ prefix: `\$\{CONTENT_PREFIX\}blog\/` \}\)[\s\S]*?\} catch/,
  "listing posts must survive an unreachable store"
);

// ── freshness ─────────────────────────────────────────────────────────────────
// get() serves the CDN cache by default, which would hand a just-saved page its
// previous wording.
const getCalls = [...content.matchAll(/await get\([\s\S]{0,200}?\)/g), ...route.matchAll(/await get\([\s\S]{0,200}?\)/g)];
assert.ok(getCalls.length >= 2, "expected the content reads to be present");
for (const [call] of getCalls) {
  assert.match(call, /useCache: false/, `a content read still uses the CDN cache: ${call.slice(0, 60)}`);
}

// ── saving twice must work ────────────────────────────────────────────────────
// Blob rejects a repeat write to the same pathname unless told otherwise, and an
// editor's second save is exactly that.
assert.match(route, /allowOverwrite: true/, "saving over an existing file must be allowed");

// ── an edit reaches the site without a rebuild ────────────────────────────────
assert.match(route, /revalidatePath\("\/", "layout"\)/, "a save must invalidate the pages built from the content");

// ── the editor asks for paths the route actually serves ───────────────────────
// Moving off GitHub dropped the `content/` prefix from every path but the blog
// listing, which kept asking for `content/blog`. The route answered 400, so the
// tab listed nothing while the site went on serving the posts.
const allowedSource = (route.match(/const allowed = \/(.+)\/;/) ?? [])[1];
assert.ok(allowedSource, "the route's allowlist should be readable from its source");
const allowed = new RegExp(allowedSource);
const requested = [...adminPage.matchAll(/gh(?:Get|Save|Delete)\(\s*(["`])([^"`]+)\1/g)]
  .map(([, , requestedPath]) => requestedPath.replace(/\$\{[^}]+\}/g, "a-slug"));
assert.ok(requested.length >= 5, "expected to find the admin's content calls");
for (const requestedPath of requested) {
  assert.ok(
    requestedPath === "blog" || allowed.test(requestedPath),
    `the admin asks for "${requestedPath}", which the content route rejects`
  );
}

// ── an empty store must not empty the editor either ───────────────────────────
// The site falls back to the packaged posts when the store lists none; the
// editor has to agree, or the two disagree about what exists.
assert.match(
  route,
  /try \{[\s\S]*?list\(\{ prefix: `\$\{CONTENT_PREFIX\}blog\/` \}\)[\s\S]*?\} catch/,
  "listing posts for the editor must survive an unreachable store"
);
assert.match(route, /if \(files\.length\)[\s\S]{0,200}?packagedPosts\(\)/, "an empty store should fall back to the packaged posts");

// ── only known files are reachable ────────────────────────────────────────────
assert.match(route, /siteConfig\\\.json\|services\\\.json\|addons\\\.json/, "the route must allowlist the content it serves");
assert.match(route, /archive\(name\)/, "the version being replaced should be kept");

console.log("content store checks passed");

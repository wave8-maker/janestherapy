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

// ── only known files are reachable ────────────────────────────────────────────
assert.match(route, /siteConfig\\\.json\|services\\\.json\|addons\\\.json/, "the route must allowlist the content it serves");
assert.match(route, /archive\(name\)/, "the version being replaced should be kept");

console.log("content store checks passed");

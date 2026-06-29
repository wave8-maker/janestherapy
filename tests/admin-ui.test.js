const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const adminPage = fs.readFileSync(path.join(root, "app/admin/page.tsx"), "utf8");
const invoiceTab = fs.readFileSync(path.join(root, "app/admin/InvoiceTab.tsx"), "utf8");
const publicSiteFiles = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/services/page.tsx",
  "app/location/page.tsx",
  "app/blog/page.tsx",
  "app/blog/[slug]/page.tsx",
  "app/opengraph-image.tsx",
  "app/lib/seo.ts",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

assert.doesNotMatch(publicSiteFiles + invoiceTab, /Palo Alto/, "site and admin defaults should not reference Palo Alto");
assert.match(publicSiteFiles, /San Jose/, "public site should reference San Jose");
assert.match(invoiceTab, /address: "San Jose, CA"/, "invoice sender default should use San Jose");

assert.match(adminPage, /const \[sidebarOpen, setSidebarOpen\]/, "admin page should track collapsible sidebar state");
assert.match(adminPage, /<aside\b/, "admin navigation should render as a left sidebar");
assert.doesNotMatch(adminPage, /<header className="bg-white border-b border-brand-light/, "admin header should be folded into the sidebar");
assert.doesNotMatch(adminPage, /max-w-3xl mx-auto/, "admin content should use full available width instead of a narrow centered container");
assert.match(adminPage, /aria-label="Toggle admin sidebar"/, "sidebar toggle should be accessible");
assert.match(adminPage, /type FontSize = "small" \| "medium" \| "large"/, "admin page should define three font size modes");
assert.match(adminPage, /useState<FontSize>\("medium"\)/, "admin font size should default to medium");
assert.match(adminPage, /const FONT_SIZE_OPTIONS/, "admin sidebar should render font size options");
assert.match(adminPage, /字号/, "admin sidebar should label the font size controls");
assert.match(adminPage, /小/, "admin sidebar should include the small font button");
assert.match(adminPage, /中/, "admin sidebar should include the medium font button");
assert.match(adminPage, /大/, "admin sidebar should include the large font button");
assert.match(adminPage, /admin-font-\$\{fontSize\}/, "admin root should receive the selected font size class");
assert.match(adminPage, /setFontSize\(option\.value\)/, "font size buttons should update the admin font size");
assert.match(adminPage, /admin-readable/, "admin page should use a scoped high-readability surface");
assert.match(adminPage, /#f7f9fb/, "admin background should move to a cleaner high-contrast neutral");
assert.match(adminPage, /#1f2933/, "admin primary text should use a high-contrast ink color");
assert.match(adminPage, /min-h-14/, "admin sidebar actions should have larger touch targets");
assert.match(adminPage, /admin-control/, "admin inputs should use larger high-contrast controls");
assert.match(adminPage, /admin-panel/, "admin content should use a clearer panel surface");

assert.match(invoiceTab, /function emptyState\(\): InvoiceState/, "invoice form should have an empty initial state");
assert.match(invoiceTab, /const emptyParty/, "invoice parties should start blank");
assert.match(invoiceTab, /setInv\(emptyState\(\)\)/, "invoice reset should restore the empty state");
assert.match(invoiceTab, /套用常用信息 Load Defaults/, "saved defaults should be loaded explicitly, not by default");
assert.match(invoiceTab, /defaultsSaved/, "saving invoice defaults should give visible feedback");
assert.match(invoiceTab, /new Date\(inv\.invoiceDate \|\| Date\.now\(\)\)/, "auto invoice number should work when the invoice date is blank");
assert.doesNotMatch(invoiceTab, /useEffect\(\(\) => \{[\s\S]*localStorage\.getItem\(LS_KEY\)/, "invoice defaults should not auto-load from localStorage");
assert.doesNotMatch(invoiceTab, /terms:/, "invoice terms should be removed from state");
assert.doesNotMatch(invoiceTab, /periodFrom|periodTo/, "invoice service period fields should be removed");
assert.doesNotMatch(invoiceTab, /feeRate|feeOverride|rowFee/, "invoice studio fee state and calculations should be removed");
assert.doesNotMatch(invoiceTab, /付款条款 Terms|服务周期起 Period From|服务周期止 Period To|工作室费率|Studio Fee Rate|费用 Fee/, "removed invoice fields and fee column should not render");
assert.doesNotMatch(invoiceTab, /Studio Fee/, "printable invoice should not include the studio fee column");
assert.match(invoiceTab, /rowDue\(it: LineItem\)[\s\S]*num\(it\.sales\) \+ num\(it\.gratuity\)/, "amount due should be sales plus gratuity after removing fee inputs");
assert.match(invoiceTab, /admin-control/, "invoice fields should use the admin high-readability control style");
assert.match(invoiceTab, /admin-button/, "invoice buttons should use the admin high-readability button style");

console.log("admin UI source checks passed");

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const adminPage = fs.readFileSync(path.join(root, "app/admin/page.tsx"), "utf8");
const invoiceTab = fs.readFileSync(path.join(root, "app/admin/InvoiceTab.tsx"), "utf8");

assert.match(adminPage, /const \[sidebarOpen, setSidebarOpen\]/, "admin page should track collapsible sidebar state");
assert.match(adminPage, /<aside\b/, "admin navigation should render as a left sidebar");
assert.doesNotMatch(adminPage, /<header className="bg-white border-b border-brand-light/, "admin header should be folded into the sidebar");
assert.doesNotMatch(adminPage, /max-w-3xl mx-auto/, "admin content should use full available width instead of a narrow centered container");
assert.match(adminPage, /aria-label="Toggle admin sidebar"/, "sidebar toggle should be accessible");

assert.match(invoiceTab, /function emptyState\(\): InvoiceState/, "invoice form should have an empty initial state");
assert.match(invoiceTab, /const emptyParty/, "invoice parties should start blank");
assert.match(invoiceTab, /setInv\(emptyState\(\)\)/, "invoice reset should restore the empty state");
assert.match(invoiceTab, /套用常用信息 Load Defaults/, "saved defaults should be loaded explicitly, not by default");
assert.doesNotMatch(invoiceTab, /useEffect\(\(\) => \{[\s\S]*localStorage\.getItem\(LS_KEY\)/, "invoice defaults should not auto-load from localStorage");

console.log("admin UI source checks passed");

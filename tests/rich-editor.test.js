const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

// The drag maths and the style round-trip are plain functions on purpose: the
// dragging itself needs a browser, but what a drag *computes* and what a saved
// post carries can be checked here.
const { imageStyle, parseImageWidth, parseImageAlign, widthPercent } = require("../app/admin/imageStyle.ts");

// ── what a resized image carries in the saved HTML ────────────────────────────
assert.equal(imageStyle(null, null), null, "an untouched image should carry no style at all");
assert.equal(imageStyle("62%", null), "width:62%");
assert.equal(imageStyle(null, "center"), "margin-left:auto;margin-right:auto");
assert.equal(imageStyle("40%", "right"), "width:40%;margin-left:auto;margin-right:0");
assert.equal(imageStyle("40%", "left"), "width:40%;margin-left:0;margin-right:auto");

// ── reopening a post has to find the same size and alignment ──────────────────
for (const [width, align] of [
  [null, null],
  ["62%", null],
  [null, "center"],
  ["10%", "left"],
  ["100%", "right"],
]) {
  const style = imageStyle(width, align);
  assert.equal(parseImageWidth(style), width, `width should survive a round trip: ${style}`);
  assert.equal(parseImageAlign(style), align, `alignment should survive a round trip: ${style}`);
}

// Posts written before this existed, and anything a browser reformats on the way.
assert.equal(parseImageWidth(null), null);
assert.equal(parseImageWidth(""), null);
assert.equal(parseImageWidth("width: 55% ; margin-left: auto"), "55%", "spacing around the value should not matter");
assert.equal(parseImageAlign("margin-left: auto; margin-right: auto;"), "center");
assert.equal(parseImageAlign("color:red"), null, "an unrelated style should not read as an alignment");
// A pixel width from some other editor is not a percentage this UI can show.
assert.equal(parseImageWidth("width:420px"), null, "only percentage widths belong to the slider");

// ── the drag maths ────────────────────────────────────────────────────────────
assert.equal(widthPercent(400, 800), 50, "half the editor's width is 50%");
assert.equal(widthPercent(790, 800), 99);
assert.equal(widthPercent(1200, 800), 100, "dragging past the edge stops at full width");
assert.equal(widthPercent(0, 800), 10, "dragging to nothing stops at a still-visible 10%");
assert.equal(widthPercent(-50, 800), 10, "dragging past the left edge stops there too");
assert.equal(widthPercent(333, 800), 42, "a percentage is rounded, never fractional");
assert.equal(widthPercent(400, 0), 100, "a container of unknown width should not divide by zero");

// ── the editor wires those helpers up ─────────────────────────────────────────
const root = path.resolve(__dirname, "..");
const editor = fs.readFileSync(path.join(root, "app/admin/RichEditor.tsx"), "utf8");

assert.match(editor, /from "\.\/imageStyle"/, "the editor should use the shared style helpers, not its own copy");
assert.match(editor, /ReactNodeViewRenderer/, "resizing needs the image to render through a node view");
assert.match(editor, /setPointerCapture/, "the drag handle must keep receiving moves once the pointer leaves it");
assert.match(editor, /type="range"/, "the slider is what makes resizing workable on a phone");

// ── tables ────────────────────────────────────────────────────────────────────
assert.match(editor, /TableKit/, "the editor should register the table extensions");
assert.match(editor, /insertTable\(\{ rows: 3, cols: 3, withHeaderRow: true \}\)/, "the table button should insert a table with a header row");
for (const command of ["addRowBefore", "addRowAfter", "addColumnBefore", "addColumnAfter", "deleteRow", "deleteColumn", "deleteTable"]) {
  assert.match(editor, new RegExp(`\\.${command}\\(\\)`), `the table row is missing ${command}`);
}

// Tiptap pins its peer versions exactly, so a caret here would drag @tiptap/core
// and @tiptap/pm up with it and leave the rest of the editor a minor behind.
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const core = pkg.dependencies["@tiptap/react"].replace(/^[^\d]*/, "");
assert.equal(
  pkg.dependencies["@tiptap/extension-table"],
  core,
  "the table extension must be pinned to the version the rest of Tiptap is on"
);

// ── what a reader sees ────────────────────────────────────────────────────────
// A post is injected as HTML, so its tags can carry no classes and Tailwind's
// preflight has already zeroed their margins. Nothing but this stylesheet is
// between a table and no borders at all.
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const postPage = fs.readFileSync(path.join(root, "app/(site)/blog/[slug]/page.tsx"), "utf8");
assert.match(postPage, /className="post-body"/, "the post body should take its styling from one named class");
assert.doesNotMatch(postPage, /prose/, "prose classes do nothing here — the typography plugin is not installed");
for (const selector of [".post-body p", ".post-body table", ".post-body th", ".post-body img"]) {
  assert.ok(css.includes(selector), `${selector} should be styled — nothing else styles a post's tags`);
}

console.log("rich editor checks passed");

"use client";
import {
  useEditor,
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { useRef, useState } from "react";
import { useAdminLang } from "./i18n";
import {
  imageStyle,
  parseImageAlign,
  parseImageWidth,
  widthPercent,
  MIN_WIDTH_PERCENT,
  type ImageAlign,
} from "./imageStyle";

interface Props {
  initialContent: string;
  onChange: (html: string) => void;
}

function ToolBtn({ active, disabled, onClick, title, children }: {
  active?: boolean; disabled?: boolean;
  onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-1 rounded text-sm leading-tight transition-colors min-w-[28px] ${
        active
          ? "bg-brand text-white"
          : "text-bark hover:bg-brand-light"
      } disabled:opacity-30 disabled:cursor-default`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-gray-200 mx-1 self-center" />;
}

/** The strip that appears under the toolbar while an image or a table is selected. */
function ContextRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-t border-brand-light bg-white">
      <span className="text-xs text-bark-light mr-1">{label}</span>
      {children}
    </div>
  );
}

const ALIGN_MARGINS: Record<Exclude<ImageAlign, null>, React.CSSProperties> = {
  left: { marginLeft: 0, marginRight: "auto" },
  center: { marginLeft: "auto", marginRight: "auto" },
  right: { marginLeft: "auto", marginRight: 0 },
};

/**
 * How an image looks while it is being edited: a handle to drag in the corner
 * and the width it is heading for. This is the editor's view only — a saved post
 * still holds a plain `<img>`, sized by the style `renderHTML` writes below.
 */
function ImageView({ node, updateAttributes, selected, editor, getPos }: NodeViewProps) {
  const { t } = useAdminLang();
  const columnRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragPercent, setDragPercent] = useState<number | null>(null);

  const width = node.attrs.width as string | null;
  const align = node.attrs.align as ImageAlign;
  const shownWidth = dragPercent !== null ? `${dragPercent}%` : width;

  function startResize(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    const handle = e.currentTarget;
    const column = columnRef.current;
    const box = boxRef.current;
    if (!column || !box) return;

    const available = column.offsetWidth;
    const startX = e.clientX;
    const startWidth = box.offsetWidth;
    let latest = widthPercent(startWidth, available);

    // Capture: once the pointer outruns the handle — and it will, a drag is
    // faster than a 28px target — the moves still have to arrive here.
    handle.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      latest = widthPercent(startWidth + (ev.clientX - startX), available);
      setDragPercent(latest);
    };
    // The width is written once, at the end: a commit per pointermove would
    // bury everything else under a hundred undo steps.
    const onEnd = () => {
      handle.releasePointerCapture(e.pointerId);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
      setDragPercent(null);
      updateAttributes({ width: `${latest}%` });
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  }

  return (
    <NodeViewWrapper ref={columnRef} className="my-3">
      <div
        ref={boxRef}
        style={{ width: shownWidth ?? "fit-content", maxWidth: "100%", ...(align ? ALIGN_MARGINS[align] : {}) }}
        className={`relative ${selected ? "outline-2 outline-brand" : ""}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.attrs.src}
          alt={node.attrs.alt ?? ""}
          className={`block rounded-lg ${shownWidth ? "w-full" : "max-w-full"}`}
          onClick={() => { const pos = getPos(); if (pos !== undefined) editor.commands.setNodeSelection(pos); }}
        />
        {selected && (
          <>
            <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-bark/70 text-white text-[11px] tabular-nums">
              {dragPercent ?? (width ? parseInt(width, 10) : 100)}%
            </span>
            <button
              type="button"
              onPointerDown={startResize}
              title={t("editor.image.drag")}
              aria-label={t("editor.image.drag")}
              // touch-none: without it the browser claims the gesture as a scroll
              // and the handle never sees a single move on a phone.
              className="absolute -right-2.5 -bottom-2.5 w-7 h-7 rounded-full bg-brand border-2 border-white shadow cursor-nwse-resize touch-none"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

/**
 * The stock image node, plus the width and alignment a resize leaves behind.
 *
 * Both live in the image's own `style`, because a post is stored as the HTML the
 * editor produced — there is nowhere else for them to go.
 */
const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => parseImageWidth(element.getAttribute("style")),
        renderHTML: () => ({}), // folded into `style` by renderHTML below
      },
      align: {
        default: null,
        parseHTML: (element) => parseImageAlign(element.getAttribute("style")),
        renderHTML: () => ({}),
      },
    };
  },
  renderHTML({ HTMLAttributes, node }) {
    const style = imageStyle(node.attrs.width, node.attrs.align);
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, style ? { style } : {})];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});

async function toWebP(blob: Blob): Promise<string> {
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/webp", 0.9);
      resolve(dataUrl.startsWith("data:image/webp") ? dataUrl : canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("load failed")); };
    img.src = url;
  });
}

export default function RichEditor({ initialContent, onChange }: Props) {
  const { t } = useAdminLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage.configure({ inline: false, allowBase64: true }),
      TiptapLink.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: t("editor.placeholder") }),
      // Column widths stay off: the drag targets are a few pixels wide, which is
      // no use on the phone half of this admin.
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: initialContent || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: [
          "outline-none min-h-[400px] px-5 py-4 text-sm text-bark leading-relaxed",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-5 [&_h1]:mb-2 [&_h1]:text-bark",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-bark",
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-bark",
          "[&_p]:my-2",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2",
          "[&_li]:my-0.5",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-brand-light [&_blockquote]:pl-4 [&_blockquote]:text-bark-light [&_blockquote]:italic [&_blockquote]:my-3",
          "[&_a]:text-brand [&_a]:underline",
          "[&_hr]:border-brand-light [&_hr]:my-4",
          "[&_.tableWrapper]:overflow-x-auto [&_.tableWrapper]:my-3",
          "[&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse",
          "[&_th]:border [&_th]:border-brand-light [&_th]:bg-brand-light/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:align-top",
          "[&_td]:border [&_td]:border-brand-light [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
          "[&_.selectedCell]:bg-brand-light/70",
          "[&_.ProseMirror-selectednode]:ring-2 [&_.ProseMirror-selectednode]:ring-brand",
        ].join(" "),
      },
    },
  });

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = "";
    setUploading(true);
    try {
      let blob: Blob = file;
      const isHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        /\.(heic|heif)$/i.test(file.name);
      if (isHeic) {
        const heic2any = (await import("heic2any")).default;
        const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
        blob = Array.isArray(result) ? result[0] : result;
      }
      const dataUrl = await toWebP(blob);
      editor.chain().focus().setImage({ src: dataUrl, alt: file.name }).run();
    } catch {
      alert(t("editor.imageFailed"));
    } finally {
      setUploading(false);
    }
  }

  function promptLink() {
    if (editor?.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = prompt(t("editor.enterUrl"));
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  }

  if (!editor) return null;

  const imageAttrs = editor.getAttributes("image");
  const imagePercent = imageAttrs.width ? parseInt(imageAttrs.width as string, 10) : 100;
  const setImageAttrs = (attrs: Record<string, unknown>) =>
    editor.chain().updateAttributes("image", attrs).run();

  const toolbarItems = (
    <>
      <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title={t("editor.bold")}>
        <b>B</b>
      </ToolBtn>
      <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title={t("editor.italic")}>
        <em>I</em>
      </ToolBtn>
      <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title={t("editor.strike")}>
        <s>S</s>
      </ToolBtn>
      <Divider />
      <ToolBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title={t("editor.h1")}>
        H1
      </ToolBtn>
      <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title={t("editor.h2")}>
        H2
      </ToolBtn>
      <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title={t("editor.h3")}>
        H3
      </ToolBtn>
      <Divider />
      <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title={t("editor.bulletList")}>
        • {t("editor.listLabel")}
      </ToolBtn>
      <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title={t("editor.orderedList")}>
        1. {t("editor.listLabel")}
      </ToolBtn>
      <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title={t("editor.blockquote")}>
        ❝
      </ToolBtn>
      <Divider />
      <ToolBtn active={editor.isActive("link")} onClick={promptLink} title={t("editor.link")}>
        🔗
      </ToolBtn>
      <ToolBtn disabled={uploading} onClick={() => fileInputRef.current?.click()} title={t("editor.insertImage")}>
        {uploading ? "…" : `🖼 ${t("editor.image")}`}
      </ToolBtn>
      <ToolBtn
        active={editor.isActive("table")}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title={t("editor.table.insert")}
      >
        ▦ {t("editor.table")}
      </ToolBtn>
      <Divider />
      <ToolBtn disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} title={t("editor.undo")}>
        ↩
      </ToolBtn>
      <ToolBtn disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} title={t("editor.redo")}>
        ↪
      </ToolBtn>
    </>
  );

  return (
    <div className="border border-brand-light rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-brand-light">
        {/* Mobile: hamburger header */}
        <div className="flex items-center justify-between px-2 py-1.5 sm:hidden">
          <span className="text-xs text-bark-light">{t("editor.formatting")}</span>
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setMenuOpen(o => !o)}
            className="p-1.5 rounded text-bark hover:bg-brand-light transition-colors"
            title={t("editor.formattingMenu")}
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        {/* Desktop: always visible; Mobile: toggleable */}
        <div className={`${menuOpen ? "flex" : "hidden"} sm:flex flex-wrap items-center gap-0.5 px-2 py-1.5`}>
          {toolbarItems}
        </div>

        {/* Contextual rows stay out of the hamburger: they only appear with
            something selected, and hiding them there would mean two taps to
            reach the control you just asked for. */}
        {editor.isActive("image") && (
          <ContextRow label={t("editor.image")}>
            <input
              type="range"
              min={MIN_WIDTH_PERCENT}
              max={100}
              value={imagePercent}
              onChange={e => setImageAttrs({ width: `${e.target.value}%` })}
              title={t("editor.image.width")}
              aria-label={t("editor.image.width")}
              className="w-32 sm:w-44 accent-brand"
            />
            <span className="text-xs text-bark-light tabular-nums w-10">{imagePercent}%</span>
            <ToolBtn onClick={() => setImageAttrs({ width: null })} title={t("editor.image.reset")}>
              {t("editor.image.reset")}
            </ToolBtn>
            <Divider />
            <ToolBtn active={imageAttrs.align === "left"} onClick={() => setImageAttrs({ align: "left" })} title={t("editor.image.alignLeft")}>
              ⇤
            </ToolBtn>
            <ToolBtn active={imageAttrs.align === "center"} onClick={() => setImageAttrs({ align: "center" })} title={t("editor.image.alignCenter")}>
              ⇔
            </ToolBtn>
            <ToolBtn active={imageAttrs.align === "right"} onClick={() => setImageAttrs({ align: "right" })} title={t("editor.image.alignRight")}>
              ⇥
            </ToolBtn>
            <Divider />
            <ToolBtn onClick={() => editor.chain().focus().deleteSelection().run()} title={t("editor.image.remove")}>
              ✕
            </ToolBtn>
          </ContextRow>
        )}

        {editor.isActive("table") && (
          <ContextRow label={t("editor.table")}>
            <ToolBtn onClick={() => editor.chain().focus().addRowBefore().run()} title={t("editor.table.rowBefore")}>
              ↑+{t("editor.table.rowLabel")}
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()} title={t("editor.table.rowAfter")}>
              ↓+{t("editor.table.rowLabel")}
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addColumnBefore().run()} title={t("editor.table.colBefore")}>
              ←+{t("editor.table.colLabel")}
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title={t("editor.table.colAfter")}>
              →+{t("editor.table.colLabel")}
            </ToolBtn>
            <Divider />
            <ToolBtn onClick={() => editor.chain().focus().deleteRow().run()} title={t("editor.table.deleteRow")}>
              −{t("editor.table.rowLabel")}
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteColumn().run()} title={t("editor.table.deleteCol")}>
              −{t("editor.table.colLabel")}
            </ToolBtn>
            <Divider />
            <ToolBtn onClick={() => editor.chain().focus().deleteTable().run()} title={t("editor.table.delete")}>
              ✕
            </ToolBtn>
          </ContextRow>
        )}
      </div>

      {/* Editor area */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={handleImageSelect}
      />
    </div>
  );
}

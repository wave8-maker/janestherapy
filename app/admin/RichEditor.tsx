"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState } from "react";
import { useAdminLang } from "./i18n";

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
      TiptapImage.configure({ inline: false, allowBase64: true }),
      TiptapLink.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: t("editor.placeholder") }),
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
          "[&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-3",
          "[&_hr]:border-brand-light [&_hr]:my-4",
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

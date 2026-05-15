"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState } from "react";

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

export default function RichEditor({ initialContent, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage.configure({ inline: false, allowBase64: true }),
      TiptapLink.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "开始写作… Start writing…" }),
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
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      editor.chain().focus().setImage({ src: dataUrl, alt: file.name }).run();
    } catch {
      alert("图片插入失败 Image insert failed");
    } finally {
      setUploading(false);
    }
  }

  function promptLink() {
    if (editor?.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = prompt("请输入链接地址 Enter URL:");
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  }

  if (!editor) return null;

  return (
    <div className="border border-brand-light rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-brand-light">
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="粗体 Bold">
          <b>B</b>
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体 Italic">
          <em>I</em>
        </ToolBtn>
        <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="删除线 Strike">
          <s>S</s>
        </ToolBtn>
        <Divider />
        <ToolBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="大标题 Heading 1">
          H1
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="中标题 Heading 2">
          H2
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="小标题 Heading 3">
          H3
        </ToolBtn>
        <Divider />
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="无序列表 Bullet list">
          • 列表
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="有序列表 Ordered list">
          1. 列表
        </ToolBtn>
        <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="引用 Blockquote">
          ❝
        </ToolBtn>
        <Divider />
        <ToolBtn active={editor.isActive("link")} onClick={promptLink} title="链接 Link">
          🔗
        </ToolBtn>
        <ToolBtn disabled={uploading} onClick={() => fileInputRef.current?.click()} title="插入图片 Insert image">
          {uploading ? "…" : "🖼 图片"}
        </ToolBtn>
        <Divider />
        <ToolBtn disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} title="撤销 Undo">
          ↩
        </ToolBtn>
        <ToolBtn disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} title="重做 Redo">
          ↪
        </ToolBtn>
      </div>

      {/* Editor area */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
    </div>
  );
}

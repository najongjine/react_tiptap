import React, { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { FontSize } from "./FontSize"; // 커스텀 마크 (그대로 사용)
import Dropcursor from "@tiptap/extension-dropcursor";

const btn: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
};
const btnOn: React.CSSProperties = {
  background: "#eef2ff",
  borderColor: "#c7d2fe",
};
const selectStyle: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
};

/** (선택) 서버 업로드 훅 */
async function uploadAndGetUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(file);
  });
  return dataUrl;
}

function Toolbar({ editor }: { editor: any }) {
  const [, forceUpdate] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editor) return;
    const r = () => forceUpdate((v) => v + 1);
    editor.on("selectionUpdate", r);
    editor.on("transaction", r);
    editor.on("update", r);
    editor.on("focus", r);
    editor.on("blur", r);
    return () => {
      editor.off("selectionUpdate", r);
      editor.off("transaction", r);
      editor.off("update", r);
      editor.off("focus", r);
      editor.off("blur", r);
    };
  }, [editor]);

  if (!editor) return null;

  const canUndo = editor.can().chain().focus().undo().run();
  const canRedo = editor.can().chain().focus().redo().run();

  const sizes = ["12px", "14px", "16px", "20px", "24px", "32px"];

  const markSize = editor.getAttributes("fontSize").size;
  const storedSize = editor.state.storedMarks?.find(
    (m: any) => m.type.name === "fontSize"
  )?.attrs?.size;
  const currentSize: string = markSize || storedSize || "16px";

  const setStoredFontSize = (size: string | null) => {
    const { state, view } = editor;
    const tr = state.tr;
    const markType = state.schema.marks.fontSize;
    let stored = (state.storedMarks || state.selection.$from.marks()).filter(
      (m: any) => m.type.name !== "fontSize"
    );
    if (size) stored = [...stored, markType.create({ size })];
    tr.setStoredMarks(stored);
    view.dispatch(tr);
  };

  const setFontSizeSmart = (size: string) => {
    const { empty } = editor.state.selection;
    if (!empty) {
      editor.chain().focus().setFontSize(size).run();
    }
    setStoredFontSize(size);
  };

  const unsetFontSizeSmart = () => {
    const { empty } = editor.state.selection;
    if (!empty) editor.chain().focus().unsetFontSize().run();
    setStoredFontSize(null);
  };

  const openFileDialog = () => fileInputRef.current?.click();

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !editor) return;
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      const url = await uploadAndGetUrl(f);
      editor.chain().focus().setImage({ src: url, alt: f.name }).run();
    }
    e.target.value = "";
  };

  // ⬇️ 코드 관련 상태
  const isCodeBlock = editor.isActive("codeBlock"); // ⬅️

  // ⬇️ 선택된 코드블록 복사 기능 (현재 블록 전체 텍스트 복사) — 선택
  const copyCurrentCodeBlock = () => {
    // ⬅️
    const { state } = editor;
    const pos = state.selection.$from;
    const node = pos.node(pos.depth);
    if (node?.type?.name === "codeBlock") {
      const text = node.textContent || "";
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        padding: 8,
        border: "1px solid #ddd",
        borderBottom: 0,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        background: "#fafafa",
      }}
    >
      <button
        style={{ ...btn, opacity: canUndo ? 1 : 0.5 }}
        disabled={!canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        ↶ Undo
      </button>
      <button
        style={{ ...btn, opacity: canRedo ? 1 : 0.5 }}
        disabled={!canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        ↷ Redo
      </button>

      <button
        style={{ ...btn, ...(editor.isActive("bold") ? btnOn : {}) }}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        Bold
      </button>
      <button
        style={{ ...btn, ...(editor.isActive("italic") ? btnOn : {}) }}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        Italic
      </button>
      <button
        style={{ ...btn, ...(editor.isActive("strike") ? btnOn : {}) }}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        Strike
      </button>

      {/* ⬇️ 인라인 코드 토글 */}
      <button // ⬅️
        style={{ ...btn, ...(editor.isActive("code") ? btnOn : {}) }}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline Code"
      >
        ` Code
      </button>

      <button
        style={btn}
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      >
        Clear
      </button>

      <button
        style={{ ...btn, ...(editor.isActive("paragraph") ? btnOn : {}) }}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        본문
      </button>

      {/* 폰트 크기 */}
      <select
        style={{
          ...selectStyle,
          ...(currentSize
            ? { background: "#eef2ff", borderColor: "#c7d2fe" }
            : {}),
        }}
        value={currentSize}
        onChange={(e) => setFontSizeSmart(e.target.value)}
      >
        {sizes.map((s) => (
          <option key={s} value={s}>
            {parseInt(s, 10)} px
          </option>
        ))}
      </select>
      <button style={btn} onClick={unsetFontSizeSmart}>
        크기 초기화
      </button>

      <button
        style={{ ...btn, ...(editor.isActive("bulletList") ? btnOn : {}) }}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • 목록
      </button>
      <button
        style={{ ...btn, ...(editor.isActive("orderedList") ? btnOn : {}) }}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. 목록
      </button>
      <button
        style={btn}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        — 구분선
      </button>

      {/* ⬇️ 코드블록 토글 & 복사 버튼 */}
      <button // ⬅️
        style={{ ...btn, ...(isCodeBlock ? btnOn : {}) }}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="``` 입력 후 Enter로도 생성됨"
      >
        {isCodeBlock ? "코드블록 해제" : "코드블록"}
      </button>
      <button // ⬅️
        style={{ ...btn, opacity: isCodeBlock ? 1 : 0.4 }}
        disabled={!isCodeBlock}
        onClick={copyCurrentCodeBlock}
        title="현재 코드블록 복사"
      >
        ⧉ Copy
      </button>

      {/* 이미지 업로드 */}
      <button style={btn} onClick={openFileDialog}>
        🖼 이미지
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPickFiles}
      />
    </div>
  );
}

export default function MyEditor() {
  const editor = useEditor({
    extensions: [
      FontSize,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          style: "max-width:100%;height:auto;display:block;margin:8px 0;",
        },
      }),
      StarterKit.configure({
        blockquote: false,
        heading: false,
        // ✅ codeBlock 은 StarterKit 기본 포함 (하이라이트 없음)
        // 필요시 CodeBlock만 별도 임포트할 수도 있으나 필수 아님.
      }),
      Dropcursor.configure({
        color: "#94a3b8",
        width: 2,
      }),
    ],
    content:
      `<p><strong>심플 WYSIWYG</strong> (드래그 변경 + 이후 타자 유지)</p>` +
      `<p>이미지를 붙여넣거나 드래그&드롭 해보세요.</p>` +
      `<p>문장 맨 앞에서 <code>\`\`\`</code> 입력 후 Enter → 코드블록 생성.</p>`,
    autofocus: true,
    onCreate({ editor }) {
      editor.chain().focus("end").run();
    },
    editorProps: {
      attributes: {
        style: "min-height:240px;line-height:1.6;outline:none;",
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imgs = items
          .filter((i) => i.kind === "file" && i.type.startsWith("image/"))
          .map((i) => i.getAsFile())
          .filter(Boolean) as File[];
        if (!imgs.length) return false;

        event.preventDefault();
        (async () => {
          for (const f of imgs) {
            const url = await uploadAndGetUrl(f);
            editor?.chain().focus().setImage({ src: url, alt: f.name }).run();
          }
        })();
        return true;
      },
      handleDrop: (view, event, _slice, _moved) => {
        const files = Array.from(event.dataTransfer?.files || []).filter((f) =>
          f.type.startsWith("image/")
        );
        if (!files.length) return false;

        event.preventDefault();
        (async () => {
          for (const f of files) {
            const url = await uploadAndGetUrl(f);
            editor?.chain().focus().setImage({ src: url, alt: f.name }).run();
          }
        })();
        return true;
      },
    },
  });

  // MyEditor 내부
  const handleSave = async () => {
    if (!editor) return; // 에디터 준비 전 가드

    const payload = {
      html: editor.getHTML(), // 뷰어/미리보기 용
      json: editor.getJSON(), // 재편집/복원 용
    };

    await fetch("/api/docs/demo-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // 필요하면 여기서 토스트/알림 띄워도 됨
  };

  return (
    <div style={{ maxWidth: 760, margin: "24px auto", padding: 16 }}>
      <Toolbar editor={editor} />

      {/* 카드 컨테이너 */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          minHeight: 260,
          lineHeight: 1.6,
          display: "flex", // ⬅️ 세로 레이아웃
          flexDirection: "column", // ⬅️
          gap: 12,
          background: "#fff",
        }}
      >
        {/* 코드/인라인코드 스타일 */}
        <style>{`
      pre {
        background: #0f172a10;
        padding: 12px 14px;
        border-radius: 10px;
        overflow: auto;
        border: 1px solid #e5e7eb;
        margin: 10px 0;
      }
      pre code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre;
      }
      code {
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 13px;
      }
    `}</style>

        {/* 에디터 본문 (남는 높이 채움) */}
        <div style={{ flex: 1 }}>
          <EditorContent editor={editor} />
        </div>

        {/* 카드 푸터: 우측 하단 정렬 버튼 */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            borderTop: "1px solid #eee",
            paddingTop: 12,
          }}
        >
          <button
            onClick={handleSave}
            style={{
              padding: "8px 14px",
              border: "1px solid #ddd",
              borderRadius: 10,
              background: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              cursor: "pointer",
            }}
          >
            💾 저장
          </button>
        </div>
      </div>
    </div>
  );
}

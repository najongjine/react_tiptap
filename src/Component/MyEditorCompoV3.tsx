import React, { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { FontSize } from "./FontSize"; // 커스텀 마크 (그대로 사용)
import Dropcursor from "@tiptap/extension-dropcursor";
import { Cloudinary } from "@cloudinary/url-gen";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";
import { AdvancedImage } from "@cloudinary/react";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import { useNavigate } from "react-router-dom";

const btn: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
  transition: "all 0.1s ease",
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
  minWidth: "100px", // 정렬 Select Box를 위한 최소 너비 설정
};
const colorSelectStyle: React.CSSProperties = {
  ...selectStyle,
  width: "100px",
  textAlign: "center",
  padding: "6px 4px",
};
const alignmentSelectStyle: React.CSSProperties = {
  ...selectStyle,
  width: "120px",
  fontWeight: "bold",
};

/** (선택) 서버 업로드 훅 */
async function uploadAndGetUrl(file: File): Promise<string> {
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  // Cloudinary REST API 엔드포인트 URL
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  // FormData 객체를 생성하여 파일과 업로드 프리셋을 담습니다.
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData, // FormData를 body로 직접 전송
    });

    if (!response.ok) {
      // HTTP 에러 처리
      const errorText = await response.text();
      console.error("Cloudinary upload error response:", errorText);
      throw new Error(
        "Cloudinary upload failed with status " + response.status
      );
    }

    const data = await response.json();
    // 성공 시 Cloudinary 응답에서 secure_url을 반환합니다.
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    // 업로드 실패 시 대체 URL 또는 빈 문자열 반환
    return "";
  }
}

function Toolbar({ editor }: { editor: any }) {
  const [, forceUpdate] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 사용 가능한 색상 목록 (기존 유지)
  const COLORS = [
    { name: "기본색", hex: "#000000" },
    { name: "빨강", hex: "#ef4444" },
    { name: "파랑", hex: "#3b82f6" },
    { name: "초록", hex: "#10b981" },
    { name: "보라", hex: "#8b5cf6" },
    { name: "주황", hex: "#f97316" },
  ];

  // 정렬 목록을 Select Box 옵션으로 사용
  const ALIGNMENTS = [
    { value: "left", label: "⇽ 왼쪽 정렬" },
    { value: "center", label: "⇕ 가운데 정렬" },
    { value: "right", label: "⇾ 오른쪽 정렬" },
    { value: "justify", label: "⬌ 양쪽 정렬" },
  ];

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

  const currentTextColor = editor.getAttributes("textStyle").color || "default";

  const setTextColor = (color: string) => {
    if (color === "default" || color === "#000000") {
      editor.chain().focus().unsetColor().run();
      setStoredTextColor(null);
    } else {
      editor.chain().focus().setColor(color).run();
      setStoredTextColor(color);
    }
  };

  const setStoredTextColor = (color: string | null) => {
    const { state, view } = editor;
    const tr = state.tr;
    const markType = state.schema.marks.textStyle;

    let stored = (state.storedMarks || state.selection.$from.marks()).filter(
      (m: any) => m.type.name !== "textStyle"
    );

    const currentTextStyleMark =
      state.storedMarks?.find((m: any) => m.type.name === "textStyle") ||
      state.selection.$from
        .marks()
        .find((m: any) => m.type.name === "textStyle");

    if (color) {
      const newAttrs = currentTextStyleMark
        ? { ...currentTextStyleMark.attrs, color }
        : { color };
      stored = [...stored, markType.create(newAttrs)];
    } else if (currentTextStyleMark) {
      const newAttrs = { ...currentTextStyleMark.attrs };
      delete newAttrs.color;
      if (Object.keys(newAttrs).length > 0) {
        stored = [...stored, markType.create(newAttrs)];
      }
    }

    tr.setStoredMarks(stored);
    view.dispatch(tr);
  };

  const currentAlignment =
    editor.getAttributes("paragraph").textAlign || "left";

  const handleAlignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const alignment = e.target.value;
    if (alignment) {
      editor.chain().focus().setTextAlign(alignment).run();
    }
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

  const isCodeBlock = editor.isActive("codeBlock");

  return (
    <div
      style={{
        // --- ⭐️ STICKY STYLES: 툴바 고정 ⭐️ ---
        position: "sticky",
        top: 0,
        zIndex: 10,
        width: "100%",
        // ----------------------------------------
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        padding: 8,
        // 툴바의 시각적 분리
        borderBottom: "1px solid #ddd",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        background: "#fafafa",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)", // 스크롤 시 분리 효과
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

      {/* 정렬 Select Box */}
      <select
        style={{
          ...alignmentSelectStyle,
          ...(currentAlignment !== "left" ? btnOn : {}),
        }}
        value={currentAlignment}
        onChange={handleAlignmentChange}
        title="텍스트 정렬 선택"
      >
        {ALIGNMENTS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

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

      {/* 폰트 크기 Select Box */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
      </div>

      {/* 글자 색상 선택 Select Box */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <select
          style={{
            ...colorSelectStyle,
            ...(currentTextColor !== "default" ? btnOn : {}),
            color:
              currentTextColor !== "default" ? currentTextColor : undefined,
            fontWeight: currentTextColor !== "default" ? "bold" : "normal",
          }}
          value={currentTextColor}
          onChange={(e) => setTextColor(e.target.value)}
          title="글자 색상 선택"
        >
          <option value="default" style={{ color: "#000000" }}>
            색상 선택
          </option>
          {COLORS.map((c) => (
            <option key={c.hex} value={c.hex} style={{ color: c.hex }}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

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

      {/* 코드블록 토글 버튼 */}
      <button
        style={{ ...btn, ...(isCodeBlock ? btnOn : {}) }}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="``` 입력 후 Enter로도 생성됨"
      >
        {isCodeBlock ? "코드블록 해제" : "코드블록"}
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

export default function MyEditorCompoV3() {
  const navigate = useNavigate();
  const editor = useEditor({
    extensions: [
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: "left",
      }),
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
        code: false,
      }),
      Dropcursor.configure({
        color: "#94a3b8",
        width: 2,
      }),
    ],
    content:
      `<p><strong>글자 크기 초기화 버튼</strong>이 제거되었습니다. 이제 선택된 크기로만 텍스트를 편집할 수 있습니다. <span style="font-size: 24px;">글자 크기 Select Box</span>는 여전히 정상 작동합니다.</p>` +
      `<p style="text-align: center">다른 기능들은 그대로 유지됩니다.</p>` +
      `<pre><code>// 코드블록은 그대로 사용할 수 있습니다.\nfunction example() {\n  return 'Hello World';\n}</code></pre>` +
      // 툴바 고정 테스트를 위한 긴 텍스트 추가
      `<p>이 부분은 테스트를 위한 긴 텍스트입니다. 스크롤을 내리면 툴바가 상단에 고정되어야 합니다. 긴 문서를 작성할 때 툴바가 사라지지 않도록 하기 위한 조치입니다.</p>`.repeat(
        15
      ),
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

  const handleSave = async () => {
    if (!editor) return;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const ENDPOINT_URL = import.meta.env.VITE_SERVER_API_TIPTAP_ENDPOINT;
    const reactListPage =
      import.meta.env.VITE_SERVER_REACT_AFTER_TIPTAP_ROUTE || "/";
    const fullUrl = `${API_BASE_URL}/${ENDPOINT_URL}`;
    const payload = {
      html: editor.getHTML(),
      json: editor.getJSON(),
    };

    console.log("--- Editor Content Saved ---");
    try {
      let res: any = await fetch(fullUrl, {
        method: "POST",
        headers: { Authorization: "", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      res = await res.json();
      if (!res?.success) {
        alert(`저장 실패. ${res?.message ?? ""}`);
        return;
      }

      navigate(reactListPage);
    } catch (error: any) {
      alert(`문서 저장 중 오류 발생. ${error?.message ?? ""}`);
      // 사용자에게 오류를 알리는 로직 추가
    }
    console.log("----------------------------");
  };

  return (
    <div style={{ maxWidth: 760, margin: "24px auto", padding: 16 }}>
      {/* ⭐️ 스크롤 가능한 메인 카드 컨테이너 ⭐️ */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          lineHeight: 1.6,
          // 스크롤 활성화
          maxHeight: "600px", // 최대 높이 설정
          overflowY: "auto", // 내용이 넘칠 때 스크롤 허용
          background: "#fff",
        }}
      >
        {/* 1. STICKY 툴바 (스크롤 컨테이너의 첫 번째 자식) */}
        <Toolbar editor={editor} />

        {/* 2. 내용 영역 (툴바 아래에 스크롤됨) */}
        <div
          style={{
            // 툴바가 꽉 차게 있으므로 좌우, 하단 패딩만 적용
            padding: "0 16px 16px 16px",
            minHeight: "400px", // 최소 높이 보장
            display: "flex",
            flexDirection: "column",
            gap: 12,
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
          `}</style>

          {/* 에디터 본문 (남는 높이 채움) */}
          <div style={{ flex: 1, padding: "16px 0 0 0" }}>
            {" "}
            {/* 툴바와의 간격을 위해 상단 패딩 추가 */}
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
    </div>
  );
}

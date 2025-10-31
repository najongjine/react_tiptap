import React, { useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Dropcursor from "@tiptap/extension-dropcursor";

// --- ⚙️ 스타일 정의 (최소한만 유지) ---
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

/** (이미지 처리 함수는 Tiptap 원리와 관련이 깊으므로 유지) */
async function uploadAndGetUrl(file: File): Promise<string> {
  // 실제 서버 업로드 로직은 제거하고, 임시 URL을 반환하도록 단순화
  // Tiptap이 이미지 노드를 삽입하는 원리를 이해하는 데 초점
  console.log(`[Demo] Uploading file: ${file.name}`);
  // 실제 환경에서는 Cloudinary REST API 코드를 사용해야 함.
  // 여기서는 콘솔 로그로 대체하고, 실제 이미지 URL이 필요하면 임의의 URL 반환
  // const url = await fetch_to_server_to_upload(file);
  return "https://picsum.photos/300/200"; // 테스트용 임시 이미지 URL
}

// --- 🛠️ Toolbar 컴포넌트: 기능의 핵심 (Bold, Image) ---
function Toolbar({ editor }: { editor: any }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!editor) return null;

  const openFileDialog = () => fileInputRef.current?.click();

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !editor) return;

    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      // 1. 이미지 파일을 서버에 업로드하고 URL을 받습니다. (비동기)
      const url = await uploadAndGetUrl(f);

      // 2. Tiptap 명령어 체인을 사용하여 에디터에 이미지 노드를 삽입합니다.
      // `editor.chain().focus().setImage({ src: url, alt: f.name }).run()`
      editor.chain().focus().setImage({ src: url, alt: f.name }).run();
    }
    e.target.value = ""; // 동일 파일 재선택을 위해 초기화
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        padding: 8,
        borderBottom: "1px solid #ddd",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        background: "#fafafa",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* 1. Bold 기능 (Mark 적용 원리) */}
      <button
        // isActive('bold')로 현재 텍스트/선택 영역에 Bold 마크가 적용되었는지 확인합니다.
        style={{ ...btn, ...(editor.isActive("bold") ? btnOn : {}) }}
        // toggleBold() 명령어로 Bold 마크를 켜거나 끕니다.
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        **Bold**
      </button>

      {/* 2. 이미지 삽입 기능 (Node 삽입 원리) */}
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

// --- 🚀 메인 에디터 컴포넌트: Tiptap 인스턴스 설정의 핵심 ---
export default function MyEditorCompo_study() {
  const editor = useEditor({
    extensions: [
      // StarterKit은 기본 마크(Bold, Italic 등)와 노드(Paragraph, BulletList 등)를 제공합니다.
      StarterKit.configure({
        // StarterKit에 포함된 불필요한 기능은 비활성화하여 코드를 간소화했습니다.
        blockquote: false,
        heading: false,
        code: false,
        // (Bold를 사용하려면 StarterKit에서 이를 제거하지 않아야 합니다.)
      }),
      // Image 확장 기능: <img> 노드를 삽입할 수 있게 합니다.
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          style: "max-width:100%;height:auto;display:block;margin:8px 0;",
        },
      }),
      // Dropcursor 확장 기능: 드래그 앤 드롭 시 위치를 시각적으로 표시
      Dropcursor.configure({
        color: "#94a3b8",
        width: 2,
      }),
    ],
    // 초기 내용 설정 (간소화)
    content: `<p>Tiptap 에디터의 **핵심 원리**를 배우기 위한 간소화된 버전입니다.</p>`,
    autofocus: true,
    editorProps: {
      attributes: {
        style: "min-height:240px;line-height:1.6;outline:none;padding:16px;", // 인라인 패딩 추가
      },
      // 붙여넣기와 드롭 핸들러는 이미지 기능의 핵심이므로 유지했습니다.
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

  return (
    <div style={{ maxWidth: 760, margin: "24px auto", padding: 16 }}>
      {/* ⭐️ 스크롤 가능한 메인 컨테이너 ⭐️ */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          lineHeight: 1.6,
          maxHeight: "600px",
          overflowY: "auto",
          background: "#fff",
        }}
      >
        {/* 1. STICKY 툴바 */}
        <Toolbar editor={editor} />

        {/* 2. 내용 영역 */}
        <div style={{ minHeight: "400px" }}>
          <EditorContent editor={editor} />
        </div>

        {/* 저장 버튼 등 기타 불필요한 UI 제거 */}
      </div>
    </div>
  );
}

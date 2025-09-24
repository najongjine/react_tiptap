// src/components/EmulatorJSPlayer.tsx
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  core?: string; // ex) 'mame0.243', 'nes', 'snes', ...
  gameUrl?: string; // 정적 ROM URL (public/ 또는 CDN)
  gameParentUrl?: string; // parent set zip (필요 시)
  lightgun?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

declare global {
  interface Window {
    EJS_player?: string;
    EJS_core?: string;
    EJS_gameUrl?: string;
    EJS_gameParentUrl?: string;
    EJS_lightgun?: boolean;
  }
}

export default function EmulatorJSPlayer({
  core = "mame0.243",
  gameUrl,
  gameParentUrl = "",
  lightgun = false,
  className,
  style,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const playerId = useMemo(
    () => `ejs-container-${Math.random().toString(36).slice(2)}`,
    []
  );
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // 업로드 파일 핸들러 (선택 사항)
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    const url = URL.createObjectURL(f);
    setBlobUrl(url); // 이 값이 바뀌면 useEffect가 새로 로드
  }

  // 실제로 loader.js를 불러와 실행
  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    // 이전 인스턴스 정리
    function cleanup() {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
      // emulatorjs가 만든 iframe 제거
      //@ts-ignore
      target.innerHTML = "";
      // 전역 변수 정리
      delete window.EJS_player;
      delete window.EJS_core;
      delete window.EJS_gameUrl;
      delete window.EJS_gameParentUrl;
      delete window.EJS_lightgun;
    }

    cleanup();

    // 1) 전역 변수 세팅 (loader.js가 이것들을 읽어서 부팅)
    window.EJS_player = `#${playerId}`;
    window.EJS_core = core;
    window.EJS_gameUrl = blobUrl || gameUrl || ""; // 업로드가 있으면 그걸 우선
    window.EJS_gameParentUrl = gameParentUrl || "";
    window.EJS_lightgun = !!lightgun;

    // 2) 스크립트 주입
    const s = document.createElement("script");
    s.src = "https://www.emulatorjs.com/loader.js";
    s.async = true;
    s.onload = () => {
      // 로드 완료 후 별도 콜백은 필요 없음 (자동 부팅)
      // 주의: 오디오는 사용자 상호작용 이후에 활성화될 수 있습니다.
    };
    s.onerror = () => {
      console.error("[EmulatorJS] loader.js 로드 실패");
    };
    document.body.appendChild(s);
    scriptRef.current = s;

    // 언마운트/변경 시 정리
    return () => {
      cleanup();
    };
    // core, gameUrl, blobUrl, gameParentUrl, lightgun이 바뀔 때마다 재로딩
  }, [core, gameUrl, gameParentUrl, lightgun, blobUrl, playerId]);

  return (
    <div className={className} style={style}>
      {/* 이 div 안에 emulatorjs가 iframe을 생성합니다 */}
      <div
        id={playerId}
        ref={containerRef}
        style={{
          width: "100%",
          aspectRatio: "16 / 9", // 4:3 화면비 (원하면 16/9로)
          background: "#000",
          position: "relative",
        }}
      />
      {/* 파일 업로드 UI (원하면 숨겨도 됨) */}
      <div
        style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}
      >
        <input
          type="file"
          accept=".zip,.nes,.sfc,.gba,.bin,.iso"
          onChange={handleFile}
        />
        <small>로컬 ROM 업로드(Blob URL). ※ 저작권 유의</small>
      </div>
    </div>
  );
}

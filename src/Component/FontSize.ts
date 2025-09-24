// FontSize.ts
import { Mark, mergeAttributes, type CommandProps } from "@tiptap/core";

// Editor.commands.setFontSize / unsetFontSize 타입 인식되게 모듈 보강
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      /** 선택 범위에 폰트 크기 마크 적용 */
      setFontSize: (size: string) => ReturnType;
      /** 선택 범위에서 폰트 크기 마크 제거 */
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Mark.create({
  name: "fontSize",

  // span[style*="font-size"] 를 마크로 파싱
  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (node) => {
          if (!(node instanceof HTMLElement)) return false;
          const size = node.style.fontSize;
          return size ? { size } : false;
        },
      },
    ];
  },

  // 마크가 DOM에 뿌려질 때
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  // 마크 속성 정의
  addAttributes() {
    return {
      size: {
        default: null as string | null,
        parseHTML: (el: HTMLElement) => el.style.fontSize || null,
        renderHTML: (attrs: { size?: string | null }) =>
          attrs.size ? { style: `font-size: ${attrs.size}` } : {},
      },
    };
  },

  // 명령 추가 (체이닝에서 타입 인식)
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ commands }: CommandProps) =>
          commands.setMark(this.name, { size }),
      unsetFontSize:
        () =>
        ({ commands }: CommandProps) =>
          commands.unsetMark(this.name),
    };
  },
});

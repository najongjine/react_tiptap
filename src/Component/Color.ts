import { Extension } from "@tiptap/core";
import "@tiptap/extension-text-style"; // Color가 작동하려면 TextStyle이 필요합니다.

/**
 * Tiptap Color Extension
 * CSS 'color' 속성을 설정하는 기능을 제공합니다.
 * @see https://tiptap.dev/api/extensions/color
 */
export const CustomColor = Extension.create({
  name: "customColor",

  // Color 기능을 활성화하기 위해 TextStyle Extension에 의존합니다.
  addExtensions() {
    return [
      // TextStyle 확장 프로그램은 'style' 속성을 추가하여 마크를 관리합니다.
      // Color는 이 'style' 속성을 사용하여 'color: #...' 값을 주입합니다.
      this.options.textStyle.configure({
        // Tiptap v2.x 에서는 'textStyle' 옵션을 통해 확장 로드를 제어합니다.
      }),
    ];
  },

  // Color 확장 프로그램 자체는 Tiptap 명령을 추가합니다.
  addCommands() {
    return {
      /**
       * 글자 색상을 설정합니다.
       * @param color 설정할 색상 값 (예: '#FF0000' 또는 'red')
       */
      setColor:
        (color: string) =>
        ({ commands }: any) => {
          return commands.updateMark("textStyle", { color });
        },

      /**
       * 글자 색상을 제거합니다 (기본값으로 돌아갑니다).
       */
      unsetColor:
        () =>
        ({ commands }: any) => {
          return commands.updateMark("textStyle", { color: null });
        },
    };
  },

  // HTML 필터링 등 기타 로직은 Tiptap의 @tiptap/extension-color가 내부적으로 처리합니다.
  // 이 파일은 확장 로드 방식을 정의합니다.
});

// TypeScript에서 Command Interface를 확장하여 사용 편의성을 높입니다.
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customColor: {
      /**
       * Set the text color
       */
      setColor: (color: string) => ReturnType;
      /**
       * Unset the text color
       */
      unsetColor: () => ReturnType;
    };
  }
}

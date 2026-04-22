// src/dom/pretext-para.ts
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';
import { h } from './h';

interface Options {
  text: string;
  maxWidth: number;       // 容器目标宽度 (px)
  /** CSS font shorthand 字符串, e.g. '17px/1.8 "Songti SC", serif' */
  font?: string;
  lineHeight?: number;    // 行高 (px)
  firstIndent?: boolean;  // 首行缩进两字
}

const DEFAULT_FONT =
  '17px/1.8 "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", "STSong", serif';

export function pretextPara(opts: Options): HTMLElement {
  const {
    text,
    maxWidth,
    font = DEFAULT_FONT,
    lineHeight = 30,
    firstIndent = true,
  } = opts;

  const prepared = prepareWithSegments(text, font);
  const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);

  return h('div', { className: 'pretext-para' },
    ...lines.map((line, idx) =>
      h('div', {
        className: 'pretext-line',
        style: firstIndent && idx === 0 ? { textIndent: '2em' } : {},
      }, line.text)
    )
  );
}

// src/routes/quiz.ts
import { h, mount } from '../dom/h';
import { QUESTIONS } from '../content/questions';
import type { Answer, Question } from '../engine/types';
import { encodePayload } from '../engine/encode';
import { navigate } from '../router';

const LIKERT: ReadonlyArray<{ label: string; value: Answer }> = [
  { label: '非常不同意', value: -2 },
  { label: '不同意',     value: -1 },
  { label: '中立',       value:  0 },
  { label: '同意',       value:  1 },
  { label: '非常同意',   value:  2 },
];

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function renderQuiz(): HTMLElement {
  const order: Question[] = shuffle(QUESTIONS);
  const answers = new Map<number, Answer>(); // key = question.id
  let cursor = 0; // 当前显示第几题 (0-indexed over shuffled order)

  const root = h('main', { className: 'page page-quiz' });

  const total = QUESTIONS.length;
  const ADVANCE_MS = 260;

  function submit(): void {
    const ordered: Answer[] = [];
    for (let i = 0; i < total; i++) ordered.push(answers.get(i)!);
    navigate({ kind: 'result', payload: encodePayload(ordered) });
  }

  function pick(q: Question, value: Answer): void {
    answers.set(q.id, value);
    // 让用户看到选中态 → 再推进
    render();
    setTimeout(() => {
      if (cursor < total - 1) {
        cursor += 1;
        render(true);
      } else {
        submit();
      }
    }, ADVANCE_MS);
  }

  function goPrev(): void {
    if (cursor > 0) {
      cursor -= 1;
      render(true);
    }
  }

  function render(enterFromRight = false): void {
    const q = order[cursor]!;
    const answered = answers.size;

    const card = h('div', {
      className: `qcard${enterFromRight ? ' qcard-enter' : ''}`,
      key: String(cursor),
    },
      h('div', { className: 'qcard-num' }, `第 ${cursor + 1} 问 / 共 ${total}`),
      h('div', { className: 'qcard-text' }, q.text),
      h('div', { className: 'likert' },
        ...LIKERT.map((lv) => {
          const selected = answers.get(q.id) === lv.value;
          return h('button', {
            className: `likert-btn${selected ? ' selected' : ''}`,
            onclick: () => pick(q, lv.value),
          }, lv.label);
        }),
      ),
      h('div', { className: 'qcard-controls' },
        cursor > 0
          ? h('button', { className: 'btn-text', onclick: goPrev }, '← 上一题')
          : h('span', { className: 'btn-text btn-text-ghost' }, ' '),
        h('span', { className: 'qcard-hint' }, '选择后自动进入下一题'),
      ),
    );

    const pageEl = h('div', {},
      h('div', { className: 'quiz-header' },
        h('div', { className: 'quiz-header-row' },
          h('div', { className: 'label' }, '干部人格评估 · 自述笔录'),
          h('div', { className: 'progress' }, `${answered} / ${total}`),
        ),
        h('div', { className: 'progress-bar' },
          h('div', {
            className: 'progress-fill',
            style: { width: `${(answered / total) * 100}%` },
          }),
        ),
      ),
      h('div', { className: 'qcard-stage' }, card),
    );
    mount(root, pageEl);
  }

  render();
  return root;
}

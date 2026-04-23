// src/routes/result.ts
import { h, mount } from '../dom/h';
import { decodePayload } from '../engine/encode';
import { computeScores } from '../engine/score';
import { classify } from '../engine/classify';
import { factionOf, FACTION_LABELS } from '../engine/faction';
import { nearestAndFarthest } from '../engine/similarity';
import { QUESTIONS } from '../content/questions';
import { CHARACTERS } from '../content/characters';
import { pretextPara } from '../dom/pretext-para';
import { downloadLongImage } from '../share/longimage';
import { ORG_FULL, REPO_HANDLE, REPO_URL } from '../content/copy';
import type { Answer, Character } from '../engine/types';

const PERSONA_FONT =
  '17px/1.8 "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", "STSong", serif';

export function renderResult(payloadWithMaybePrefix: string): HTMLElement {
  const payload = payloadWithMaybePrefix;
  let answers: Answer[];
  try {
    answers = decodePayload(payload);
  } catch (e) {
    console.warn('decodePayload failed:', e);
    return h('main', { className: 'page page-error' },
      h('p', {}, '档案已损坏或链接不完整。'),
      h('a', { href: '#/' }, '返回首页'),
    );
  }

  const scores = computeScores(answers, QUESTIONS);
  const { typeCode, character } = classify(scores);
  const faction = factionOf(character);
  const { nearest, farthest } = nearestAndFarthest(scores, character);

  const c = CHARACTERS[character];
  const near = CHARACTERS[nearest];
  const far = CHARACTERS[farthest];

  const root = h('main', { className: 'page page-result' });

  const header = h('div', { className: 'result-header' },
    h('div', { className: 'org' }, ORG_FULL),
    h('div', { className: 'archive-no' }, `档案编号 · ${typeCode}-${Date.now().toString(36).slice(-6).toUpperCase()}`),
  );

  const photo = h('div', { className: 'photo-frame' },
    h('img', { src: c.image, alt: c.name }),
    h('div', { className: 'photo-caption' }, c.name),
  );

  const infoTable = h('div', { className: 'info-table' },
    row('姓　名', c.name),
    row('职　务', c.role),
    row('类型码', typeCode),
    row('阵　营', FACTION_LABELS[faction]),
  );

  const quote = h('div', { className: 'quote' }, `"${c.quote}"`);

  const bars = h('div', { className: 'dim-bars' },
    dimBar('理想主义', '现实主义', scores.I),
    dimBar('规则坚守', '权变灵活', scores.L),
    dimBar('集体协作', '独断专行', scores.C),
    dimBar('锐意进取', '谨慎守成', scores.D),
  );

  // persona 用 pretext 精排；按源文的 \n\n 切分成段落，每段独立渲染
  const container = h('div', { className: 'persona-container' });
  document.fonts.ready.then(() => {
    const w = container.clientWidth || 640;
    const paragraphs = c.persona
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const wrapped = h('div', { className: 'persona-body' },
      ...paragraphs.map((text) =>
        pretextPara({ text, maxWidth: w, font: PERSONA_FONT, lineHeight: 30 })
      ),
    );
    mount(container, wrapped);
  });

  const neighbors = h('div', { className: 'neighbors' },
    neighborCard('最相近', near),
    neighborCard('最相远', far),
  );

  const actions = h('div', { className: 'actions' },
    h('button', {
      className: 'btn-primary',
      onclick: () => {
        void (async () => {
          try {
            await downloadLongImage({
              name: c.name,
              role: c.role,
              typeCode,
              quote: c.quote,
              scores,
              faction,
              image: c.image,
              resultUrl: location.href,
            });
          } catch (err) {
            console.error('downloadLongImage failed:', err);
            alert('生成长图失败，请稍后再试。');
          }
        })();
      },
    }, '生成分享长图'),
    h('button', { className: 'btn-secondary', onclick: () => { navigator.clipboard.writeText(location.href); } }, '复制链接'),
    h('a', { href: '#/', className: 'btn-secondary' }, '再测一次'),
  );

  const sourceCredit = h('a', {
    className: 'source-credit source-credit-result',
    href: REPO_URL,
    target: '_blank',
    rel: 'noopener noreferrer',
  },
    h('span', { className: 'source-tag' }, '档案开源'),
    h('span', { className: 'source-repo' }, REPO_HANDLE),
  );

  mount(root, h('div', {},
    header, photo, infoTable, quote, bars,
    h('h2', {}, '人格长文'),
    container,
    neighbors, actions, sourceCredit));
  return root;
}

function row(label: string, value: string): HTMLElement {
  return h('div', { className: 'archive-row' },
    h('div', { className: 'label' }, label),
    h('div', { className: 'value' }, value),
  );
}

function dimBar(leftLabel: string, rightLabel: string, score: number): HTMLElement {
  // score 范围 -16..+16：正分对应左标签（I/L/C/D），负分对应右标签（R/F/A/P）
  const pct = ((-score + 16) / 32) * 100;
  return h('div', { className: 'dim-bar' },
    h('span', { className: 'dim-left' }, leftLabel),
    h('div', { className: 'dim-track' },
      h('div', { className: 'dim-marker', style: { left: `${pct}%` } }),
    ),
    h('span', { className: 'dim-right' }, rightLabel),
  );
}

function neighborCard(title: string, c: Character): HTMLElement {
  return h('div', { className: 'neighbor-card' },
    h('div', { className: 'neighbor-title' }, title),
    h('img', { src: c.image, alt: c.name, className: 'neighbor-photo' }),
    h('div', { className: 'neighbor-name' }, c.name),
    h('div', { className: 'neighbor-role' }, c.role),
  );
}


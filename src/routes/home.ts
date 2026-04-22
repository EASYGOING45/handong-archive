// src/routes/home.ts
import { h } from '../dom/h';
import { COPY } from '../content/copy';

export function renderHome(): HTMLElement {
  const c = COPY.home;

  // 报头：机构名 · 表单名 + 绝密章
  const masthead = h('div', { className: 'masthead' },
    h('div', { className: 'mast-left' },
      h('div', { className: 'org' }, c.header),
      h('div', { className: 'form-title' }, c.subheader),
    ),
    h('div', { className: 'mast-right' },
      h('div', { className: 'stamp stamp-secret' }, '绝 · 密'),
    ),
  );

  // Hero：大标题 + 副标题 + 分隔
  const hero = h('div', { className: 'hero' },
    h('div', { className: 'hero-bracket hero-bracket-tl' }),
    h('div', { className: 'hero-bracket hero-bracket-tr' }),
    h('div', { className: 'hero-bracket hero-bracket-bl' }),
    h('div', { className: 'hero-bracket hero-bracket-br' }),
    h('h1', { className: 'cover-title' }, c.title),
    h('div', { className: 'cover-subtitle' }, c.subtitle),
    h('div', { className: 'rule-line' }),
    h('p', { className: 'intro' }, c.intro),
  );

  // 四维预览尺 — 图多字少
  const dims = h('div', { className: 'dim-preview' },
    ...c.dimensions.map((d) => h('div', { className: 'dim-row' },
      h('span', { className: 'dim-no' }, d.no),
      h('span', { className: 'dim-side dim-side-left' }, d.left),
      h('span', { className: 'dim-track-mini' },
        h('span', { className: 'dim-tick' }),
        h('span', { className: 'dim-tick' }),
        h('span', { className: 'dim-tick dim-tick-mid' }),
        h('span', { className: 'dim-tick' }),
        h('span', { className: 'dim-tick' }),
      ),
      h('span', { className: 'dim-side dim-side-right' }, d.right),
    )),
  );

  // CTA
  const ctaBlock = h('div', { className: 'cta-block' },
    h('a', { href: '#/q', className: 'btn-primary btn-primary-lg' }, c.cta),
    h('div', { className: 'cta-hint' }, c.ctaHint),
  );

  // 引语（小字）+ 签章
  const quoteBlock = h('div', { className: 'home-quote' },
    h('span', { className: 'quote-text' }, `「${c.quote}」`),
    h('span', { className: 'quote-attr' }, c.quoteAttr),
    h('span', { className: 'stamp stamp-reviewed' }, '已 · 阅'),
  );

  // 底注
  const footer = h('div', { className: 'home-footer' },
    h('div', { className: 'footnote' }, c.footnote),
  );

  return h('main', { className: 'page page-home' },
    masthead,
    hero,
    dims,
    ctaBlock,
    quoteBlock,
    footer,
  );
}

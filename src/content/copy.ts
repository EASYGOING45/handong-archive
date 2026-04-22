// src/content/copy.ts
// 用虚构省份机构规避真实组织风险，汉东省是《人民的名义》剧中虚构的省份
export const ORG_NAME = '汉东省人格档案室';
export const ORG_FULL = '汉东省人格档案室 · 干部作风评估处';

export const COPY = {
  home: {
    header: ORG_NAME,
    subheader: '干部人格评估表 · 二〇二六年修订',
    title: '干部人格档案',
    subtitle: '《人民的名义》人格测评',
    intro: '32 题 · 约 5 分钟 · 在 16 位剧中人物里，找到最像你的那一位。',
    cta: '开始评估',
    ctaHint: '匿名 · 无需登录 · 数据不离开浏览器',
    footnote: '第 ________ 号',
    dimensions: [
      { no: '一', left: '理想主义', right: '现实主义' },
      { no: '二', left: '规则坚守', right: '权变灵活' },
      { no: '三', left: '集体协作', right: '独断专行' },
      { no: '四', left: '锐意进取', right: '谨慎守成' },
    ],
    quote: '每个人心里，都有一份属于自己的卷宗。',
    quoteAttr: '—— 人格评估处',
  },
};

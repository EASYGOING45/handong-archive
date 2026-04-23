import type { Question } from '../engine/types';

export const QUESTIONS: readonly Question[] = [
  // --- I 维度 (理想主义 vs 现实主义) ---
  { id:  0, text: '哪怕仕途受挫，我也不会违背初心去妥协。', dim: 'I', polarity: true  },
  { id:  1, text: '讲原则是书生气，会混才是硬道理。', dim: 'I', polarity: false },
  { id:  2, text: '工作中，我更看重"把事做对"而不是"把事做成"。', dim: 'I', polarity: true  },
  { id:  3, text: '只要结果够好，中间过程可以灵活处理。', dim: 'I', polarity: false },
  { id:  4, text: '我愿意为一件正确的事承担不公平的代价。', dim: 'I', polarity: true  },
  { id:  5, text: '我会优先考虑自己与家人的现实利益。', dim: 'I', polarity: false },
  { id:  6, text: '理想主义者虽然吃亏，但值得尊敬。', dim: 'I', polarity: true  },
  { id:  7, text: '我见过太多栽在理想上的人，所以学会了给自己留退路。', dim: 'I', polarity: false },

  // --- L 维度 (规则坚守 vs 权变灵活) ---
  { id:  8, text: '我会严格按流程办事，哪怕麻烦。', dim: 'L', polarity: true  },
  { id:  9, text: '遇到死规矩，我第一反应是找绕过去的办法。', dim: 'L', polarity: false },
  { id: 10, text: '制度是底线，不能因人而异。', dim: 'L', polarity: true  },
  { id: 11, text: '关键时刻，人情与面子比条文更重要。', dim: 'L', polarity: false },
  { id: 12, text: '我不喜欢打擦边球，哪怕别人都在打。', dim: 'L', polarity: true  },
  { id: 13, text: '规则是兜底的，真正办事的人知道什么时候绕开。', dim: 'L', polarity: false },
  { id: 14, text: '即使上级暗示可以灵活，我也会按程序走。', dim: 'L', polarity: true  },
  { id: 15, text: '会变通的人比会死读书的人更容易被重用。', dim: 'L', polarity: false },

  // --- C 维度 (集体协作 vs 独断专行) ---
  { id: 16, text: '重要决定我会充分听取团队意见。', dim: 'C', polarity: true  },
  { id: 17, text: '大多数人都看不懂大局，所以我更相信自己的判断。', dim: 'C', polarity: false },
  { id: 18, text: '有成绩时，我倾向于把功劳归给集体。', dim: 'C', polarity: true  },
  { id: 19, text: '责任到人，没有分歧的班子才是好班子。', dim: 'C', polarity: false },
  { id: 20, text: '我享受和同事一起磨合出方案的过程。', dim: 'C', polarity: true  },
  { id: 21, text: '一个能拍板的人顶十个参谋。', dim: 'C', polarity: false },
  { id: 22, text: '如果团队不同意，我宁愿暂缓也不强推。', dim: 'C', polarity: true  },
  { id: 23, text: '在我的地盘，我说了算。', dim: 'C', polarity: false },

  // --- D 维度 (锐意进取 vs 谨慎守成) ---
  { id: 24, text: '与其稳稳不出错，不如冒险把事情做大。', dim: 'D', polarity: true  },
  { id: 25, text: '太激进的动作往往带来不可控的后果。', dim: 'D', polarity: false },
  { id: 26, text: '我愿意主动请缨去啃硬骨头。', dim: 'D', polarity: true  },
  { id: 27, text: '在位不冒进是一种政治智慧。', dim: 'D', polarity: false },
  { id: 28, text: '新机会出现时，我会第一时间扑上去。', dim: 'D', polarity: true  },
  { id: 29, text: '能不改的就不改，大盘稳住比什么都强。', dim: 'D', polarity: false },
  { id: 30, text: '就算风险大，我也会推动变革。', dim: 'D', polarity: true  },
  { id: 31, text: '坐稳了位置，不出事比再往上一步重要。', dim: 'D', polarity: false },
];

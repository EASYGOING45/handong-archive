# 《人民的名义》人格测评网站 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个纯静态的《人民的名义》MBTI 式人格测评单页应用，32 题 → 4 维分数 → 匹配 16 人中的一位，支持长图 + 二维码分享。

**Architecture:** 纯静态 SPA，无后端。客户端计算所有结果，通过 URL hash 编码答案使分享链接可复活同一结果。engine 层为纯函数，完全可单测；DOM 层极简无框架；文字使用 `@chenglou/pretext` 精排。

**Tech Stack:** Bun (runtime + package manager + test runner), TypeScript (strict), Vite (静态打包), `@chenglou/pretext` (文字排版), `qrcode-generator` (二维码), oxlint, Cloudflare Pages (部署)。

**参考文档:** 设计文档 `docs/superpowers/specs/2026-04-20-renminzhiming-mbti-design.md` (commit `4b331b4`)。所有设计决策（四维含义、16 型映射、阵营查表、低强度特判、URL 编码方案）都在那里。

---

## 文件结构与职责

所有代码在仓库根目录 `/Users/ctenetliu/TENET/` 下（与 `docs/` 同级）。结构如下：

```
./ (repo root)
├─ package.json                   项目元数据 + 脚本
├─ tsconfig.json                  TS 严格模式
├─ bunfig.toml                    Bun 配置
├─ oxlint.json                    lint 规则
├─ vite.config.ts                 静态打包
├─ wrangler.toml                  Cloudflare Pages 部署
├─ .gitignore
├─ index.html                     单一 HTML 入口
├─ public/
│  ├─ fonts/                      字体子集
│  ├─ characters/                 16 张剧照 (webp, ~300KB 总)
│  ├─ stamps/                     印章 SVG
│  └─ paper-noise.png             纸张纹理
├─ src/
│  ├─ main.ts                     入口: 挂载路由
│  ├─ router.ts                   极简 hash 路由
│  ├─ routes/
│  │  ├─ home.ts                  首页: 档案封面
│  │  ├─ quiz.ts                  答题页: 32 题
│  │  └─ result.ts                结果页: 档案正文
│  ├─ dom/
│  │  ├─ h.ts                     createElement helper
│  │  └─ pretext-para.ts          pretext 包装器 (HTML 段落)
│  ├─ engine/
│  │  ├─ types.ts                 Dim, Answer, Scores, TypeCode, CharacterKey, Faction
│  │  ├─ score.ts                 answers → Scores (反向题处理)
│  │  ├─ classify.ts              Scores → TypeCode + CharacterKey (含低强度特判)
│  │  ├─ faction.ts               CharacterKey → Faction (查表)
│  │  ├─ similarity.ts            Scores → 最相近/最相远 CharacterKey
│  │  └─ encode.ts                Answer[32] ↔ base32 URL payload
│  ├─ content/
│  │  ├─ questions.ts             32 题题库 (dim + polarity)
│  │  ├─ characters.ts            16 人档案数据 (名字/职务/照片/金句/persona)
│  │  └─ copy.ts                  首页 + UI 文案
│  ├─ share/
│  │  ├─ longimage.ts             canvas 绘制 1080×1920 长图
│  │  └─ qr.ts                    纯 TS 二维码
│  └─ style.css                   档案卷宗风全局样式
└─ tests/
   ├─ score.test.ts
   ├─ classify.test.ts
   ├─ faction.test.ts
   ├─ similarity.test.ts
   └─ encode.test.ts
```

**不要在这个计划里做的**（明确排除）：
- 后端 / D1 / Workers / KV
- 用户系统 / 统计 / 排行榜
- 多语言 / i18n
- 深色主题
- 小程序 / App

---

# M1 · 骨架与引擎（纯函数 + 单测全绿）

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `bunfig.toml`
- Create: `oxlint.json`
- Create: `vite.config.ts`
- Create: `.gitignore`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/style.css`

- [ ] **Step 1: 建目录结构**

```bash
mkdir -p src/{routes,dom,engine,content,share} tests public/{fonts,characters,stamps}
```

- [ ] **Step 2: 写 `package.json`**

```json
{
  "name": "renminzhiming",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "bun test",
    "lint": "oxlint src tests",
    "deploy": "wrangler pages deploy dist"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "oxlint": "^0.9.0",
    "@types/bun": "latest"
  },
  "dependencies": {
    "@chenglou/pretext": "^0.1.0",
    "qrcode-generator": "^1.4.4"
  }
}
```

- [ ] **Step 3: 写 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["bun"]
  },
  "include": ["src/**/*", "tests/**/*", "vite.config.ts"]
}
```

- [ ] **Step 4: 写 `oxlint.json`**

```json
{
  "categories": { "correctness": "error", "suspicious": "warn" }
}
```

- [ ] **Step 5: 写 `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
export default defineConfig({
  build: { target: 'es2022', outDir: 'dist', sourcemap: true },
});
```

- [ ] **Step 6: 写 `.gitignore`**

```
node_modules
dist
.DS_Store
.wrangler
*.log
```

- [ ] **Step 7: 写 `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>干部人格档案 · 人民的名义测评</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 8: 写最小 `src/main.ts`（挂载占位）**

```ts
const app = document.getElementById('app');
if (app) app.textContent = '骨架就绪';
```

- [ ] **Step 9: 写最小 `src/style.css`**

```css
:root { color-scheme: light; }
html, body { margin: 0; font-family: system-ui, sans-serif; background: #f4ece0; }
#app { min-height: 100vh; }
```

- [ ] **Step 10: 装依赖、跑一次**

```bash
bun install
bun run dev
```

Expected: Vite 启动，`http://localhost:5173` 显示"骨架就绪"，无控制台报错。

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "chore: scaffold project (bun + vite + ts + oxlint)"
```

---

## Task 2: engine/types.ts — 核心类型

**Files:**
- Create: `src/engine/types.ts`

- [ ] **Step 1: 写类型定义**

```ts
// src/engine/types.ts

/** 4 个维度的简写 */
export type DimKey = 'I' | 'L' | 'C' | 'D';

/** 李克特原始回答: -2 ~ +2, 0 = 中立 */
export type Answer = -2 | -1 | 0 | 1 | 2;

/** 32 题完整作答, index 是题库中的原始顺序 */
export type Answers = readonly Answer[];

/** 每维度聚合分, 范围 [-16, +16] */
export interface Scores {
  readonly I: number;
  readonly L: number;
  readonly C: number;
  readonly D: number;
}

/** 4 位类型码, 例如 'RFAD' */
export type TypeCode = string;

/** 16 角色 key */
export type CharacterKey =
  | 'hou_liangping' | 'chen_yanshi' | 'chen_hai' | 'yi_xuexi'
  | 'sha_ruijin' | 'zhong_xiaoai' | 'ji_changming' | 'zheng_xipo'
  | 'tian_guofu' | 'sun_liancheng' | 'li_dakang' | 'ouyang_jing'
  | 'cai_chenggong' | 'gao_xiaoqin' | 'qi_tongwei' | 'gao_yuliang';

/** 阵营 */
export type Faction = 'sha_li' | 'handong_bang' | 'capital' | 'neutral';

/** 单题元数据 */
export interface Question {
  readonly id: number;          // 0..31, 稳定 index
  readonly text: string;
  readonly dim: DimKey;
  /** true = 正向题, false = 反向题 (回答取反再累加) */
  readonly polarity: boolean;
}

/** 角色档案 */
export interface Character {
  readonly key: CharacterKey;
  readonly name: string;
  readonly role: string;
  readonly typeCode: TypeCode;
  readonly quote: string;
  readonly persona: string;      // 1000-1500 字
  readonly image: string;        // /characters/xxx.webp
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/types.ts
git commit -m "feat(engine): define core types"
```

---

## Task 3: engine/score.ts — 作答聚合成维度分

**Files:**
- Create: `src/engine/score.ts`
- Create: `tests/score.test.ts`
- Reference: `src/content/questions.ts` (还不存在, 这里临时用 fixture)

- [ ] **Step 1: 写失败测试 `tests/score.test.ts`**

```ts
import { describe, expect, test } from 'bun:test';
import { computeScores } from '../src/engine/score';
import type { Answer, Question } from '../src/engine/types';

// fixture: 8 题覆盖所有 4 维, 含反向
const fixture: readonly Question[] = [
  { id: 0, text: 'q0', dim: 'I', polarity: true },
  { id: 1, text: 'q1', dim: 'I', polarity: false },
  { id: 2, text: 'q2', dim: 'L', polarity: true },
  { id: 3, text: 'q3', dim: 'L', polarity: false },
  { id: 4, text: 'q4', dim: 'C', polarity: true },
  { id: 5, text: 'q5', dim: 'C', polarity: false },
  { id: 6, text: 'q6', dim: 'D', polarity: true },
  { id: 7, text: 'q7', dim: 'D', polarity: false },
];

describe('computeScores', () => {
  test('all-zero answers → all dims 0', () => {
    const a: Answer[] = [0, 0, 0, 0, 0, 0, 0, 0];
    expect(computeScores(a, fixture)).toEqual({ I: 0, L: 0, C: 0, D: 0 });
  });

  test('reverse question flips sign', () => {
    // q1 is reverse on dim I: +2 answer means -2 contribution
    const a: Answer[] = [0, 2, 0, 0, 0, 0, 0, 0];
    expect(computeScores(a, fixture)).toEqual({ I: -2, L: 0, C: 0, D: 0 });
  });

  test('positive and reverse sum correctly', () => {
    // q0 +2 (pos, dim I) → +2; q1 -1 (rev, dim I) → +1; total I = +3
    const a: Answer[] = [2, -1, 0, 0, 0, 0, 0, 0];
    expect(computeScores(a, fixture).I).toBe(3);
  });

  test('rejects answers length mismatch', () => {
    expect(() => computeScores([0, 0], fixture)).toThrow();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
bun test tests/score.test.ts
```

Expected: FAIL (`computeScores` 未定义)

- [ ] **Step 3: 实现 `src/engine/score.ts`**

```ts
// src/engine/score.ts
import type { Answer, Question, Scores, DimKey } from './types';

export function computeScores(
  answers: readonly Answer[],
  questions: readonly Question[],
): Scores {
  if (answers.length !== questions.length) {
    throw new Error(
      `answers length ${answers.length} !== questions length ${questions.length}`,
    );
  }
  const acc: Record<DimKey, number> = { I: 0, L: 0, C: 0, D: 0 };
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;
    const a = answers[i]!;
    const signed = q.polarity ? a : -a;
    acc[q.dim] += signed;
  }
  return { I: acc.I, L: acc.L, C: acc.C, D: acc.D };
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
bun test tests/score.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/engine/score.ts tests/score.test.ts
git commit -m "feat(engine): computeScores with reverse-polarity handling"
```

---

## Task 4: engine/classify.ts — 类型码与角色匹配

**Files:**
- Create: `src/engine/classify.ts`
- Create: `tests/classify.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, test } from 'bun:test';
import { classify } from '../src/engine/classify';
import type { Scores } from '../src/engine/types';

const s = (I: number, L: number, C: number, D: number): Scores => ({ I, L, C, D });

describe('classify', () => {
  test('all strongly positive → ILCD 侯亮平', () => {
    const r = classify(s(10, 10, 10, 10));
    expect(r.typeCode).toBe('ILCD');
    expect(r.character).toBe('hou_liangping');
  });

  test('all strongly negative → RFAP 高育良', () => {
    const r = classify(s(-10, -10, -10, -10));
    expect(r.typeCode).toBe('RFAP');
    expect(r.character).toBe('gao_yuliang');
  });

  test('RFAD → 祁同伟', () => {
    const r = classify(s(-10, -10, -10, 10));
    expect(r.typeCode).toBe('RFAD');
    expect(r.character).toBe('qi_tongwei');
  });

  test('RLAD → 李达康', () => {
    const r = classify(s(-10, 10, -10, 10));
    expect(r.typeCode).toBe('RLAD');
    expect(r.character).toBe('li_dakang');
  });

  test('dim = 0 maps to positive letter (I/L/C/D)', () => {
    const r = classify(s(0, 0, 0, 0));
    // 0 everywhere trips the low-intensity special case → 孙连城
    expect(r.character).toBe('sun_liancheng');
  });

  test('low-intensity special case: all |x| ≤ 2 → 孙连城 RLCP', () => {
    expect(classify(s(2, -2, 1, 0)).character).toBe('sun_liancheng');
    expect(classify(s(-2, 2, -1, 0)).character).toBe('sun_liancheng');
  });

  test('just outside threshold (any |x| = 3) → normal mapping', () => {
    const r = classify(s(3, 3, 3, 3));
    expect(r.character).toBe('hou_liangping');
    expect(r.typeCode).toBe('ILCD');
  });

  test('dim boundary: one dim at 0, others strong', () => {
    // I=0 → 'I' (≥0 positive letter), strong on others → ILCD but only if ≥3 triggers non-special
    const r = classify(s(0, 10, 10, 10));
    expect(r.typeCode).toBe('ILCD');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
bun test tests/classify.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现 `src/engine/classify.ts`**

```ts
// src/engine/classify.ts
import type { Scores, TypeCode, CharacterKey } from './types';

const LOW_INTENSITY_THRESHOLD = 2;

/** 16 型 → 角色 key 映射 (见 spec 2.2) */
const TYPE_TO_CHARACTER: Record<string, CharacterKey> = {
  ILCD: 'hou_liangping',
  ILCP: 'chen_yanshi',
  ILAD: 'chen_hai',
  ILAP: 'yi_xuexi',
  IFCD: 'sha_ruijin',
  IFCP: 'zhong_xiaoai',
  IFAD: 'ji_changming',
  IFAP: 'zheng_xipo',
  RLCD: 'tian_guofu',
  RLCP: 'sun_liancheng',
  RLAD: 'li_dakang',
  RLAP: 'ouyang_jing',
  RFCD: 'cai_chenggong',
  RFCP: 'gao_xiaoqin',
  RFAD: 'qi_tongwei',
  RFAP: 'gao_yuliang',
};

export interface Classification {
  readonly typeCode: TypeCode;
  readonly character: CharacterKey;
}

export function classify(scores: Scores): Classification {
  const absMax = Math.max(
    Math.abs(scores.I),
    Math.abs(scores.L),
    Math.abs(scores.C),
    Math.abs(scores.D),
  );
  if (absMax <= LOW_INTENSITY_THRESHOLD) {
    return { typeCode: 'RLCP', character: 'sun_liancheng' };
  }
  const code =
    (scores.I >= 0 ? 'I' : 'R') +
    (scores.L >= 0 ? 'L' : 'F') +
    (scores.C >= 0 ? 'C' : 'A') +
    (scores.D >= 0 ? 'D' : 'P');
  const character = TYPE_TO_CHARACTER[code];
  if (!character) {
    // Exhaustive by construction; guard for safety
    throw new Error(`unmapped type code: ${code}`);
  }
  return { typeCode: code, character };
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
bun test tests/classify.test.ts
```

Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/engine/classify.ts tests/classify.test.ts
git commit -m "feat(engine): classify scores into 16 types with low-intensity special case"
```

---

## Task 5: engine/faction.ts — 阵营查表

**Files:**
- Create: `src/engine/faction.ts`
- Create: `tests/faction.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, test } from 'bun:test';
import { factionOf } from '../src/engine/faction';

describe('factionOf', () => {
  test('改革派映射到 sha_li', () => {
    expect(factionOf('hou_liangping')).toBe('sha_li');
    expect(factionOf('sha_ruijin')).toBe('sha_li');
    expect(factionOf('li_dakang')).toBe('sha_li');
  });

  test('政法旧圈 → handong_bang', () => {
    expect(factionOf('gao_yuliang')).toBe('handong_bang');
    expect(factionOf('qi_tongwei')).toBe('handong_bang');
  });

  test('资本商圈 → capital', () => {
    expect(factionOf('gao_xiaoqin')).toBe('capital');
    expect(factionOf('cai_chenggong')).toBe('capital');
    expect(factionOf('ouyang_jing')).toBe('capital');
  });

  test('佛系中立 → neutral', () => {
    expect(factionOf('sun_liancheng')).toBe('neutral');
  });

  test('16 角色全部覆盖', () => {
    const keys = [
      'hou_liangping','chen_yanshi','chen_hai','yi_xuexi',
      'sha_ruijin','zhong_xiaoai','ji_changming','zheng_xipo',
      'tian_guofu','sun_liancheng','li_dakang','ouyang_jing',
      'cai_chenggong','gao_xiaoqin','qi_tongwei','gao_yuliang',
    ] as const;
    for (const k of keys) {
      expect(typeof factionOf(k)).toBe('string');
    }
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
bun test tests/faction.test.ts
```

- [ ] **Step 3: 实现 `src/engine/faction.ts`**

```ts
// src/engine/faction.ts
import type { CharacterKey, Faction } from './types';

const MAP: Record<CharacterKey, Faction> = {
  hou_liangping: 'sha_li',
  chen_yanshi:   'sha_li',
  chen_hai:      'sha_li',
  yi_xuexi:      'sha_li',
  sha_ruijin:    'sha_li',
  zhong_xiaoai:  'sha_li',
  ji_changming:  'sha_li',
  zheng_xipo:    'sha_li',
  tian_guofu:    'sha_li',
  li_dakang:     'sha_li',

  gao_yuliang:   'handong_bang',
  qi_tongwei:    'handong_bang',

  gao_xiaoqin:   'capital',
  cai_chenggong: 'capital',
  ouyang_jing:   'capital',

  sun_liancheng: 'neutral',
};

export function factionOf(character: CharacterKey): Faction {
  return MAP[character];
}

export const FACTION_LABELS: Record<Faction, string> = {
  sha_li: '沙李派 · 改革阵营',
  handong_bang: '汉东帮 · 政法旧圈',
  capital: '资本商圈',
  neutral: '佛系中立',
};
```

- [ ] **Step 4: 跑测试确认通过**

- [ ] **Step 5: Commit**

```bash
git add src/engine/faction.ts tests/faction.test.ts
git commit -m "feat(engine): faction lookup table"
```

---

## Task 6: engine/similarity.ts — 最相近/最相远角色

**Files:**
- Create: `src/engine/similarity.ts`
- Create: `tests/similarity.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, test } from 'bun:test';
import { nearestAndFarthest } from '../src/engine/similarity';
import type { Scores } from '../src/engine/types';

const s = (I: number, L: number, C: number, D: number): Scores => ({ I, L, C, D });

describe('nearestAndFarthest', () => {
  test('完全 ILCD 的分数: 最近 = 侯亮平, 最远 = 高育良', () => {
    const r = nearestAndFarthest(s(16, 16, 16, 16), 'hou_liangping');
    expect(r.nearest).not.toBe('hou_liangping'); // 排除自己
    expect(r.farthest).toBe('gao_yuliang');
  });

  test('排除自己这一型', () => {
    const r = nearestAndFarthest(s(16, 16, 16, 16), 'hou_liangping');
    expect(r.nearest).not.toBe('hou_liangping');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

- [ ] **Step 3: 实现 `src/engine/similarity.ts`**

```ts
// src/engine/similarity.ts
import type { Scores, CharacterKey } from './types';

/** 每型在理想空间的代表分 (每维 ±16) */
const ARCHETYPE: Record<CharacterKey, Scores> = {
  hou_liangping: { I:  16, L:  16, C:  16, D:  16 },
  chen_yanshi:   { I:  16, L:  16, C:  16, D: -16 },
  chen_hai:      { I:  16, L:  16, C: -16, D:  16 },
  yi_xuexi:      { I:  16, L:  16, C: -16, D: -16 },
  sha_ruijin:    { I:  16, L: -16, C:  16, D:  16 },
  zhong_xiaoai:  { I:  16, L: -16, C:  16, D: -16 },
  ji_changming:  { I:  16, L: -16, C: -16, D:  16 },
  zheng_xipo:    { I:  16, L: -16, C: -16, D: -16 },
  tian_guofu:    { I: -16, L:  16, C:  16, D:  16 },
  sun_liancheng: { I: -16, L:  16, C:  16, D: -16 },
  li_dakang:     { I: -16, L:  16, C: -16, D:  16 },
  ouyang_jing:   { I: -16, L:  16, C: -16, D: -16 },
  cai_chenggong: { I: -16, L: -16, C:  16, D:  16 },
  gao_xiaoqin:   { I: -16, L: -16, C:  16, D: -16 },
  qi_tongwei:    { I: -16, L: -16, C: -16, D:  16 },
  gao_yuliang:   { I: -16, L: -16, C: -16, D: -16 },
};

export interface Neighbors {
  readonly nearest: CharacterKey;
  readonly farthest: CharacterKey;
}

function distance(a: Scores, b: Scores): number {
  const dI = a.I - b.I, dL = a.L - b.L, dC = a.C - b.C, dD = a.D - b.D;
  return dI * dI + dL * dL + dC * dC + dD * dD;
}

export function nearestAndFarthest(
  scores: Scores,
  exclude: CharacterKey,
): Neighbors {
  let nearestKey: CharacterKey | null = null;
  let farthestKey: CharacterKey | null = null;
  let minD = Number.POSITIVE_INFINITY;
  let maxD = Number.NEGATIVE_INFINITY;
  for (const key of Object.keys(ARCHETYPE) as CharacterKey[]) {
    if (key === exclude) continue;
    const d = distance(scores, ARCHETYPE[key]);
    if (d < minD) { minD = d; nearestKey = key; }
    if (d > maxD) { maxD = d; farthestKey = key; }
  }
  if (!nearestKey || !farthestKey) {
    throw new Error('similarity: no candidates');
  }
  return { nearest: nearestKey, farthest: farthestKey };
}
```

- [ ] **Step 4: 跑测试确认通过**

- [ ] **Step 5: Commit**

```bash
git add src/engine/similarity.ts tests/similarity.test.ts
git commit -m "feat(engine): nearest and farthest character by euclidean distance"
```

---

## Task 7: engine/encode.ts — URL hash 编解码

**Files:**
- Create: `src/engine/encode.ts`
- Create: `tests/encode.test.ts`

**背景:** 32 题 × 3 bit = 96 bit = 12 字节。base32hex 编码为 20 字符。Hash 格式 `v1.<20 字符>`，便于将来升级。

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, test } from 'bun:test';
import { encodePayload, decodePayload } from '../src/engine/encode';
import type { Answer } from '../src/engine/types';

function makeAnswers(val: Answer): Answer[] {
  return Array(32).fill(val);
}

describe('encode/decode', () => {
  test('roundtrip all zeros', () => {
    const a = makeAnswers(0);
    const out = decodePayload(encodePayload(a));
    expect(out).toEqual(a);
  });

  test('roundtrip all +2', () => {
    const a = makeAnswers(2);
    expect(decodePayload(encodePayload(a))).toEqual(a);
  });

  test('roundtrip all -2', () => {
    const a = makeAnswers(-2);
    expect(decodePayload(encodePayload(a))).toEqual(a);
  });

  test('roundtrip mixed', () => {
    const a: Answer[] = [];
    for (let i = 0; i < 32; i++) a.push((i % 5) - 2 as Answer);
    expect(decodePayload(encodePayload(a))).toEqual(a);
  });

  test('encoded format has v1. prefix', () => {
    const e = encodePayload(makeAnswers(0));
    expect(e.startsWith('v1.')).toBe(true);
  });

  test('rejects bad version', () => {
    expect(() => decodePayload('v2.AAAAAAAAAAAAAAAAAAAA')).toThrow();
  });

  test('rejects wrong length', () => {
    expect(() => decodePayload('v1.ABC')).toThrow();
  });

  test('rejects answers length !== 32', () => {
    expect(() => encodePayload([0, 0, 0])).toThrow();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

- [ ] **Step 3: 实现 `src/engine/encode.ts`**

```ts
// src/engine/encode.ts
import type { Answer } from './types';

const VERSION = 'v1';
const N = 32;
const BITS_PER_ANSWER = 3;
const TOTAL_BITS = N * BITS_PER_ANSWER; // 96
const TOTAL_BYTES = TOTAL_BITS / 8;     // 12
// base32hex alphabet (RFC 4648, extended hex): 0-9 A-V
const ALPHA = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
const ALPHA_LOOKUP: Record<string, number> = Object.fromEntries(
  [...ALPHA].map((ch, i) => [ch, i]),
);

function toUnsigned(a: Answer): number {
  return a + 2; // -2..+2 → 0..4
}
function toSigned(u: number): Answer {
  return (u - 2) as Answer;
}

export function encodePayload(answers: readonly Answer[]): string {
  if (answers.length !== N) {
    throw new Error(`encodePayload: expected ${N} answers, got ${answers.length}`);
  }
  // Pack into bytes
  const bytes = new Uint8Array(TOTAL_BYTES);
  let bitCursor = 0;
  for (const a of answers) {
    const u = toUnsigned(a);
    if (u < 0 || u > 4) throw new Error(`encodePayload: invalid answer ${a}`);
    for (let b = BITS_PER_ANSWER - 1; b >= 0; b--) {
      const bit = (u >> b) & 1;
      const byteIdx = Math.floor(bitCursor / 8);
      const bitIdx = 7 - (bitCursor % 8);
      if (bit) bytes[byteIdx]! |= 1 << bitIdx;
      bitCursor++;
    }
  }
  // bytes → base32hex (20 chars for 12 bytes)
  let bits = 0, value = 0, out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += ALPHA[(value >> bits) & 31];
    }
  }
  if (bits > 0) out += ALPHA[(value << (5 - bits)) & 31];
  return `${VERSION}.${out}`;
}

export function decodePayload(payload: string): Answer[] {
  const [version, body] = payload.split('.', 2);
  if (version !== VERSION) {
    throw new Error(`decodePayload: unsupported version ${version}`);
  }
  if (!body || body.length !== 20) {
    throw new Error(`decodePayload: body length must be 20, got ${body?.length}`);
  }
  // base32hex → bytes
  const bytes = new Uint8Array(TOTAL_BYTES);
  let bits = 0, value = 0, byteIdx = 0;
  for (const ch of body) {
    const v = ALPHA_LOOKUP[ch];
    if (v === undefined) throw new Error(`decodePayload: invalid char ${ch}`);
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes[byteIdx++] = (value >> bits) & 0xff;
    }
  }
  // bytes → answers
  const answers: Answer[] = [];
  let bitCursor = 0;
  for (let i = 0; i < N; i++) {
    let u = 0;
    for (let b = 0; b < BITS_PER_ANSWER; b++) {
      const byteIdx2 = Math.floor(bitCursor / 8);
      const bitIdx = 7 - (bitCursor % 8);
      const bit = (bytes[byteIdx2]! >> bitIdx) & 1;
      u = (u << 1) | bit;
      bitCursor++;
    }
    if (u > 4) {
      throw new Error(`decodePayload: invalid packed value ${u} at position ${i}`);
    }
    answers.push(toSigned(u));
  }
  return answers;
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
bun test tests/encode.test.ts
```

Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/engine/encode.ts tests/encode.test.ts
git commit -m "feat(engine): url hash encode/decode with v1 versioning"
```

---

## Task 8: router.ts + dom/h.ts + 骨架页面

**Files:**
- Create: `src/router.ts`
- Create: `src/dom/h.ts`
- Create: `src/routes/home.ts`
- Create: `src/routes/quiz.ts`
- Create: `src/routes/result.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: 写 `src/dom/h.ts`**

```ts
// src/dom/h.ts
export type Child = Node | string | number | null | undefined | false;
export type Props = Record<string, unknown>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'className') el.className = String(v);
    else if (k === 'style' && typeof v === 'object' && v !== null) {
      Object.assign(el.style, v);
    } else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (v !== null && v !== undefined && v !== false) {
      el.setAttribute(k, String(v));
    }
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number'
      ? document.createTextNode(String(c))
      : c);
  }
  return el;
}

export function mount(root: HTMLElement, node: Node): void {
  root.replaceChildren(node);
}
```

- [ ] **Step 2: 写 `src/router.ts`**

```ts
// src/router.ts
export type Route =
  | { kind: 'home' }
  | { kind: 'quiz' }
  | { kind: 'result'; payload: string }
  | { kind: 'notfound' };

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  if (h === '' || h === '/') return { kind: 'home' };
  if (h === 'q' || h === 'quiz') return { kind: 'quiz' };
  if (h.startsWith('r/')) return { kind: 'result', payload: h.slice(2) };
  return { kind: 'notfound' };
}

export function navigate(to: Route): void {
  switch (to.kind) {
    case 'home': location.hash = '#/'; break;
    case 'quiz': location.hash = '#/q'; break;
    case 'result': location.hash = `#/r/${to.payload}`; break;
    case 'notfound': location.hash = '#/'; break;
  }
}

export function onRouteChange(cb: (r: Route) => void): void {
  const handler = () => cb(parseHash(location.hash));
  window.addEventListener('hashchange', handler);
  handler();
}
```

- [ ] **Step 3: 写占位路由页面 `src/routes/home.ts`, `quiz.ts`, `result.ts`**

```ts
// src/routes/home.ts
import { h } from '../dom/h';
export function renderHome(): HTMLElement {
  return h('main', { className: 'page page-home' },
    h('h1', {}, '干部人格档案'),
    h('p', {}, '《人民的名义》MBTI 测评'),
    h('a', { href: '#/q', className: 'btn-primary' }, '开始测评'),
  );
}
```

```ts
// src/routes/quiz.ts
import { h } from '../dom/h';
export function renderQuiz(): HTMLElement {
  return h('main', { className: 'page page-quiz' },
    h('p', {}, '答题页 (待实现)'),
  );
}
```

```ts
// src/routes/result.ts
import { h } from '../dom/h';
export function renderResult(payload: string): HTMLElement {
  return h('main', { className: 'page page-result' },
    h('p', {}, `结果页 (待实现) payload=${payload}`),
  );
}
```

- [ ] **Step 4: 改写 `src/main.ts` 挂载路由**

```ts
// src/main.ts
import { onRouteChange } from './router';
import { renderHome } from './routes/home';
import { renderQuiz } from './routes/quiz';
import { renderResult } from './routes/result';
import { mount } from './dom/h';

const app = document.getElementById('app') as HTMLElement;

onRouteChange((route) => {
  switch (route.kind) {
    case 'home':   mount(app, renderHome()); break;
    case 'quiz':   mount(app, renderQuiz()); break;
    case 'result': mount(app, renderResult(route.payload)); break;
    case 'notfound': mount(app, renderHome()); break;
  }
});
```

- [ ] **Step 5: 浏览器冒烟测试**

```bash
bun run dev
```

访问：
- `/` → "干部人格档案" + "开始测评"
- 点 "开始测评" → `#/q` → "答题页 (待实现)"
- 手输 `#/r/v1.AAAAAAAAAAAAAAAAAAAA` → "结果页 (待实现) payload=v1.AAAA..."

- [ ] **Step 6: Commit**

```bash
git add src/router.ts src/dom/h.ts src/routes src/main.ts
git commit -m "feat(ui): hash router with stub home/quiz/result pages"
```

---

## Task 9: M1 收尾 — 全部测试绿 + lint 通过

- [ ] **Step 1: 跑全部测试**

```bash
bun test
```

Expected: 全部 PASS，覆盖 score / classify / faction / similarity / encode。

- [ ] **Step 2: 跑 lint**

```bash
bun run lint
```

Expected: 0 errors。

- [ ] **Step 3: 跑 type check**

```bash
bun x tsc --noEmit
```

Expected: 0 errors。

- [ ] **Step 4: 装 pre-commit hook** (spec § 9.2)

```bash
mkdir -p .githooks
cat > .githooks/pre-commit <<'EOF'
#!/bin/sh
set -e
bun test
bun run lint
EOF
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

- [ ] **Step 5: Commit tag**

```bash
git add .githooks
git commit -m "chore: add pre-commit hook (bun test + oxlint)"
git tag m1-skeleton
```

**M1 完成标志**：引擎层五个纯函数模块全绿 + 路由骨架可访问 + pre-commit hook 就位。

---

# M2 · 内容

## Task 10: 32 题题库 (`content/questions.ts`)

**Files:**
- Create: `src/content/questions.ts`
- Modify: `tests/score.test.ts` (加一个 smoke test 验证题库)

**原则（见 spec 5.2）:**
- 每题 20-40 字，场景化描述
- 不暴露维度
- 每维 4 正 4 反
- `id` 从 0 开始，严格稳定（URL 编码依赖这个顺序）

- [ ] **Step 1: 写 32 题题库**

```ts
// src/content/questions.ts
import type { Question } from '../engine/types';

// id: 0..31 稳定顺序。维度分布 — I×8 L×8 C×8 D×8，每维 4 正 4 反。
// polarity: true = 赞同度高 → 正向得分；false = 赞同度高 → 反向得分 (取反)

export const QUESTIONS: readonly Question[] = [
  // --- I 维度 (理想主义 vs 现实主义) ---
  { id:  0, text: '哪怕仕途受挫，我也不会违背初心去妥协。', dim: 'I', polarity: true  },
  { id:  1, text: '讲原则是书生气，会混才是硬道理。', dim: 'I', polarity: false },
  { id:  2, text: '工作中，我更看重"把事做对"而不是"把事做成"。', dim: 'I', polarity: true  },
  { id:  3, text: '只要结果够好，中间过程可以灵活处理。', dim: 'I', polarity: false },
  { id:  4, text: '我愿意为一件正确的事承担不公平的代价。', dim: 'I', polarity: true  },
  { id:  5, text: '我会优先考虑自己与家人的现实利益。', dim: 'I', polarity: false },
  { id:  6, text: '理想主义者虽然吃亏，但值得尊敬。', dim: 'I', polarity: true  },
  { id:  7, text: '在这个时代，太讲理想只会拖累自己。', dim: 'I', polarity: false },

  // --- L 维度 (规则坚守 vs 权变灵活) ---
  { id:  8, text: '我会严格按流程办事，哪怕麻烦。', dim: 'L', polarity: true  },
  { id:  9, text: '遇到死规矩，我第一反应是找绕过去的办法。', dim: 'L', polarity: false },
  { id: 10, text: '制度是底线，不能因人而异。', dim: 'L', polarity: true  },
  { id: 11, text: '关键时刻，人情与面子比条文更重要。', dim: 'L', polarity: false },
  { id: 12, text: '我不喜欢打擦边球，哪怕别人都在打。', dim: 'L', polarity: true  },
  { id: 13, text: '规则是给能力不够的人设的。', dim: 'L', polarity: false },
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
  { id: 31, text: '到了一定年纪，我只想不出事。', dim: 'D', polarity: false },
];
```

- [ ] **Step 2: 在 `tests/score.test.ts` 追加 smoke test**

```ts
// 追加到 score.test.ts 末尾
import { QUESTIONS } from '../src/content/questions';

test('QUESTIONS: 32 items, 每维 4 正 4 反', () => {
  expect(QUESTIONS).toHaveLength(32);
  for (const dim of ['I','L','C','D'] as const) {
    const inDim = QUESTIONS.filter(q => q.dim === dim);
    expect(inDim).toHaveLength(8);
    expect(inDim.filter(q => q.polarity).length).toBe(4);
    expect(inDim.filter(q => !q.polarity).length).toBe(4);
  }
  // id 从 0 到 31 全齐
  const ids = QUESTIONS.map(q => q.id).sort((a,b) => a-b);
  expect(ids).toEqual(Array.from({ length: 32 }, (_, i) => i));
});
```

- [ ] **Step 3: 跑测试**

```bash
bun test
```

- [ ] **Step 4: Commit**

```bash
git add src/content/questions.ts tests/score.test.ts
git commit -m "feat(content): 32-question bank (8 per dim, 4 pos + 4 neg)"
```

---

## Task 11: 16 人角色档案数据结构 + 祁同伟完整样板

**Files:**
- Create: `src/content/characters.ts`
- Create: `public/characters/README.md`（说明图片来源）

- [ ] **Step 1: 写数据骨架 + 祁同伟完整 persona**

```ts
// src/content/characters.ts
import type { Character, CharacterKey } from '../engine/types';

export const CHARACTERS: Record<CharacterKey, Character> = {
  qi_tongwei: {
    key: 'qi_tongwei',
    name: '祁同伟',
    role: '汉东省公安厅厅长',
    typeCode: 'RFAD',
    quote: '我太想进步了',
    image: '/characters/qi_tongwei.webp',
    persona: `
你是祁同伟型——一个把"进步"二字刻进骨头的人。你深知自己从哪里来、不想回到哪里去，这份清醒既是你的燃料，也是你的枷锁。

寒门出身带给你两样礼物：一是不甘心，二是会算账。你不相信"是金子总会发光"，因为你见过太多金子在井底生锈。你相信的是出手，是时机，是一次又一次把自己推上牌桌。于是你学会了察言观色，学会了在合适的人面前弯下那条你曾经最骄傲的腰。

你的过人之处在于执行力与嗅觉。别人还在掂量利弊，你已经出手；别人还在等上级表态，你已经把事办成并递上功劳。你对结果近乎偏执——不是因为你不懂得欣赏过程，而是因为你输不起。你见过"过程漂亮结果糟糕"的代价，所以你选择反过来。

但你也有阴影面。当"进步"本身变成目的，你会下意识地把所有关系工具化：能帮你往上走的是伙伴，不能的是路人，挡你路的是敌人。你对感情的处理往往粗糙——不是没有情，而是情让你分心，你担不起。时间长了，你身边会慢慢安静，能说真话的人越来越少。

你最擅长应对上升期，最害怕的是停滞。一旦你觉察到"到头了"，往往会做出过激动作。这是你的命门：你把全部自我认同挂在了上升的曲线上，一旦曲线走平，你需要的不是另一次冲锋，而是重新想清楚"除了进步，我到底是谁"。

与你相处的人，请记得三件事：第一，你打的每一仗都不是无的放矢，背后有故事；第二，你的狠不是坏，是被生活磨出来的；第三，你其实很希望有一个人看见你疲惫的样子，但你从不会开口。
    `.trim(),
  },

  // --- 以下 15 个先用精简 stub，后续 Task 12 扩写 ---
  hou_liangping: stub('hou_liangping', '侯亮平', '反贪局长', 'ILCD',
    '人民的名义，不容亵渎'),
  chen_yanshi: stub('chen_yanshi', '陈岩石', '老革命', 'ILCP',
    '党和人民把我交到这里'),
  chen_hai: stub('chen_hai', '陈海', '前任反贪局长', 'ILAD',
    '这个名字，我早就写进了誓词'),
  yi_xuexi: stub('yi_xuexi', '易学习', '金山县委书记', 'ILAP',
    '官帽不如两袖风'),
  sha_ruijin: stub('sha_ruijin', '沙瑞金', '省委书记', 'IFCD',
    '一手抓发展，一手抓反腐'),
  zhong_xiaoai: stub('zhong_xiaoai', '钟小艾', '中纪委干部', 'IFCP',
    '纪律是本笔账，清清楚楚'),
  ji_changming: stub('ji_changming', '季昌明', '省检察院检察长', 'IFAD',
    '有些事，我来拍板'),
  zheng_xipo: stub('zheng_xipo', '郑西坡', '大风厂工会主席', 'IFAP',
    '工人是厂的根'),
  tian_guofu: stub('tian_guofu', '田国富', '省纪委书记', 'RLCD',
    '按规矩来，一步都不越'),
  sun_liancheng: stub('sun_liancheng', '孙连城', '光明区区长', 'RLCP',
    '宇宙无穷大，区长有限'),
  li_dakang: stub('li_dakang', '李达康', '京州市委书记', 'RLAD',
    'GDP 就是硬道理'),
  ouyang_jing: stub('ouyang_jing', '欧阳菁', '京州银行副行长', 'RLAP',
    '规矩的人，也有规矩的账'),
  cai_chenggong: stub('cai_chenggong', '蔡成功', '大风厂董事长', 'RFCD',
    '兄弟，这事包在我身上'),
  gao_xiaoqin: stub('gao_xiaoqin', '高小琴', '山水集团总裁', 'RFCP',
    '山水长流，静水深流'),
  gao_yuliang: stub('gao_yuliang', '高育良', '省委副书记', 'RFAP',
    '我的学生，怎么会这样'),
};

/** 先给 15 角色一个简短的 persona 占位, M2 扩写完稿 */
function stub(
  key: CharacterKey,
  name: string,
  role: string,
  typeCode: string,
  quote: string,
): Character {
  return {
    key, name, role, typeCode, quote,
    image: `/characters/${key}.webp`,
    persona: `（${name} 的完整人格档案待扩写；请参考祁同伟档案的结构：人格速写 · 过人之处 · 阴影面 · 盲点 · 与你相处的建议，每段 150-300 字，总长 1000-1500 字。）`,
  };
}
```

- [ ] **Step 2: 放一张祁同伟剧照**

```bash
# 手动放 public/characters/qi_tongwei.webp (~200KB 以内)
# 同时在 public/characters/README.md 说明图片来源合规
```

`public/characters/README.md`:
```markdown
# 角色剧照

所有图片用于非商业粉丝向 MBTI 测评，来源标注：
《人民的名义》(2017) 剧照，最高人民检察院影视中心出品。
如图片所有方要求下架，请在 issue 中说明，我们立即撤下。

文件名规范：`<character_key>.webp`，建议 ≤200KB，960px 宽 9:16 裁剪。
```

- [ ] **Step 3: 写一个小测试保证 16 角色 + 映射不漏**

在 `tests/classify.test.ts` 末尾追加：

```ts
import { CHARACTERS } from '../src/content/characters';

test('16 CHARACTERS present, keys match', () => {
  const keys = Object.keys(CHARACTERS);
  expect(keys).toHaveLength(16);
});
```

- [ ] **Step 4: 跑测试**

```bash
bun test
```

- [ ] **Step 5: Commit**

```bash
git add src/content/characters.ts public/characters/README.md tests/classify.test.ts
git commit -m "feat(content): character data with 祁同伟 canonical persona + 15 stubs"
```

---

## Task 12: 扩写剩余 15 个角色 persona

**Files:**
- Modify: `src/content/characters.ts`
- Add: 15 张剧照到 `public/characters/`

这是纯内容工作，步骤一致：对每个角色把 `stub()` 调用替换为完整 `Character` 字面量，persona 按祁同伟档案的 5 段结构 (人格速写 / 过人之处 / 阴影面 / 盲点 / 与你相处的建议) 重写，每段 150-300 字，总长 1000-1500 字。

- [ ] **Step 1: 扩写 侯亮平 persona + 提交**
- [ ] **Step 2: 扩写 李达康 persona + 提交**
- [ ] **Step 3: 扩写 沙瑞金 persona + 提交**
- [ ] **Step 4: 扩写 高育良 persona + 提交**
- [ ] **Step 5: 扩写 陈岩石 persona + 提交**
- [ ] **Step 6: 扩写 陈海 persona + 提交**
- [ ] **Step 7: 扩写 易学习 persona + 提交**
- [ ] **Step 8: 扩写 钟小艾 persona + 提交**
- [ ] **Step 9: 扩写 季昌明 persona + 提交**
- [ ] **Step 10: 扩写 郑西坡 persona + 提交**
- [ ] **Step 11: 扩写 田国富 persona + 提交**
- [ ] **Step 12: 扩写 孙连城 persona + 提交**
- [ ] **Step 13: 扩写 欧阳菁 persona + 提交**
- [ ] **Step 14: 扩写 蔡成功 persona + 提交**
- [ ] **Step 15: 扩写 高小琴 persona + 提交**

每次 commit 信息形如：`content: flesh out persona for 侯亮平`。

**验收标准**（每人）：
- 字数 1000-1500
- 5 段结构齐全
- 第二人称"你"直述
- 不混淆其他角色
- 无严重史实错误（主要剧情事件的集数/人物不张冠李戴）

- [ ] **Step 16: 15 张剧照 webp 补齐**（手动；文件名与 key 对应）

- [ ] **Step 17: 最终 Commit + tag**

```bash
git tag m2-content
```

**M2 完成标志**：16 人 persona 全部定稿，16 张剧照齐全。

---

# M3 · 视觉（档案卷宗风）

## Task 13: 全局样式 + 字体加载

**Files:**
- Modify: `src/style.css`
- Add: `public/fonts/` (思源宋体 Heavy + Regular, LXGW WenKai, 子集 woff2)
- Create: `public/paper-noise.png` (256×256 纸张纹理, ~15KB)

- [ ] **Step 1: 放字体文件到 `public/fonts/`**（手动；只打包子集常用汉字，约 1-2MB 每体）

- [ ] **Step 2: 重写 `src/style.css`**

```css
/* src/style.css — 档案卷宗风 */
@font-face {
  font-family: 'ArchiveSerif';
  font-weight: 900;
  src: url('/fonts/source-han-serif-heavy-subset.woff2') format('woff2');
  font-display: swap;
}
@font-face {
  font-family: 'ArchiveSerif';
  font-weight: 400;
  src: url('/fonts/source-han-serif-regular-subset.woff2') format('woff2');
  font-display: swap;
}
@font-face {
  font-family: 'ArchiveHand';
  src: url('/fonts/lxgw-wenkai-subset.woff2') format('woff2');
  font-display: swap;
}

:root {
  --paper: #f4ece0;
  --ink: #1a1a1a;
  --stamp: #8b2e2e;
  --green: #2d4a3e;
  --shadow: rgba(0, 0, 0, .08);
  --muted: #7a7067;
  --serif: 'ArchiveSerif', 'Noto Serif CJK SC', serif;
  --hand: 'ArchiveHand', 'ArchiveSerif', serif;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  background: var(--paper) url('/paper-noise.png');
  background-blend-mode: multiply;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 17px;
  line-height: 1.8;
}

.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 56px 32px 96px;
  position: relative;
}

h1, h2 { font-weight: 900; letter-spacing: .02em; }
h1 { font-size: 2.2rem; border-bottom: 3px double var(--ink); padding-bottom: 8px; }

.btn-primary {
  display: inline-block;
  padding: 14px 40px;
  background: var(--stamp);
  color: var(--paper);
  text-decoration: none;
  border: 2px solid var(--stamp);
  font-weight: 900;
  letter-spacing: .1em;
}
.btn-primary:hover { background: var(--paper); color: var(--stamp); }

/* 红色印章效果 */
.stamp {
  display: inline-block;
  color: var(--stamp);
  border: 2px solid var(--stamp);
  padding: 4px 10px;
  font-weight: 900;
  transform: rotate(-6deg);
  letter-spacing: .15em;
}

/* 表格式档案行 */
.archive-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  padding: 8px 0;
  border-bottom: 1px dashed var(--muted);
}
.archive-row .label { color: var(--muted); }
.archive-row .value { font-weight: 900; }

/* 响应式 */
@media (max-width: 640px) {
  .page { padding: 32px 20px 64px; }
  h1 { font-size: 1.8rem; }
}
```

- [ ] **Step 3: 把纸张噪点 PNG 放到 `public/paper-noise.png`**

（可用 Figma / Photoshop 生成 256×256 低对比度纹理，也可用 CSS filter 伪造）

- [ ] **Step 4: 冒烟 — 各页 hash 切换字体生效**

```bash
bun run dev
```

- [ ] **Step 5: Commit**

```bash
git add src/style.css public/fonts public/paper-noise.png
git commit -m "style: archive-folder aesthetic (fonts, colors, paper texture)"
```

---

## Task 14: 首页（档案封面）完整实现

**Files:**
- Modify: `src/routes/home.ts`
- Create: `src/content/copy.ts`

- [ ] **Step 1: `src/content/copy.ts`**

```ts
// src/content/copy.ts
export const COPY = {
  home: {
    header: '最高人民检察院',
    subheader: '干部人格评估表',
    title: '干部人格档案',
    subtitle: '《人民的名义》MBTI 测评',
    intro: '本测评基于政治哲学四维度，在 16 位剧中人物中找到最像你的那一位。共 32 题，约 5-7 分钟。',
    cta: '开始测评',
    footnote: '第 ________ 号',
  },
};
```

- [ ] **Step 2: 重写 `src/routes/home.ts`**

```ts
// src/routes/home.ts
import { h } from '../dom/h';
import { COPY } from '../content/copy';

export function renderHome(): HTMLElement {
  const c = COPY.home;
  return h('main', { className: 'page page-home' },
    h('div', { className: 'file-header' },
      h('div', { className: 'org' }, c.header),
      h('div', { className: 'form-title' }, c.subheader),
    ),
    h('div', { className: 'stamp' }, '绝 · 密'),
    h('h1', { className: 'cover-title' }, c.title),
    h('p', { className: 'cover-subtitle' }, c.subtitle),
    h('p', { className: 'intro' }, c.intro),
    h('a', { href: '#/q', className: 'btn-primary' }, c.cta),
    h('div', { className: 'footnote' }, c.footnote),
  );
}
```

- [ ] **Step 3: `style.css` 追加 `.page-home` 细节样式**

```css
.page-home .file-header { text-align: center; margin-bottom: 40px; }
.page-home .org { font-size: .9rem; letter-spacing: .4em; color: var(--muted); }
.page-home .form-title { font-size: 1.2rem; font-weight: 900; margin-top: 8px; }
.page-home .stamp { position: absolute; top: 72px; right: 48px; }
.page-home .cover-title { text-align: center; font-size: 3rem; margin-top: 48px; }
.page-home .cover-subtitle { text-align: center; color: var(--muted); font-size: 1rem; }
.page-home .intro { margin: 48px 0; text-indent: 2em; }
.page-home .btn-primary { margin: 32px auto; display: block; width: fit-content; }
.page-home .footnote { margin-top: 96px; text-align: right; color: var(--muted); letter-spacing: .2em; }
```

- [ ] **Step 4: 浏览器人工过**
- [ ] **Step 5: Commit**

```bash
git add src/routes/home.ts src/content/copy.ts src/style.css
git commit -m "feat(ui): home page with archive cover aesthetic"
```

---

## Task 15: 答题页完整实现

**Files:**
- Modify: `src/routes/quiz.ts`
- Modify: `src/style.css`

答题页职责：
- 展示 32 题（乱序呈现，但内部按原 `id` 记录答案）
- 每题 5 档李克特按钮
- 顶部进度条
- 全部答完 → 编码 → 跳转到 `#/r/<payload>`

- [ ] **Step 1: 重写 `src/routes/quiz.ts`**

```ts
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

  const root = h('main', { className: 'page page-quiz' });

  function render(): void {
    const pageEl = h('div', {},
      h('div', { className: 'quiz-header' },
        h('div', { className: 'label' }, '干部人格评估 · 自述笔录'),
        h('div', { className: 'progress' },
          `${answers.size} / ${QUESTIONS.length}`),
        h('div', { className: 'progress-bar' },
          h('div', {
            className: 'progress-fill',
            style: { width: `${(answers.size / QUESTIONS.length) * 100}%` },
          })),
      ),

      h('ol', { className: 'question-list' },
        ...order.map((q, idx) => h('li', { className: 'question' },
          h('div', { className: 'question-num' }, `第 ${idx + 1} 问`),
          h('div', { className: 'question-text' }, q.text),
          h('div', { className: 'likert' },
            ...LIKERT.map((lv) => {
              const selected = answers.get(q.id) === lv.value;
              return h('button', {
                className: `likert-btn${selected ? ' selected' : ''}`,
                onclick: () => {
                  answers.set(q.id, lv.value);
                  render();
                  if (answers.size === QUESTIONS.length) submit();
                },
              }, lv.label);
            })
          )
        ))
      ),

      h('div', { className: 'quiz-footer' },
        `剩余 ${QUESTIONS.length - answers.size} 题`),
    );
    mount(root, pageEl);
  }

  function submit(): void {
    // 按原 id 顺序收集
    const ordered: Answer[] = [];
    for (let i = 0; i < QUESTIONS.length; i++) {
      ordered.push(answers.get(i)!);
    }
    const payload = encodePayload(ordered);
    navigate({ kind: 'result', payload });
  }

  render();
  return root;
}
```

- [ ] **Step 2: CSS 补充**

```css
/* 答题页 */
.page-quiz .quiz-header { position: sticky; top: 0; background: var(--paper); padding: 12px 0; z-index: 5; border-bottom: 1px solid var(--ink); }
.page-quiz .label { letter-spacing: .3em; color: var(--muted); }
.page-quiz .progress { font-variant-numeric: tabular-nums; float: right; }
.page-quiz .progress-bar { height: 4px; background: var(--shadow); margin-top: 8px; }
.page-quiz .progress-fill { height: 100%; background: var(--stamp); transition: width .2s; }

.question-list { list-style: none; padding: 0; counter-reset: q; }
.question { padding: 32px 0; border-bottom: 1px dashed var(--muted); }
.question-num { color: var(--muted); font-family: var(--hand); }
.question-text { font-size: 1.2rem; margin: 12px 0 20px; }

.likert { display: flex; gap: 12px; flex-wrap: wrap; }
.likert-btn { flex: 1; min-width: 96px; padding: 10px 8px;
  background: transparent; border: 1px solid var(--ink); color: var(--ink);
  font-family: inherit; cursor: pointer; transition: all .15s; }
.likert-btn:hover { background: var(--ink); color: var(--paper); }
.likert-btn.selected { background: var(--stamp); color: var(--paper); border-color: var(--stamp); }

.quiz-footer { text-align: center; margin-top: 48px; color: var(--muted); }
```

- [ ] **Step 3: 手动冒烟 — 全部答完跳转结果页**
- [ ] **Step 4: Commit**

```bash
git add src/routes/quiz.ts src/style.css
git commit -m "feat(ui): quiz page with likert buttons, progress, auto-submit on complete"
```

---

## Task 16: 结果页完整实现（含 pretext 段落）

**Files:**
- Modify: `src/routes/result.ts`
- Create: `src/dom/pretext-para.ts`

**背景 — pretext 集成策略:**
`@chenglou/pretext` 给定一段中文文本 + 容器宽度 + 字体参数，可返回每行的字符切分与宽度。我们在 HTML 段落里以 `<div class="pretext-line">` 渲染每一行，避开浏览器的默认断行，从而控制首行缩进、禁首尾标点等。

具体 API（以实际版本为准；若 API 与下面伪代码签名不符，按库 README 调整，核心是 "segments + measure → lines"）：

```ts
import { prepare, layoutWithLines } from '@chenglou/pretext';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')!;
ctx.font = '17px "ArchiveSerif", serif';
const prepared = prepare(text, (t) => ctx.measureText(t).width);
const { lines } = layoutWithLines(prepared, { maxWidth: 640 });
// lines: { text: string }[]
```

- [ ] **Step 1: 写 `src/dom/pretext-para.ts`**

```ts
// src/dom/pretext-para.ts
import { prepare, layoutWithLines } from '@chenglou/pretext';
import { h } from './h';

interface Options {
  text: string;
  maxWidth: number;       // 容器目标宽度 (px)
  fontSpec?: string;      // 传给 canvas ctx.font
  firstIndent?: boolean;  // 首行缩进两字
}

function measurer(fontSpec: string): (t: string) => number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('pretext-para: canvas 2d unavailable');
  ctx.font = fontSpec;
  return (t) => ctx.measureText(t).width;
}

export function pretextPara(opts: Options): HTMLElement {
  const {
    text,
    maxWidth,
    fontSpec = '17px "ArchiveSerif", "Noto Serif CJK SC", serif',
    firstIndent = true,
  } = opts;

  const prepared = prepare(text, measurer(fontSpec));
  const { lines } = layoutWithLines(prepared, { maxWidth });

  return h('div', { className: 'pretext-para', style: firstIndent ? {} : {} },
    ...lines.map((line, idx) =>
      h('div', {
        className: 'pretext-line',
        style: firstIndent && idx === 0 ? { textIndent: '2em' } : {},
      }, line.text)
    )
  );
}
```

**注**：如果 `@chenglou/pretext` 的具体导出名与上面不一致（比如实际是 `prepareWithSegments` 或 `layout`），在这一步调整。保持函数签名 `pretextPara(opts)` 对上游稳定。

- [ ] **Step 2: 写 `src/routes/result.ts`**

```ts
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
import { navigate } from '../router';

export function renderResult(payloadWithMaybePrefix: string): HTMLElement {
  const payload = payloadWithMaybePrefix;
  let answers;
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
    h('div', { className: 'org' }, '最高人民检察院 · 干部人格档案'),
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

  // persona 用 pretext 精排
  const container = h('div', { className: 'persona-container' });
  // 懒渲染：字体加载完再跑 pretext
  document.fonts.ready.then(() => {
    const w = container.clientWidth || 640;
    mount(container, pretextPara({ text: c.persona, maxWidth: w }));
  });

  const neighbors = h('div', { className: 'neighbors' },
    neighborCard('最相近', near),
    neighborCard('最相远', far),
  );

  const actions = h('div', { className: 'actions' },
    h('button', { className: 'btn-primary', onclick: () => openLongImage(c.image, c.name, typeCode, scores, c.quote, faction) }, '生成分享长图'),
    h('button', { className: 'btn-secondary', onclick: () => { navigator.clipboard.writeText(location.href); } }, '复制链接'),
    h('a', { href: '#/', className: 'btn-secondary' }, '再测一次'),
  );

  mount(root, h('div', {},
    header, photo, infoTable, quote, bars,
    h('h2', {}, '人格长文'),
    container,
    neighbors, actions));
  return root;
}

function row(label: string, value: string): HTMLElement {
  return h('div', { className: 'archive-row' },
    h('div', { className: 'label' }, label),
    h('div', { className: 'value' }, value),
  );
}

function dimBar(leftLabel: string, rightLabel: string, score: number): HTMLElement {
  // score 范围 -16..+16, 转为 0..100%
  const pct = ((score + 16) / 32) * 100;
  return h('div', { className: 'dim-bar' },
    h('span', { className: 'dim-left' }, leftLabel),
    h('div', { className: 'dim-track' },
      h('div', { className: 'dim-marker', style: { left: `${pct}%` } }),
    ),
    h('span', { className: 'dim-right' }, rightLabel),
  );
}

function neighborCard(title: string, c: import('../engine/types').Character): HTMLElement {
  return h('div', { className: 'neighbor-card' },
    h('div', { className: 'neighbor-title' }, title),
    h('img', { src: c.image, alt: c.name, className: 'neighbor-photo' }),
    h('div', { className: 'neighbor-name' }, c.name),
    h('div', { className: 'neighbor-role' }, c.role),
  );
}

// 占位: M4 Task 18 实现
function openLongImage(...args: unknown[]): void {
  console.log('longimage: TODO M4', args);
}
```

- [ ] **Step 3: CSS 补充**

```css
.result-header { display: flex; justify-content: space-between; border-bottom: 2px solid var(--ink); padding-bottom: 8px; margin-bottom: 32px; font-size: .9rem; color: var(--muted); letter-spacing: .2em; }

.photo-frame { float: left; margin: 0 24px 16px 0; border: 2px solid var(--ink); padding: 6px; background: var(--paper); }
.photo-frame img { display: block; width: 180px; height: 240px; object-fit: cover; filter: saturate(.85); }
.photo-caption { text-align: center; margin-top: 8px; font-weight: 900; }

.info-table { margin-bottom: 24px; }

.quote { font-size: 1.4rem; color: var(--stamp); border: 1px dashed var(--stamp); padding: 16px 24px; margin: 32px 0; text-align: center; transform: rotate(-1deg); clear: both; }

.dim-bars { margin: 32px 0; }
.dim-bar { display: grid; grid-template-columns: 90px 1fr 90px; align-items: center; gap: 12px; padding: 10px 0; }
.dim-bar .dim-left { text-align: right; color: var(--muted); }
.dim-bar .dim-right { color: var(--muted); }
.dim-track { height: 2px; background: var(--ink); position: relative; }
.dim-marker { position: absolute; top: -6px; width: 14px; height: 14px; background: var(--stamp); transform: translateX(-50%); border-radius: 50%; }

.persona-container { margin: 32px 0; }
.pretext-line { font-family: var(--serif); }

.neighbors { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 48px 0; }
.neighbor-card { text-align: center; border: 1px solid var(--muted); padding: 16px; }
.neighbor-title { color: var(--muted); font-size: .9rem; letter-spacing: .3em; }
.neighbor-photo { width: 120px; height: 160px; object-fit: cover; margin: 12px 0; }
.neighbor-name { font-weight: 900; }
.neighbor-role { color: var(--muted); font-size: .85rem; }

.actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 48px; }
.btn-secondary { padding: 14px 32px; background: transparent; border: 1px solid var(--ink); color: var(--ink); text-decoration: none; cursor: pointer; font-family: inherit; }
.btn-secondary:hover { background: var(--ink); color: var(--paper); }
```

- [ ] **Step 4: 手动冒烟 — 走完完整流程**

```bash
bun run dev
```

从首页一路到结果页，检查：
- pretext 段落首行缩进、行高一致
- 四维刻度条位置正确
- 最近最远角色不等于自己
- 复制链接能粘贴出完整 URL

- [ ] **Step 5: Commit**

```bash
git add src/routes/result.ts src/dom/pretext-para.ts src/style.css
git commit -m "feat(ui): result page with pretext persona layout, dim bars, neighbors"
```

---

## Task 17: M3 收尾 — 人工视觉复盘

- [ ] **Step 1: 过三个页面，列出明显问题**（间距 / 字重 / 错位）
- [ ] **Step 2: 针对性修一轮**
- [ ] **Step 3: `bun run build` 打生产版，跑 `bun run preview` 复测一遍**

```bash
bun run build && bun run preview
```

- [ ] **Step 4: Commit + tag**

```bash
git tag m3-visual
```

**M3 完成标志**：三个页面在浏览器 + 移动端 viewport 下视觉统一，字体加载平稳，无布局抖动。

---

# M4 · 分享（长图 + 二维码）

## Task 18: share/qr.ts — 二维码生成

**Files:**
- Create: `src/share/qr.ts`

- [ ] **Step 1: 写 `src/share/qr.ts`**

```ts
// src/share/qr.ts
import qrcode from 'qrcode-generator';

export interface QROptions {
  size: number;           // 像素, 建议 240
  margin?: number;        // 像素
  fg?: string;
  bg?: string;
}

/** 把 QR 绘到传入 ctx 的 (x, y) 位置 */
export function drawQR(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number,
  y: number,
  opts: QROptions,
): void {
  const qr = qrcode(0, 'H');
  qr.addData(url);
  qr.make();
  const count = qr.getModuleCount();
  const margin = opts.margin ?? 8;
  const cellSize = Math.floor((opts.size - margin * 2) / count);
  const effective = cellSize * count;
  ctx.fillStyle = opts.bg ?? '#ffffff';
  ctx.fillRect(x, y, opts.size, opts.size);
  ctx.fillStyle = opts.fg ?? '#000000';
  const ox = x + (opts.size - effective) / 2;
  const oy = y + (opts.size - effective) / 2;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(ox + c * cellSize, oy + r * cellSize, cellSize, cellSize);
      }
    }
  }
}
```

- [ ] **Step 2: 把 `qrcode-generator` 装进 deps（已在 Task 1 package.json）**

- [ ] **Step 3: Commit**

```bash
git add src/share/qr.ts
git commit -m "feat(share): qr code generator"
```

---

## Task 19: share/longimage.ts — 1080×1920 长图绘制

**Files:**
- Create: `src/share/longimage.ts`
- Modify: `src/routes/result.ts` (接好 `openLongImage`)

- [ ] **Step 1: 写 `src/share/longimage.ts`**

```ts
// src/share/longimage.ts
import type { Scores, Faction } from '../engine/types';
import { FACTION_LABELS } from '../engine/faction';
import { drawQR } from './qr';

const W = 1080;
const H = 1920;
const PAPER = '#f4ece0';
const INK = '#1a1a1a';
const STAMP = '#8b2e2e';
const MUTED = '#7a7067';

interface Input {
  name: string;
  role: string;
  typeCode: string;
  quote: string;
  scores: Scores;
  faction: Faction;
  image: string;       // /characters/xxx.webp
  resultUrl: string;   // 当前页完整 URL, 二维码内容
}

export async function buildLongImage(input: Input): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('longimage: 2d unavailable');

  // 字体需要已加载
  await document.fonts.ready;

  // 背景
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // 顶部抬头
  ctx.fillStyle = INK;
  ctx.font = '32px "ArchiveSerif", serif';
  ctx.textAlign = 'center';
  ctx.fillText('最高人民检察院 · 干部人格档案', W / 2, 96);
  ctx.font = '24px "ArchiveSerif", serif';
  ctx.fillStyle = MUTED;
  ctx.fillText(`档案编号 · ${input.typeCode}-${Date.now().toString(36).slice(-6).toUpperCase()}`, W / 2, 140);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 176); ctx.lineTo(W - 80, 176); ctx.stroke();

  // 角色照片
  const img = await loadImage(input.image);
  const photoW = 420, photoH = 560;
  const photoX = (W - photoW) / 2, photoY = 220;
  ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.strokeRect(photoX - 6, photoY - 6, photoW + 12, photoH + 12);
  ctx.drawImage(img, photoX, photoY, photoW, photoH);

  // 信息表
  const infoY = photoY + photoH + 56;
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = '36px "ArchiveSerif", serif';
  const rows: Array<[string, string]> = [
    ['姓名', input.name],
    ['职务', input.role],
    ['类型码', input.typeCode],
  ];
  let y = infoY;
  for (const [label, value] of rows) {
    ctx.fillStyle = MUTED;
    ctx.fillText(label, 160, y);
    ctx.fillStyle = INK;
    ctx.font = 'bold 40px "ArchiveSerif", serif';
    ctx.fillText(value, 340, y);
    ctx.font = '36px "ArchiveSerif", serif';
    y += 64;
  }

  // 金句
  y += 24;
  ctx.fillStyle = STAMP;
  ctx.font = 'italic bold 54px "ArchiveSerif", serif';
  ctx.textAlign = 'center';
  ctx.fillText(`"${input.quote}"`, W / 2, y);
  y += 80;

  // 四维刻度条
  const bars: Array<[string, string, number]> = [
    ['理想主义', '现实主义', input.scores.I],
    ['规则坚守', '权变灵活', input.scores.L],
    ['集体协作', '独断专行', input.scores.C],
    ['锐意进取', '谨慎守成', input.scores.D],
  ];
  ctx.font = '28px "ArchiveSerif", serif';
  for (const [left, right, score] of bars) {
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'right';
    ctx.fillText(left, 220, y + 8);
    ctx.textAlign = 'left';
    ctx.fillText(right, W - 220, y + 8);
    const trackX = 240, trackW = W - 480;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trackX, y); ctx.lineTo(trackX + trackW, y); ctx.stroke();
    const pct = (score + 16) / 32;
    const markerX = trackX + trackW * pct;
    ctx.fillStyle = STAMP;
    ctx.beginPath();
    ctx.arc(markerX, y, 10, 0, Math.PI * 2);
    ctx.fill();
    y += 52;
  }

  // 阵营徽章
  y += 24;
  ctx.textAlign = 'center';
  ctx.strokeStyle = STAMP;
  ctx.lineWidth = 3;
  ctx.fillStyle = STAMP;
  ctx.font = 'bold 40px "ArchiveSerif", serif';
  const badge = FACTION_LABELS[input.faction];
  const metrics = ctx.measureText(badge);
  const bw = metrics.width + 80, bh = 72;
  const bx = (W - bw) / 2, by = y;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillText(badge, W / 2, by + 52);
  y += bh + 48;

  // 二维码 + 说明
  const qrSize = 240;
  const qrX = (W - qrSize) / 2;
  drawQR(ctx, input.resultUrl, qrX, y, { size: qrSize, fg: INK, bg: PAPER });
  y += qrSize + 24;
  ctx.fillStyle = MUTED;
  ctx.font = '28px "ArchiveSerif", serif';
  ctx.fillText('扫码查看完整档案', W / 2, y + 12);

  // 右下角红章
  ctx.save();
  ctx.translate(W - 120, H - 120);
  ctx.rotate(-0.1);
  ctx.strokeStyle = STAMP;
  ctx.lineWidth = 6;
  ctx.strokeRect(-56, -56, 112, 112);
  ctx.fillStyle = STAMP;
  ctx.font = 'bold 72px "ArchiveSerif", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('阅', 0, 4);
  ctx.restore();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('toBlob null')), 'image/png');
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`loadImage failed: ${src}`));
    img.src = src;
  });
}

/** 触发下载 */
export async function downloadLongImage(input: Input): Promise<void> {
  const blob = await buildLongImage(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `干部人格档案-${input.name}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

- [ ] **Step 2: 接到 result.ts，替换 `openLongImage`**

```ts
// src/routes/result.ts 顶部加入 import
import { downloadLongImage } from '../share/longimage';

// 替换原 openLongImage 调用为:
h('button', {
  className: 'btn-primary',
  onclick: async () => {
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
    } catch (e) {
      console.error(e);
      alert('生成长图失败，请重试');
    }
  },
}, '生成分享长图'),
```

- [ ] **Step 3: 浏览器冒烟**

- [ ] **Step 4: 微调**（字号 / 位置 / 留白）

- [ ] **Step 5: Commit**

```bash
git add src/share/longimage.ts src/routes/result.ts
git commit -m "feat(share): 1080x1920 long image with qr code download"
```

---

## Task 20: M4 收尾

- [ ] **Step 1: 分享链接流程人测**（桌面 + 手机）

桌面：生成长图，扫二维码确认能打开原结果页。

移动端：开浏览器 devtools 模拟手机尺寸，测可长按保存（blob URL 在 iOS Safari 要特殊处理，若失败备注到 README）。

- [ ] **Step 2: 跑测试全绿 + lint**

```bash
bun test && bun run lint && bun x tsc --noEmit
```

- [ ] **Step 3: Commit + tag**

```bash
git tag m4-share
```

**M4 完成标志**：长图可下载，二维码扫出的 URL 能复活同一结果页。

---

# M5 · 部署 + README

## Task 21: Cloudflare Pages 配置 + 部署脚本

**Files:**
- Create: `wrangler.toml`
- Create: `README.md`

- [ ] **Step 1: 写 `wrangler.toml`**

```toml
name = "renminzhiming"
compatibility_date = "2026-04-20"
pages_build_output_dir = "dist"
```

- [ ] **Step 2: `bun run build` 产物核查**

```bash
bun run build
ls -la dist
```

Expected: `dist/index.html`, `dist/assets/*.js`, `dist/characters/*.webp`, `dist/fonts/*.woff2` 齐全。

- [ ] **Step 3: 首次部署**

```bash
bun x wrangler pages deploy dist --project-name renminzhiming
```

Expected: 返回一个 `*.pages.dev` 的 preview URL。

- [ ] **Step 4: 在 preview URL 上跑完整流程**

- 首页加载 < 2s（4G 模拟）
- 字体加载稳定，无严重 FOUT
- 点 "开始测评" → 答完 32 题 → 结果页 hash URL 刷新后不变
- 复制链接在新 tab / 新设备打开，能复活同一结果
- 生成长图下载成功

- [ ] **Step 5: Commit**

```bash
git add wrangler.toml
git commit -m "chore: cloudflare pages deploy config"
```

---

## Task 22: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: 写 README**

```markdown
# 干部人格档案 · 《人民的名义》MBTI 测评

一个纯静态的人格测评单页应用：32 题 → 4 维分数 → 在 16 位剧中人物中找到最像你的那一位。

## 开发

```bash
bun install
bun run dev       # http://localhost:5173
bun test          # 引擎单测
bun run lint      # oxlint
bun run build     # 产出 dist/
```

## 部署

```bash
bun run deploy    # cloudflare pages
```

## 目录

- `src/engine/` — 纯函数：计分、分类、阵营、相似度、URL 编解码
- `src/content/` — 32 题题库 + 16 人档案
- `src/routes/` — 首页 / 答题 / 结果
- `src/share/` — 分享长图 + 二维码
- `src/dom/` — DOM 辅助 + pretext 段落包装

## 设计文档

`docs/superpowers/specs/2026-04-20-renminzhiming-mbti-design.md`

## 授权与版权

剧照版权归最高人民检察院影视中心所有，本项目非商业粉丝向使用。
```

- [ ] **Step 2: Commit + tag**

```bash
git add README.md
git commit -m "docs: README"
git tag m5-release
```

**M5 完成标志**：Cloudflare Pages 上线，README 齐备。

---

# Self-Review Checklist

运行实现前，执行者应：

- [ ] 通读 spec 的 §2 测评模型，确认 16 型映射、低强度阈值、阵营查表理解一致
- [ ] 检查 `@chenglou/pretext` 的实际 API（Task 16 Step 1 注释中有说明，签名有差异就改 `pretext-para.ts`）
- [ ] 跑 `bun test` 全绿后再进入 M2 视觉/内容层
- [ ] 不要在 plan 完成前引入任何新依赖（保持 chenglou 极简风格）

# 验收（全部 milestone）

- [ ] 全部测试绿、lint 0 error、tsc 0 error
- [ ] 浏览器冒烟：首页 → 答题 → 结果 → 分享长图 → 扫码复活 全链路通
- [ ] 移动端（iPhone SE 宽度 375）不横向滚动
- [ ] 祁同伟一档金句出现为「我太想进步了」
- [ ] URL 分享链接跨设备可复活
- [ ] Cloudflare Pages 部署成功

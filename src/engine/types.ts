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

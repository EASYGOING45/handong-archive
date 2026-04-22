import type { Scores, CharacterKey } from './types';

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
  if (!nearestKey || !farthestKey) throw new Error('similarity: no candidates');
  return { nearest: nearestKey, farthest: farthestKey };
}

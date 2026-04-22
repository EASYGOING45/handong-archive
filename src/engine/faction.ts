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

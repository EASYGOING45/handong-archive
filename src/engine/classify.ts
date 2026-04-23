import type { Scores, TypeCode, CharacterKey } from './types';

const LOW_INTENSITY_THRESHOLD = 2;

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
  RLCP: 'ouyang_jing',
  RLAD: 'li_dakang',
  RLAP: 'sun_liancheng',
  RFCD: 'gao_xiaoqin',
  RFCP: 'cai_chenggong',
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
    return { typeCode: 'RLAP', character: 'sun_liancheng' };
  }
  const code =
    (scores.I >= 0 ? 'I' : 'R') +
    (scores.L >= 0 ? 'L' : 'F') +
    (scores.C >= 0 ? 'C' : 'A') +
    (scores.D >= 0 ? 'D' : 'P');
  const character = TYPE_TO_CHARACTER[code];
  if (!character) throw new Error(`unmapped type code: ${code}`);
  return { typeCode: code, character };
}

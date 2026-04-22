import { describe, expect, test } from 'bun:test';
import { factionOf } from '../src/engine/faction';
import type { CharacterKey } from '../src/engine/types';

describe('factionOf', () => {
  test('改革派 → sha_li', () => {
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
    const keys: CharacterKey[] = [
      'hou_liangping','chen_yanshi','chen_hai','yi_xuexi',
      'sha_ruijin','zhong_xiaoai','ji_changming','zheng_xipo',
      'tian_guofu','sun_liancheng','li_dakang','ouyang_jing',
      'cai_chenggong','gao_xiaoqin','qi_tongwei','gao_yuliang',
    ];
    for (const k of keys) {
      expect(typeof factionOf(k)).toBe('string');
    }
  });
});

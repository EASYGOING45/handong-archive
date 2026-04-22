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
  test('all zero trips low-intensity → 孙连城', () => {
    const r = classify(s(0, 0, 0, 0));
    expect(r.character).toBe('sun_liancheng');
  });
  test('low-intensity: all |x| ≤ 2 → 孙连城 RLCP', () => {
    expect(classify(s(2, -2, 1, 0)).character).toBe('sun_liancheng');
    expect(classify(s(-2, 2, -1, 0)).character).toBe('sun_liancheng');
  });
  test('just outside threshold (all=3) → normal mapping', () => {
    const r = classify(s(3, 3, 3, 3));
    expect(r.character).toBe('hou_liangping');
    expect(r.typeCode).toBe('ILCD');
  });
  test('one dim at 0, others strong → dim 0 treated as positive letter', () => {
    const r = classify(s(0, 10, 10, 10));
    expect(r.typeCode).toBe('ILCD');
  });
});

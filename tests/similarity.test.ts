import { describe, expect, test } from 'bun:test';
import { nearestAndFarthest } from '../src/engine/similarity';
import type { Scores } from '../src/engine/types';

const s = (I: number, L: number, C: number, D: number): Scores => ({ I, L, C, D });

describe('nearestAndFarthest', () => {
  test('full ILCD scores excluding 侯亮平 → farthest = 高育良, nearest ≠ 侯亮平', () => {
    const r = nearestAndFarthest(s(16, 16, 16, 16), 'hou_liangping');
    expect(r.nearest).not.toBe('hou_liangping');
    expect(r.farthest).toBe('gao_yuliang');
  });
  test('excludes self from both nearest and farthest', () => {
    const r = nearestAndFarthest(s(16, 16, 16, 16), 'hou_liangping');
    expect(r.nearest).not.toBe('hou_liangping');
    expect(r.farthest).not.toBe('hou_liangping');
  });
});

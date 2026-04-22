import { describe, expect, test } from 'bun:test';
import { computeScores } from '../src/engine/score';
import type { Answer, Question } from '../src/engine/types';

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
    const a: Answer[] = [0, 2, 0, 0, 0, 0, 0, 0];
    expect(computeScores(a, fixture)).toEqual({ I: -2, L: 0, C: 0, D: 0 });
  });

  test('positive and reverse sum correctly', () => {
    const a: Answer[] = [2, -1, 0, 0, 0, 0, 0, 0];
    expect(computeScores(a, fixture).I).toBe(3);
  });

  test('rejects answers length mismatch', () => {
    expect(() => computeScores([0, 0], fixture)).toThrow();
  });
});

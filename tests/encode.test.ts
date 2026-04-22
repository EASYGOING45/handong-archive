import { describe, expect, test } from 'bun:test';
import { encodePayload, decodePayload } from '../src/engine/encode';
import type { Answer } from '../src/engine/types';

function makeAnswers(val: Answer): Answer[] {
  return Array(32).fill(val);
}

describe('encode/decode', () => {
  test('roundtrip all zeros', () => {
    const a = makeAnswers(0);
    expect(decodePayload(encodePayload(a))).toEqual(a);
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
    for (let i = 0; i < 32; i++) a.push(((i % 5) - 2) as Answer);
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

import type { Answer } from './types';

const VERSION = 'v1';
const N = 32;
const BITS_PER_ANSWER = 3;
const TOTAL_BITS = N * BITS_PER_ANSWER;
const TOTAL_BYTES = TOTAL_BITS / 8;
const ALPHA = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
const ALPHA_LOOKUP: Record<string, number> = Object.fromEntries(
  [...ALPHA].map((ch, i) => [ch, i]),
);

function toUnsigned(a: Answer): number { return a + 2; }
function toSigned(u: number): Answer { return (u - 2) as Answer; }

export function encodePayload(answers: readonly Answer[]): string {
  if (answers.length !== N) {
    throw new Error(`encodePayload: expected ${N} answers, got ${answers.length}`);
  }
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
  if (version !== VERSION) throw new Error(`decodePayload: unsupported version ${version}`);
  if (!body || body.length !== 20) {
    throw new Error(`decodePayload: body length must be 20, got ${body?.length}`);
  }
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

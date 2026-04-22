import type { Answer, Question, Scores, DimKey } from './types';

export function computeScores(
  answers: readonly Answer[],
  questions: readonly Question[],
): Scores {
  if (answers.length !== questions.length) {
    throw new Error(
      `answers length ${answers.length} !== questions length ${questions.length}`,
    );
  }
  const acc: Record<DimKey, number> = { I: 0, L: 0, C: 0, D: 0 };
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;
    const a = answers[i]!;
    const signed = q.polarity ? a : -a;
    acc[q.dim] += signed;
  }
  return { I: acc.I, L: acc.L, C: acc.C, D: acc.D };
}

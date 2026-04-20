import type { Assignment, Condition, QuestionSetId } from '../types/session';

const ASSIGNMENT_TABLE: Record<number, { order: Condition[]; sets: QuestionSetId[] }> = {
  1: { order: ['c1', 'c2', 'c3'], sets: ['A', 'B', 'C'] },
  2: { order: ['c1', 'c2', 'c3'], sets: ['B', 'C', 'A'] },
  3: { order: ['c2', 'c3', 'c1'], sets: ['A', 'B', 'C'] },
  4: { order: ['c2', 'c3', 'c1'], sets: ['C', 'A', 'B'] },
  5: { order: ['c3', 'c1', 'c2'], sets: ['A', 'B', 'C'] },
  6: { order: ['c3', 'c1', 'c2'], sets: ['B', 'C', 'A'] },
};

export function getAssignment(participantId: number): Assignment {
  const key = ((participantId - 1) % 6) + 1;
  return ASSIGNMENT_TABLE[key];
}

export function getConditionLabel(condition: Condition): string {
  const labels: Record<Condition, string> = {
    c1: 'C1: 시간 기반 (Baseline)',
    c2: 'C2: AI 맥락 인식 + 경고',
    c3: 'C3: AI 맥락 인식 + 감성 피드백',
  };
  return labels[condition];
}

import type { Assignment, Condition, QuestionSetId } from '../types/session';

// 18명 = 6패턴 × 3반복 (Full Latin Square counterbalancing)
const ASSIGNMENT_TABLE: Record<number, { order: Condition[]; sets: QuestionSetId[] }> = {
  1:  { order: ['c1', 'c2', 'c3'], sets: ['A', 'B', 'C'] },
  2:  { order: ['c1', 'c3', 'c2'], sets: ['B', 'C', 'A'] },
  3:  { order: ['c2', 'c1', 'c3'], sets: ['C', 'A', 'B'] },
  4:  { order: ['c2', 'c3', 'c1'], sets: ['A', 'B', 'C'] },
  5:  { order: ['c3', 'c1', 'c2'], sets: ['B', 'C', 'A'] },
  6:  { order: ['c3', 'c2', 'c1'], sets: ['C', 'A', 'B'] },
};

export function getAssignment(participantId: number): Assignment {
  const key = ((participantId - 1) % 6) + 1;
  return ASSIGNMENT_TABLE[key];
}

export function getConditionLabel(condition: Condition): string {
  const labels: Record<Condition, string> = {
    c1: 'C1: 열품타 (수동 정지)',
    c2: 'C2: Screen Monitoring (자동 정지)',
    c3: 'C3: Screen Monitoring + Forest',
  };
  return labels[condition];
}

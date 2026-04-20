export type QuestionType = 'choice' | 'short_answer';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string;
}

export interface QuestionSet {
  setId: string;
  questions: Question[];
}

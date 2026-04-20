export type QuestionType = 'multiple_choice' | 'short_answer';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: QuestionOption[];
  correctAnswer: string;
}

export interface QuestionSet {
  setId: string;
  questions: Question[];
}

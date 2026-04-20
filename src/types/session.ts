// ===== Condition & Assignment =====
export type Condition = 'c1' | 'c2' | 'c3';
export type QuestionSetId = 'A' | 'B' | 'C';

export interface Assignment {
  order: Condition[];
  sets: QuestionSetId[];
}

// ===== Events =====
export type EventType =
  | 'session_start'
  | 'session_end'
  | 'study_phase_start'
  | 'study_phase_end'
  | 'quiz_phase_start'
  | 'keypress'
  | 'mouse_move'
  | 'mouse_click'
  | 'window_blur'
  | 'window_focus'
  | 'idle_start'
  | 'idle_end'
  | 'feedback_triggered'
  | 'question_answered'
  | 'question_shown';

export interface SessionEvent {
  timestamp: number;
  type: EventType;
  payload: Record<string, unknown>;
}

// ===== Survey =====
export interface SurveyAnswer {
  questionId: string;
  value: number | string;
}

// ===== Session State =====
export interface SessionState {
  participantId: number | null;
  assignment: Assignment | null;
  currentSessionIndex: number; // 0, 1, 2
  sessionStartTs: number | null;
  eventLog: SessionEvent[];
  surveyResponses: Record<string, SurveyAnswer[]>;
  isSessionActive: boolean;
  completedSessions: string[];
}

// ===== Session Actions =====
export type SessionAction =
  | { type: 'SET_PARTICIPANT'; participantId: number; assignment: Assignment }
  | { type: 'START_SESSION'; timestamp: number }
  | { type: 'END_SESSION' }
  | { type: 'LOG_EVENT'; event: SessionEvent }
  | { type: 'SAVE_SURVEY'; condition: string; answers: SurveyAnswer[] }
  | { type: 'NEXT_SESSION' }
  | { type: 'CLEAR_EVENT_LOG' }
  | { type: 'RESTORE'; state: SessionState };

// ===== Log Export =====
export interface LogFileMeta {
  participantId: number;
  condition: Condition;
  questionSet: QuestionSetId;
  sessionOrder: number;
  startedAt: string;
  endedAt: string;
  durationMs: number;
}

export interface DerivedMetrics {
  totalFocusTimeMs: number;
  disengagementCount: number;
  meanFocusSpanMs: number;
  completionRate: number;
}

export interface LogFile {
  meta: LogFileMeta;
  events: SessionEvent[];
  surveyResponses: SurveyAnswer[];
  derivedMetrics: DerivedMetrics;
}

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
  | 'question_shown'
  // Screen Monitoring events (C2/C3)
  | 'screen_monitor_pause'     // 다른 앱/탭 전환 → 타이머 자동 정지
  | 'screen_monitor_resume'    // 복귀 → 타이머 재개
  // C1 manual pause
  | 'timer_manual_pause'       // 열품타: 수동 정지
  | 'timer_manual_resume';     // 열품타: 수동 재개

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

// ===== PDF-Generated Study Material =====
export interface GeneratedStudySection {
  heading: string;
  content: string;         // md 형식 학습 내용
}

export interface GeneratedStudyMaterial {
  title: string;
  subtitle: string;
  sections: GeneratedStudySection[];
  terms: { term: string; definition: string }[];       // 용어 정리
  analysis: string[];                                    // 비판적 분석
  rawMarkdown: string;                                   // 전체 md 원문
}

// ===== PDF-Generated Quiz =====
export interface GeneratedQuiz {
  setId: QuestionSetId;
  questions: {
    id: string;
    type: 'choice' | 'short_answer';
    text: string;
    options?: string[];
    correctAnswer: string;
  }[];
}

// ===== PDF Upload Data (3 PDFs → 3 Sets) =====
export interface PdfSetData {
  A: { study: GeneratedStudyMaterial; quiz: GeneratedQuiz } | null;
  B: { study: GeneratedStudyMaterial; quiz: GeneratedQuiz } | null;
  C: { study: GeneratedStudyMaterial; quiz: GeneratedQuiz } | null;
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
  // PDF-based generated data
  pdfData: PdfSetData | null;
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
  | { type: 'RESTORE'; state: SessionState }
  | { type: 'SET_PDF_DATA'; pdfData: PdfSetData };

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
  // Screen monitoring specific
  totalPausedMs: number;         // 총 일시정지 시간
  pauseCount: number;            // 일시정지 횟수
}

export interface LogFile {
  meta: LogFileMeta;
  events: SessionEvent[];
  surveyResponses: SurveyAnswer[];
  derivedMetrics: DerivedMetrics;
}

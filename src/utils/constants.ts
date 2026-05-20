// ===== Timing Thresholds =====
export const IDLE_THRESHOLD_MS = 10_000;    // 10초: 키보드/마우스 모두 비활동
export const BLUR_THRESHOLD_MS = 3_000;     // 3초: 창 포커스 이탈
export const SESSION_DURATION_MS = 1_200_000; // 20분
export const MOUSE_THROTTLE_MS = 500;       // 마우스 이벤트 throttle

// ===== Participants =====
export const MAX_PARTICIPANTS = 6;          // 6명 실험

// ===== Screen Monitoring (C2/C3) =====
export const SCREEN_MONITOR_DEBOUNCE_MS = 500; // blur→pause 전환 debounce

// ===== C2 Warning =====
export const WARNING_DISPLAY_MS = 5_000;    // 경고 배너 표시 시간
export const WARNING_COOLDOWN_MS = 30_000;  // 경고 재발동 쿨다운

// ===== C3 Tree =====
export const TREE_GROW_RATE = 0.05;         // active 상태 초당 health 증가
export const TREE_WILT_RATE = 0.15;         // idle 상태 초당 health 감소
export const TREE_INITIAL_HEALTH = 30;
export const TREE_MAX_HEALTH = 100;
export const TREE_MIN_HEALTH = 0;

// ===== ML Classifier (레거시) =====
export const ML_CLASSIFY_INTERVAL_MS = 2000;   // ML 이진분류 실행 간격
export const ML_NOT_STUDYING_THRESHOLD = 0.35; // 판단 임계값
export const ML_SMOOTH_WINDOW = 5;             // 이동 평균 윈도우 크기

// ===== AI Study Classifier (신규) =====
export const AI_GRACE_PERIOD_MS = 3000;        // 탭 전환 후 AI 판단 유예 시간 (PRD §5.5)
export const AI_CLASSIFY_INTERVAL_MS = 30_000; // 이탈 상태 재판단 주기 (PRD §5.5)

// ===== Logging =====
export const LOG_FLUSH_INTERVAL = 100;      // 100개 이벤트마다 localStorage flush
export const LOCAL_STORAGE_KEY = 'caf_event_log';
export const SESSION_STORAGE_KEY = 'caf_session_state';
export const PDF_STORAGE_KEY = 'caf_pdf_data';   // PDF 기반 생성 자료 저장

// ===== Timing Thresholds =====
export const IDLE_THRESHOLD_MS = 10_000;    // 10초: 키보드/마우스 모두 비활동
export const BLUR_THRESHOLD_MS = 3_000;     // 3초: 창 포커스 이탈
export const SESSION_DURATION_MS = 1_200_000; // 20분
export const MOUSE_THROTTLE_MS = 500;       // 마우스 이벤트 throttle

// ===== Participants =====
export const MAX_PARTICIPANTS = 18;         // 18명 실험

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

// ===== Logging =====
export const LOG_FLUSH_INTERVAL = 100;      // 100개 이벤트마다 localStorage flush
export const LOCAL_STORAGE_KEY = 'caf_event_log';
export const SESSION_STORAGE_KEY = 'caf_session_state';
export const PDF_STORAGE_KEY = 'caf_pdf_data';   // PDF 기반 생성 자료 저장

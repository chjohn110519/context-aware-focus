interface PauseOverlayProps {
  visible: boolean;
  pausedMs: number;
  pauseCount: number;
  /** 수동 중지/재개 콜백 (C2/C3 AI 기반 타이머용) */
  isManuallyPaused?: boolean;
  onManualResume?: () => void;
}

export default function PauseOverlay({
  visible,
  pausedMs,
  pauseCount,
  isManuallyPaused = false,
  onManualResume,
}: PauseOverlayProps) {
  // AI 이탈 감지 overlay이거나, 수동 정지 상태일 때 표시
  if (!visible && !isManuallyPaused) return null;

  const seconds = Math.floor(pausedMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const displaySec = seconds % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(displaySec).padStart(2, '0')}`;

  // 수동 정지 모드 (AI 이탈이 아닌 사용자 직접 정지)
  const isManualMode = isManuallyPaused && !visible;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: isManualMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="text-center max-w-md mx-4 fade-in">
        <div className="text-6xl mb-6" style={{ animation: 'pulse-timer 2s infinite' }}>
          {isManualMode ? '☕' : '⏸️'}
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          {isManualMode ? '타이머가 정지 중입니다' : '타이머가 일시정지되었습니다'}
        </h2>
        <p className="text-base mb-6" style={{ color: '#94a3b8' }}>
          {isManualMode ? (
            <>잠시 쉬고 계시군요.<br />준비되면 재개 버튼을 눌러주세요.</>
          ) : (
            <>다른 활동이 감지되었습니다.<br />학습 화면으로 돌아와주세요.</>
          )}
        </p>

        <div className="inline-flex items-center gap-6 p-5 rounded-2xl mb-4" style={{
          background: isManualMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isManualMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
        }}>
          <div className="text-center">
            <p className="text-xs font-semibold mb-1" style={{ color: isManualMode ? '#a5b4fc' : '#fca5a5' }}>일시정지 시간</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color: isManualMode ? '#818cf8' : '#f87171' }}>
              {formatted}
            </p>
          </div>
          <div className="w-px h-10" style={{ background: isManualMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)' }} />
          <div className="text-center">
            <p className="text-xs font-semibold mb-1" style={{ color: isManualMode ? '#a5b4fc' : '#fca5a5' }}>이탈 횟수</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color: isManualMode ? '#818cf8' : '#f87171' }}>
              {pauseCount}
            </p>
          </div>
        </div>

        {/* 수동 재개 버튼 (수동 정지 상태일 때) */}
        {isManuallyPaused && onManualResume && (
          <button
            onClick={onManualResume}
            className="mt-4 px-8 py-3 rounded-xl font-bold text-base transition-all"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
          >
            ▶️ 타이머 재개
          </button>
        )}

        <p className="text-xs mt-3" style={{ color: '#64748b' }}>
          {isManualMode
            ? '재개 버튼을 누르면 타이머가 다시 시작됩니다'
            : '이 화면으로 돌아오면 타이머가 자동으로 재개됩니다'}
        </p>
      </div>
    </div>
  );
}

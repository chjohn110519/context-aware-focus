interface PauseOverlayProps {
  visible: boolean;
  pausedMs: number;
  pauseCount: number;
}

export default function PauseOverlay({ visible, pausedMs, pauseCount }: PauseOverlayProps) {
  if (!visible) return null;

  const seconds = Math.floor(pausedMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const displaySec = seconds % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(displaySec).padStart(2, '0')}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="text-center max-w-md mx-4 fade-in">
        <div className="text-6xl mb-6" style={{ animation: 'pulse-timer 2s infinite' }}>⏸️</div>
        <h2 className="text-2xl font-bold text-white mb-3">
          타이머가 일시정지되었습니다
        </h2>
        <p className="text-base mb-6" style={{ color: '#94a3b8' }}>
          다른 활동이 감지되었습니다.<br />
          학습 화면으로 돌아와주세요.
        </p>

        <div className="inline-flex items-center gap-6 p-5 rounded-2xl mb-4" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}>
          <div className="text-center">
            <p className="text-xs font-semibold mb-1" style={{ color: '#fca5a5' }}>일시정지 시간</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color: '#f87171' }}>
              {formatted}
            </p>
          </div>
          <div className="w-px h-10" style={{ background: 'rgba(239, 68, 68, 0.2)' }} />
          <div className="text-center">
            <p className="text-xs font-semibold mb-1" style={{ color: '#fca5a5' }}>이탈 횟수</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color: '#f87171' }}>
              {pauseCount}
            </p>
          </div>
        </div>

        <p className="text-xs" style={{ color: '#64748b' }}>
          이 화면으로 돌아오면 타이머가 자동으로 재개됩니다
        </p>
      </div>
    </div>
  );
}

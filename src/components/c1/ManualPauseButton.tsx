interface ManualPauseButtonProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
}

export default function ManualPauseButton({ isPaused, onPause, onResume }: ManualPauseButtonProps) {
  return (
    <button
      onClick={isPaused ? onResume : onPause}
      className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
      style={{
        background: isPaused
          ? 'rgba(74, 222, 128, 0.15)'
          : 'rgba(239, 68, 68, 0.15)',
        border: `1px solid ${isPaused ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        color: isPaused ? '#4ade80' : '#fca5a5',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.05)'; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
    >
      {isPaused ? (
        <>
          <span>▶️</span>
          <span>재개</span>
        </>
      ) : (
        <>
          <span>⏸️</span>
          <span>일시정지</span>
        </>
      )}
    </button>
  );
}

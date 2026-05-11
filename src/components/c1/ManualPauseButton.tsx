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
          ? 'rgba(22, 163, 74, 0.1)'
          : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${isPaused ? 'rgba(22, 163, 74, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
        color: isPaused ? '#15803d' : '#b91c1c',
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

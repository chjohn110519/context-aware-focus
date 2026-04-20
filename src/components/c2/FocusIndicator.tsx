interface FocusIndicatorProps {
  status: 'good' | 'warn' | 'bad';
}

const statusLabels = {
  good: '양호',
  warn: '주의',
  bad: '이탈',
};

export default function FocusIndicator({ status }: FocusIndicatorProps) {
  return (
    <div className="focus-indicator">
      <span>🤖</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>집중 상태:</span>
      <span className={`dot ${status}`} />
      <span className="font-semibold" style={{
        color: status === 'good' ? 'var(--indicator-good)' :
          status === 'warn' ? 'var(--indicator-warn)' : 'var(--indicator-bad)'
      }}>
        {statusLabels[status]}
      </span>
    </div>
  );
}

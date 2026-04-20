interface LikertScaleProps {
  questionId: string;
  label: string;
  value: number | null;
  onChange: (questionId: string, value: number) => void;
  scale?: number;
  lowLabel?: string;
  highLabel?: string;
}

export default function LikertScale({
  questionId,
  label,
  value,
  onChange,
  scale = 5,
  lowLabel = '매우 그렇지 않다',
  highLabel = '매우 그렇다',
}: LikertScaleProps) {
  return (
    <div className="card">
      <p className="mb-4 font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{lowLabel}</span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{highLabel}</span>
      </div>
      <div className="likert-group">
        {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`likert-btn ${value === n ? 'selected' : ''}`}
            onClick={() => onChange(questionId, n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

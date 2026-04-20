interface LikertScaleProps {
  questionId: string;
  label: string;
  value: number | null;
  onChange: (questionId: string, value: number) => void;
  scale?: number;
  lowLabel?: string;
  highLabel?: string;
  index?: number;
}

export default function LikertScale({
  questionId,
  label,
  value,
  onChange,
  scale = 5,
  lowLabel = '매우 그렇지 않다',
  highLabel = '매우 그렇다',
  index = 0,
}: LikertScaleProps) {
  return (
    <div className="p-4 rounded-xl transition-all" style={{
      background: value !== null
        ? 'rgba(15, 23, 42, 0.7)'
        : 'rgba(15, 23, 42, 0.4)',
      border: value !== null
        ? '1px solid rgba(129, 140, 248, 0.2)'
        : '1px solid rgba(51, 65, 85, 0.4)',
    }}>
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xs font-bold shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
          style={{
            background: value !== null ? 'rgba(129, 140, 248, 0.2)' : 'rgba(51, 65, 85, 0.5)',
            color: value !== null ? '#818cf8' : '#64748b',
          }}>
          {index + 1}
        </span>
        <p className="text-sm font-medium leading-relaxed" style={{ color: '#e2e8f0' }}>
          {label}
        </p>
      </div>

      <div className="pl-9">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px]" style={{ color: '#64748b' }}>{lowLabel}</span>
          <span className="text-[10px]" style={{ color: '#64748b' }}>{highLabel}</span>
        </div>
        <div className="flex gap-2 justify-center">
          {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className="transition-all duration-150"
              onClick={() => onChange(questionId, n)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                border: value === n
                  ? '2px solid #818cf8'
                  : '1px solid rgba(51, 65, 85, 0.6)',
                background: value === n
                  ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                  : 'rgba(15, 23, 42, 0.6)',
                color: value === n ? '#fff' : '#94a3b8',
                fontWeight: value === n ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transform: value === n ? 'scale(1.1)' : 'scale(1)',
                boxShadow: value === n ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                fontFamily: 'inherit',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

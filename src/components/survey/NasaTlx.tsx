interface NasaTlxProps {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const dimensions = [
  { key: 'mental', label: '정신적 요구 (Mental Demand)', desc: '이 과제에서 정신적·지각적 활동이 얼마나 필요했나요?' },
  { key: 'physical', label: '신체적 요구 (Physical Demand)', desc: '이 과제에서 신체적 활동이 얼마나 필요했나요?' },
  { key: 'temporal', label: '시간적 요구 (Temporal Demand)', desc: '시간적 압박을 얼마나 느꼈나요?' },
  { key: 'performance', label: '수행도 (Performance)', desc: '자신의 목표 달성 정도에 얼마나 만족하나요?' },
  { key: 'effort', label: '노력 (Effort)', desc: '목표 수준의 수행을 위해 얼마나 노력했나요?' },
  { key: 'frustration', label: '좌절감 (Frustration)', desc: '이 과제 중 좌절감, 스트레스, 짜증을 얼마나 느꼈나요?' },
];

export default function NasaTlx({ values, onChange }: NasaTlxProps) {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
        NASA-TLX 작업부하 평가
      </h3>
      {dimensions.map(({ key, label, desc }) => (
        <div key={key} className="card">
          <label className="block mb-1 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {label}
          </label>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>낮음</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={values[key] ?? 50}
              onChange={(e) => onChange(key, Number(e.target.value))}
              className="slider-track flex-1"
            />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>높음</span>
            <span className="w-10 text-center font-bold" style={{ color: 'var(--accent)' }}>
              {values[key] ?? 50}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface NasaTlxProps {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const dimensions = [
  { key: 'mental', label: '정신적 요구', eng: 'Mental Demand', desc: '이 과제에서 정신적·지각적 활동이 얼마나 필요했나요?', emoji: '🧠' },
  { key: 'physical', label: '신체적 요구', eng: 'Physical Demand', desc: '이 과제에서 신체적 활동이 얼마나 필요했나요?', emoji: '💪' },
  { key: 'temporal', label: '시간적 요구', eng: 'Temporal Demand', desc: '시간적 압박을 얼마나 느꼈나요?', emoji: '⏰' },
  { key: 'performance', label: '수행도', eng: 'Performance', desc: '자신의 목표 달성 정도에 얼마나 만족하나요?', emoji: '🎯' },
  { key: 'effort', label: '노력', eng: 'Effort', desc: '목표 수준의 수행을 위해 얼마나 노력했나요?', emoji: '🔥' },
  { key: 'frustration', label: '좌절감', eng: 'Frustration', desc: '이 과제 중 좌절감, 스트레스, 짜증을 얼마나 느꼈나요?', emoji: '😤' },
];

function getGaugeColor(value: number): string {
  if (value <= 30) return '#4ade80';
  if (value <= 60) return '#facc15';
  if (value <= 80) return '#fb923c';
  return '#f87171';
}

export default function NasaTlx({ values, onChange }: NasaTlxProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ background: 'rgba(129, 140, 248, 0.2)', color: '#818cf8' }}>
          📊
        </div>
        <div>
          <h3 className="text-base font-bold" style={{ color: '#e2e8f0' }}>
            NASA-TLX 작업부하 평가
          </h3>
          <p className="text-xs" style={{ color: '#64748b' }}>
            각 항목의 슬라이더를 조절하여 부하 정도를 평가해주세요
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {dimensions.map(({ key, label, eng, desc, emoji }) => {
          const val = values[key] ?? 50;
          const gaugeColor = getGaugeColor(val);
          return (
            <div key={key} className="p-4 rounded-xl transition-all" style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(51, 65, 85, 0.5)',
            }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{emoji}</span>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                      {label}
                    </span>
                    <span className="text-xs ml-1.5" style={{ color: '#64748b' }}>
                      {eng}
                    </span>
                  </div>
                </div>
                <span className="text-lg font-bold tabular-nums" style={{
                  color: gaugeColor,
                  minWidth: '2.5rem',
                  textAlign: 'right',
                }}>
                  {val}
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>{desc}</p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] shrink-0" style={{ color: '#64748b' }}>낮음</span>
                <div className="relative flex-1">
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full"
                    style={{ background: 'rgba(30, 41, 59, 0.8)' }} />
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 h-2 rounded-full transition-all duration-150"
                    style={{ width: `${val}%`, background: gaugeColor, opacity: 0.6 }} />
                  <input
                    type="range" min="0" max="100" step="5"
                    value={val}
                    onChange={(e) => onChange(key, Number(e.target.value))}
                    className="slider-track relative w-full"
                    style={{ background: 'transparent' }}
                  />
                </div>
                <span className="text-[10px] shrink-0" style={{ color: '#64748b' }}>높음</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

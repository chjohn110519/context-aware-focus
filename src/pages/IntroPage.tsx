import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getConditionLabel } from '../utils/assignment';
import type { Condition } from '../types/session';

const conditionThemes: Record<Condition, {
  bg: string;
  cardBg: string;
  cardBorder: string;
  infoBg: string;
  infoBorder: string;
  labelColor: string;
  textColor: string;
  strongColor: string;
  warnBg: string;
  warnBorder: string;
  warnTitle: string;
  warnText: string;
  btnGradient: string;
}> = {
  c1: {
    bg: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
    cardBg: 'rgba(50, 50, 50, 0.6)',
    cardBorder: '1px solid rgba(150, 150, 150, 0.2)',
    infoBg: 'rgba(40, 40, 40, 0.6)',
    infoBorder: '1px solid rgba(150, 150, 150, 0.15)',
    labelColor: '#999',
    textColor: '#ccc',
    strongColor: '#fff',
    warnBg: 'rgba(239, 68, 68, 0.1)',
    warnBorder: '1px solid rgba(239, 68, 68, 0.2)',
    warnTitle: '#fca5a5',
    warnText: 'rgba(252, 165, 165, 0.7)',
    btnGradient: 'linear-gradient(135deg, #666, #888)',
  },
  c2: {
    bg: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0a0e1a 100%)',
    cardBg: 'rgba(17, 24, 39, 0.7)',
    cardBorder: '1px solid rgba(59, 130, 246, 0.2)',
    infoBg: 'rgba(15, 23, 42, 0.6)',
    infoBorder: '1px solid rgba(59, 130, 246, 0.15)',
    labelColor: '#60a5fa',
    textColor: '#94a3b8',
    strongColor: '#e2e8f0',
    warnBg: 'rgba(239, 68, 68, 0.1)',
    warnBorder: '1px solid rgba(239, 68, 68, 0.2)',
    warnTitle: '#fca5a5',
    warnText: 'rgba(252, 165, 165, 0.7)',
    btnGradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
  },
  c3: {
    bg: 'linear-gradient(135deg, #0f1a0a 0%, #1a2e14 50%, #0f1a0a 100%)',
    cardBg: 'rgba(26, 46, 20, 0.7)',
    cardBorder: '1px solid rgba(74, 222, 128, 0.2)',
    infoBg: 'rgba(15, 30, 10, 0.6)',
    infoBorder: '1px solid rgba(74, 222, 128, 0.15)',
    labelColor: '#86efac',
    textColor: '#8faa7e',
    strongColor: '#d4e7cb',
    warnBg: 'rgba(239, 68, 68, 0.1)',
    warnBorder: '1px solid rgba(239, 68, 68, 0.2)',
    warnTitle: '#fca5a5',
    warnText: 'rgba(252, 165, 165, 0.7)',
    btnGradient: 'linear-gradient(135deg, #16a34a, #4ade80)',
  },
};

export default function IntroPage() {
  const { state } = useSession();
  const navigate = useNavigate();

  if (!state.assignment || !state.participantId) {
    return (
      <div className="experimenter-bg flex items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-4">세션 정보가 없습니다.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>돌아가기</button>
        </div>
      </div>
    );
  }

  const currentCondition = state.assignment.order[state.currentSessionIndex];
  const currentSet = state.assignment.sets[state.currentSessionIndex];
  const theme = conditionThemes[currentCondition];

  const handleStart = () => {
    navigate(`/session/${currentCondition}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
      <div className="w-full max-w-2xl mx-auto p-8">
        <div className="card fade-in" style={{
          background: theme.cardBg,
          backdropFilter: 'blur(16px)',
          border: theme.cardBorder,
        }}>
          <h1 className="text-2xl font-bold mb-6" style={{ color: theme.strongColor }}>
            📋 실험 안내
          </h1>

          <div className="space-y-4 text-sm leading-relaxed mb-8" style={{ color: theme.textColor }}>
            <p>
              이 실험은 학습 집중 유도 인터페이스의 효과를 연구합니다.
              총 <strong style={{ color: theme.strongColor }}>3개의 세션</strong>을 진행하며,
              각 세션은 <strong style={{ color: theme.strongColor }}>10분</strong>간 인간공학 문제를 풀게 됩니다.
            </p>

            <div className="p-4 rounded-xl" style={{
              background: theme.infoBg,
              border: theme.infoBorder,
            }}>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: theme.labelColor }}>
                현재 세션 정보
              </p>
              <div className="space-y-1" style={{ color: theme.textColor }}>
                <p>피험자 번호: <strong style={{ color: theme.strongColor }}>#{state.participantId}</strong></p>
                <p>세션: <strong style={{ color: theme.strongColor }}>{state.currentSessionIndex + 1} / 3</strong></p>
                <p>조건: <strong style={{ color: theme.strongColor }}>{getConditionLabel(currentCondition)}</strong></p>
                <p>문제 세트: <strong style={{ color: theme.strongColor }}>{currentSet}</strong></p>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{
              background: theme.warnBg,
              border: theme.warnBorder,
            }}>
              <p className="text-xs font-semibold mb-1" style={{ color: theme.warnTitle }}>⚠️ 주의사항</p>
              <ul className="text-xs space-y-1 list-disc list-inside" style={{ color: theme.warnText }}>
                <li>시작 후 10분간 브라우저 창을 닫지 마세요.</li>
                <li>다른 탭이나 창으로 전환하지 마세요.</li>
                <li>실험 진행 중 질문이 있으면 실험자에게 문의하세요.</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all"
            style={{
              background: theme.btnGradient,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            세션 시작 →
          </button>
        </div>
      </div>
    </div>
  );
}

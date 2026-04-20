import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getConditionLabel } from '../utils/assignment';
import { exportSessionLog } from '../utils/logExporter';
import type { Condition, QuestionSetId } from '../types/session';

const conditionEmoji: Record<Condition, string> = {
  c1: '⏱️',
  c2: '🤖',
  c3: '🌳',
};

export default function SessionCompletePage() {
  const { condition } = useParams<{ condition: string }>();
  const navigate = useNavigate();
  const { state } = useSession();
  const cond = condition as Condition;
  const [downloaded, setDownloaded] = useState(false);

  const currentSetId = state.assignment?.sets[state.currentSessionIndex] ?? 'A';
  const answeredCount = state.eventLog.filter(e => e.type === 'question_answered').length;

  const handleRedownload = () => {
    if (state.participantId && state.assignment) {
      exportSessionLog(
        state.participantId,
        cond,
        currentSetId as QuestionSetId,
        state.currentSessionIndex + 1,
        state.eventLog,
        8 // total questions per set
      );
      setDownloaded(true);
    }
  };

  const handleGoToSurvey = () => {
    navigate(`/session/survey/${cond}`);
  };

  // Condition-specific theme backgrounds
  const themeStyles: Record<Condition, { bg: string; accent: string; accentLight: string }> = {
    c1: {
      bg: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
      accent: '#888888',
      accentLight: 'rgba(136, 136, 136, 0.2)',
    },
    c2: {
      bg: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0a0e1a 100%)',
      accent: '#3b82f6',
      accentLight: 'rgba(59, 130, 246, 0.2)',
    },
    c3: {
      bg: 'linear-gradient(135deg, #0f1a0a 0%, #1a2e14 50%, #0f1a0a 100%)',
      accent: '#4ade80',
      accentLight: 'rgba(74, 222, 128, 0.2)',
    },
  };

  const theme = themeStyles[cond] ?? themeStyles.c1;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
      <div className="max-w-lg w-full mx-4 p-8 fade-in">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{conditionEmoji[cond] ?? '✅'}</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            세션 완료!
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {getConditionLabel(cond)} 세션이 종료되었습니다.
          </p>
        </div>

        {/* Session Summary Card */}
        <div className="card mb-6" style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${theme.accentLight}`,
        }}>
          <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: theme.accent }}>
            세션 요약
          </h3>
          <div className="space-y-2 text-sm text-white/80">
            <div className="flex justify-between">
              <span>피험자 번호</span>
              <span className="font-bold text-white">#{state.participantId}</span>
            </div>
            <div className="flex justify-between">
              <span>조건</span>
              <span className="font-bold text-white">{cond.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>문제 세트</span>
              <span className="font-bold text-white">세트 {currentSetId}</span>
            </div>
            <div className="flex justify-between">
              <span>답변한 문제</span>
              <span className="font-bold text-white">{answeredCount} / 8</span>
            </div>
            <div className="flex justify-between">
              <span>세션 순서</span>
              <span className="font-bold text-white">{state.currentSessionIndex + 1} / 3</span>
            </div>
          </div>
        </div>

        {/* Re-download Button */}
        <div className="card mb-6" style={{
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${theme.accentLight}`,
        }}>
          <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
            로그 파일이 자동 다운로드되지 않았다면 아래 버튼을 사용하세요.
          </p>
          <button
            onClick={handleRedownload}
            className="w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: theme.accentLight,
              border: `1px solid ${theme.accent}40`,
              color: theme.accent,
              cursor: 'pointer',
            }}
          >
            {downloaded ? '✅ 다운로드 완료' : '📥 로그 파일 재다운로드'}
          </button>
        </div>

        {/* Go to Survey */}
        <button
          onClick={handleGoToSurvey}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all"
          style={{
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`,
            color: '#000',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'translateY(0)'; }}
        >
          설문으로 이동 →
        </button>
      </div>
    </div>
  );
}

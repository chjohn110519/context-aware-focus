import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getConditionLabel } from '../utils/assignment';
import NasaTlx from '../components/survey/NasaTlx';
import LikertScale from '../components/survey/LikertScale';
import type { SurveyAnswer, Condition } from '../types/session';

const likertQuestions = [
  { id: 'flow1', label: '이 세션 동안 과제에 몰입했다고 느꼈습니다.' },
  { id: 'flow2', label: '시간이 빠르게 지나갔다고 느꼈습니다.' },
  { id: 'flow3', label: '외부 방해 요소에 쉽게 주의를 빼앗겼습니다.', lowLabel: '매우 그렇다', highLabel: '매우 그렇지 않다' },
  { id: 'stress', label: '이 세션 동안 스트레스를 느꼈습니다.' },
  { id: 'ux1', label: '이 인터페이스는 학습에 도움이 되었습니다.' },
  { id: 'ux2', label: '이 인터페이스는 사용하기 편리했습니다.' },
  { id: 'continue', label: '이 인터페이스를 지속적으로 사용하고 싶습니다.' },
  { id: 'achieve', label: '이 세션에서 성취감을 느꼈습니다.' },
  { id: 'motivation', label: '이 인터페이스가 학습 동기를 높여주었습니다.' },
  { id: 'enjoyment', label: '이 세션을 즐겁게 진행했습니다.' },
];

const conditionColors: Record<Condition, { accent: string; accentBg: string }> = {
  c1: { accent: '#94a3b8', accentBg: 'rgba(148, 163, 184, 0.15)' },
  c2: { accent: '#60a5fa', accentBg: 'rgba(96, 165, 250, 0.15)' },
  c3: { accent: '#4ade80', accentBg: 'rgba(74, 222, 128, 0.15)' },
};

export default function SurveyPage() {
  const { condition } = useParams<{ condition: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useSession();
  const cond = (condition ?? 'c1') as Condition;
  const colors = conditionColors[cond] ?? conditionColors.c1;

  const [nasaTlxValues, setNasaTlxValues] = useState<Record<string, number>>({
    mental: 50, physical: 50, temporal: 50,
    performance: 50, effort: 50, frustration: 50,
  });

  const [likertValues, setLikertValues] = useState<Record<string, number | null>>({});

  const handleNasaChange = (key: string, value: number) => {
    setNasaTlxValues(prev => ({ ...prev, [key]: value }));
  };

  const handleLikertChange = (questionId: string, value: number) => {
    setLikertValues(prev => ({ ...prev, [questionId]: value }));
  };

  const answeredCount = Object.values(likertValues).filter(v => v !== null && v !== undefined).length;
  const allLikertAnswered = likertQuestions.every(q => likertValues[q.id] !== undefined && likertValues[q.id] !== null);

  const handleSubmit = () => {
    const answers: SurveyAnswer[] = [
      ...Object.entries(nasaTlxValues).map(([key, value]) => ({
        questionId: `nasa_${key}`,
        value,
      })),
      ...Object.entries(likertValues).map(([key, value]) => ({
        questionId: key,
        value: value ?? 0,
      })),
    ];

    dispatch({ type: 'SAVE_SURVEY', condition: condition ?? '', answers });
    dispatch({ type: 'NEXT_SESSION' });

    if (state.currentSessionIndex < 2) {
      navigate('/session/intro');
    } else {
      navigate('/session/final-survey');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3"
            style={{ background: colors.accentBg, color: colors.accent }}>
            {getConditionLabel(cond)} · 세션 {state.currentSessionIndex + 1} / 3
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">세션 사후 설문</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            방금 완료한 세션에 대한 경험을 평가해주세요
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-6 p-3 rounded-xl fade-in" style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(51, 65, 85, 0.3)',
        }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>설문 진행률</span>
            <span className="text-xs font-bold" style={{ color: '#818cf8' }}>
              {answeredCount + 6} / {likertQuestions.length + 6}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(30, 41, 59, 0.8)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${((answeredCount + 6) / (likertQuestions.length + 6)) * 100}%`,
                background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              }} />
          </div>
        </div>

        <div className="space-y-6 fade-in">
          {/* NASA-TLX Section */}
          <div className="p-5 rounded-2xl" style={{
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(51, 65, 85, 0.3)',
            backdropFilter: 'blur(12px)',
          }}>
            <NasaTlx values={nasaTlxValues} onChange={handleNasaChange} />
          </div>

          {/* Likert Questions Section */}
          <div className="p-5 rounded-2xl" style={{
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(51, 65, 85, 0.3)',
            backdropFilter: 'blur(12px)',
          }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'rgba(129, 140, 248, 0.2)', color: '#818cf8' }}>
                💬
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: '#e2e8f0' }}>
                  주관적 경험 평가
                </h3>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  1~5점으로 해당하는 정도를 선택해주세요
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {likertQuestions.map((q, idx) => (
                <LikertScale
                  key={q.id}
                  questionId={q.id}
                  label={q.label}
                  value={likertValues[q.id] ?? null}
                  onChange={handleLikertChange}
                  index={idx}
                  lowLabel={'lowLabel' in q ? (q as { lowLabel: string }).lowLabel : undefined}
                  highLabel={'highLabel' in q ? (q as { highLabel: string }).highLabel : undefined}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="text-center pt-2 pb-8">
            <button
              className="py-4 px-16 rounded-xl font-bold text-base transition-all"
              disabled={!allLikertAnswered}
              onClick={handleSubmit}
              style={{
                background: allLikertAnswered
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(51, 65, 85, 0.3)',
                color: allLikertAnswered ? '#fff' : '#475569',
                cursor: allLikertAnswered ? 'pointer' : 'not-allowed',
                border: 'none',
                boxShadow: allLikertAnswered ? '0 8px 24px rgba(99, 102, 241, 0.3)' : 'none',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                if (allLikertAnswered) (e.target as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              {state.currentSessionIndex < 2 ? '다음 세션으로 →' : '최종 설문으로 →'}
            </button>
            {!allLikertAnswered && (
              <p className="text-xs mt-3" style={{ color: '#ef444488' }}>
                미응답 {likertQuestions.length - answeredCount}개 문항이 남아있습니다
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

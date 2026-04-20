import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import NasaTlx from '../components/survey/NasaTlx';
import LikertScale from '../components/survey/LikertScale';
import type { SurveyAnswer } from '../types/session';

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

export default function SurveyPage() {
  const { condition } = useParams<{ condition: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useSession();

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

    // Check if there are more sessions
    if (state.currentSessionIndex < 2) {
      navigate('/session/intro');
    } else {
      navigate('/session/final-survey');
    }
  };

  return (
    <div className="min-h-screen py-10 px-4" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 fade-in">
          <h1 className="text-2xl font-bold text-white mb-2">
            📝 세션 사후 설문
          </h1>
          <p className="text-indigo-300 text-sm">
            조건 {condition?.toUpperCase()} · 세션 {state.currentSessionIndex + 1} / 3
          </p>
        </div>

        <div className="space-y-6 fade-in">
          {/* NASA-TLX */}
          <NasaTlx values={nasaTlxValues} onChange={handleNasaChange} />

          {/* Likert Questions */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">주관적 평가</h3>
            {likertQuestions.map((q) => (
              <LikertScale
                key={q.id}
                questionId={q.id}
                label={q.label}
                value={likertValues[q.id] ?? null}
                onChange={handleLikertChange}
              />
            ))}
          </div>

          {/* Submit */}
          <div className="text-center pt-4 pb-8">
            <button
              className="py-4 px-12 rounded-xl font-bold text-lg transition-all"
              disabled={!allLikertAnswered}
              onClick={handleSubmit}
              style={{
                background: allLikertAnswered
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(100, 100, 100, 0.3)',
                color: allLikertAnswered ? '#fff' : '#666',
                cursor: allLikertAnswered ? 'pointer' : 'not-allowed',
                border: 'none',
              }}
            >
              {state.currentSessionIndex < 2 ? '다음 세션으로 →' : '최종 설문으로 →'}
            </button>
            {!allLikertAnswered && (
              <p className="text-red-400/70 text-xs mt-2">모든 문항에 응답해주세요</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

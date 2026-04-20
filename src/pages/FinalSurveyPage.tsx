import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import type { Condition } from '../types/session';

const conditionLabels: Record<Condition, string> = {
  c1: 'C1: 시간 기반 (타이머만)',
  c2: 'C2: AI 경고 메시지',
  c3: 'C3: 나무 성장 피드백',
};

export default function FinalSurveyPage() {
  const navigate = useNavigate();
  const { state } = useSession();
  const [preferred, setPreferred] = useState<Condition | null>(null);
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');

  const handleSubmit = () => {
    // Save final survey to localStorage for backup
    const finalData = {
      participantId: state.participantId,
      preferred,
      reason,
      comments,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('caf_final_survey', JSON.stringify(finalData));

    // Also trigger download
    const blob = new Blob([JSON.stringify(finalData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `p${String(state.participantId).padStart(2, '0')}_final_survey.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    navigate('/session/done');
  };

  return (
    <div className="min-h-screen py-10 px-4" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 fade-in">
          <h1 className="text-2xl font-bold text-white mb-2">🏁 최종 비교 설문</h1>
          <p className="text-indigo-300 text-sm">
            세 가지 조건을 모두 경험하셨습니다. 비교 의견을 남겨주세요.
          </p>
        </div>

        <div className="space-y-6 fade-in">
          {/* Preference */}
          <div className="card" style={{
            background: 'rgba(30, 27, 75, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(129, 140, 248, 0.2)',
          }}>
            <h3 className="text-white font-semibold mb-4">
              가장 학습에 도움이 된 조건을 선택해주세요
            </h3>
            <div className="space-y-3">
              {(['c1', 'c2', 'c3'] as Condition[]).map((cond) => (
                <label
                  key={cond}
                  className={`option-label ${preferred === cond ? 'selected' : ''}`}
                  style={{
                    borderColor: preferred === cond ? '#818cf8' : 'rgba(129, 140, 248, 0.2)',
                    color: '#e0e7ff',
                  }}
                >
                  <input
                    type="radio"
                    name="preference"
                    value={cond}
                    checked={preferred === cond}
                    onChange={() => setPreferred(cond)}
                    style={{ accentColor: '#818cf8' }}
                  />
                  <span>{conditionLabels[cond]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="card" style={{
            background: 'rgba(30, 27, 75, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(129, 140, 248, 0.2)',
          }}>
            <h3 className="text-white font-semibold mb-3">선택 이유를 자유롭게 작성해주세요</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full p-4 rounded-xl outline-none resize-none"
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(129, 140, 248, 0.2)',
                color: '#e0e7ff',
                fontFamily: 'var(--font-family)',
              }}
              placeholder="해당 조건이 학습에 도움이 되었던 이유를 적어주세요..."
            />
          </div>

          {/* Comments */}
          <div className="card" style={{
            background: 'rgba(30, 27, 75, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(129, 140, 248, 0.2)',
          }}>
            <h3 className="text-white font-semibold mb-3">
              실험에 대한 추가 코멘트 <span className="text-indigo-400 text-xs">(선택)</span>
            </h3>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full p-4 rounded-xl outline-none resize-none"
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(129, 140, 248, 0.2)',
                color: '#e0e7ff',
                fontFamily: 'var(--font-family)',
              }}
              placeholder="자유롭게 의견을 남겨주세요..."
            />
          </div>

          {/* Submit */}
          <div className="text-center pt-4 pb-8">
            <button
              className="py-4 px-12 rounded-xl font-bold text-lg transition-all"
              disabled={!preferred || !reason.trim()}
              onClick={handleSubmit}
              style={{
                background: preferred && reason.trim()
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(100, 100, 100, 0.3)',
                color: preferred && reason.trim() ? '#fff' : '#666',
                cursor: preferred && reason.trim() ? 'pointer' : 'not-allowed',
                border: 'none',
              }}
            >
              제출 완료 →
            </button>
            {(!preferred || !reason.trim()) && (
              <p className="text-red-400/70 text-xs mt-2">
                선호 조건 선택 및 이유 작성이 필요합니다
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

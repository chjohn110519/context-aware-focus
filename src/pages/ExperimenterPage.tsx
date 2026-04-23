import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getAssignment, getConditionLabel } from '../utils/assignment';
import { MAX_PARTICIPANTS } from '../utils/constants';

export default function ExperimenterPage() {
  const [participantId, setParticipantId] = useState<string>('');
  const { dispatch } = useSession();
  const navigate = useNavigate();

  const id = Number(participantId);
  const isValid = id >= 1 && id <= MAX_PARTICIPANTS && Number.isInteger(id);
  const assignment = isValid ? getAssignment(id) : null;

  const handleStart = () => {
    if (!isValid || !assignment) return;
    dispatch({ type: 'SET_PARTICIPANT', participantId: id, assignment });
    navigate('/upload');
  };

  return (
    <div className="experimenter-bg">
      <div className="w-full max-w-lg mx-auto p-8">
        <div className="text-center mb-10 fade-in">
          <h1 className="text-3xl font-bold text-white mb-2">
            🧪 Context-Aware Focus
          </h1>
          <p className="text-indigo-300 text-sm">
            IMEN 343 Term Project — 실험 관리 시스템
          </p>
        </div>

        <div className="card fade-in" style={{
          background: 'rgba(30, 27, 75, 0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(129, 140, 248, 0.2)',
        }}>
          {/* 피험자 번호 */}
          <label className="block text-indigo-200 text-sm font-semibold mb-2">
            피험자 번호
          </label>
          <input
            type="number"
            min="1"
            max={MAX_PARTICIPANTS}
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            className="w-full p-4 rounded-xl text-2xl text-center font-bold outline-none transition-all"
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '2px solid rgba(129, 140, 248, 0.3)',
              color: '#e0e7ff',
            }}
            placeholder={`1 ~ ${MAX_PARTICIPANTS}`}
            onFocus={(e) => { e.target.style.borderColor = '#818cf8'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(129, 140, 248, 0.3)'; }}
          />

          {/* 배정 정보 */}
          {assignment && (
            <div className="mt-6 p-4 rounded-xl slide-down" style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(129, 140, 248, 0.15)',
            }}>
              <h3 className="text-indigo-300 text-xs font-semibold mb-3 uppercase tracking-wider">
                배정 정보
              </h3>
              <div className="space-y-2">
                {assignment.order.map((cond, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-indigo-400">세션 {idx + 1}</span>
                    <span className="text-white font-medium">
                      {getConditionLabel(cond)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{ background: 'rgba(129, 140, 248, 0.2)', color: '#a5b4fc' }}>
                      PDF {assignment.sets[idx]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all"
            disabled={!isValid}
            onClick={handleStart}
            style={{
              background: isValid
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(100, 100, 100, 0.3)',
              color: isValid ? '#fff' : '#666',
              cursor: isValid ? 'pointer' : 'not-allowed',
              border: 'none',
            }}
            onMouseEnter={(e) => { if (isValid) (e.target as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            PDF 업로드로 이동 →
          </button>
        </div>

        <p className="text-center text-indigo-400/50 text-xs mt-6">
          Team #8 · POSTECH IMEN 343
        </p>
      </div>
    </div>
  );
}

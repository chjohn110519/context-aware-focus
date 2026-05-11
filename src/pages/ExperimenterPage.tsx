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
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#111111' }}>
            🧪 Context-Aware Focus
          </h1>
          <p className="text-sm" style={{ color: '#555555' }}>
            IMEN 343 Term Project — 실험 관리 시스템
          </p>
        </div>

        <div className="card fade-in" style={{
          background: '#ffffff',
          border: '1px solid #cccccc',
        }}>
          {/* 피험자 번호 */}
          <label className="block text-sm font-semibold mb-2" style={{ color: '#111111' }}>
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
              background: '#f5f5f5',
              border: '2px solid #cccccc',
              color: '#111111',
            }}
            placeholder={`1 ~ ${MAX_PARTICIPANTS}`}
            onFocus={(e) => { e.target.style.borderColor = '#555555'; }}
            onBlur={(e) => { e.target.style.borderColor = '#cccccc'; }}
          />

          {/* 배정 정보 */}
          {assignment && (
            <div className="mt-6 p-4 rounded-xl slide-down" style={{
              background: '#f5f5f5',
              border: '1px solid #cccccc',
            }}>
              <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#555555' }}>
                배정 정보
              </h3>
              <div className="space-y-2">
                {assignment.order.map((cond, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span style={{ color: '#555555' }}>세션 {idx + 1}</span>
                    <span className="font-medium" style={{ color: '#111111' }}>
                      {getConditionLabel(cond)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{ background: '#eeeeee', color: '#333333', border: '1px solid #cccccc' }}>
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
              background: isValid ? '#111111' : '#dddddd',
              color: isValid ? '#ffffff' : '#999999',
              cursor: isValid ? 'pointer' : 'not-allowed',
              border: 'none',
            }}
            onMouseEnter={(e) => { if (isValid) (e.target as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            PDF 업로드로 이동 →
          </button>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#aaaaaa' }}>
          Team #8 · POSTECH IMEN 343
        </p>
      </div>
    </div>
  );
}

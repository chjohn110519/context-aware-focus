import { useState } from 'react';
import JSZip from 'jszip';
import { useSession } from '../context/SessionContext';
import { LOCAL_STORAGE_KEY } from '../utils/constants';

export default function DonePage() {
  const { state } = useSession();
  const [zipDownloading, setZipDownloading] = useState(false);
  const [jsonDownloaded, setJsonDownloaded] = useState(false);

  const handleDownloadJson = () => {
    try {
      const eventLog = localStorage.getItem(LOCAL_STORAGE_KEY);
      const finalSurvey = localStorage.getItem('caf_final_survey');

      const allData = {
        participantId: state.participantId,
        exportedAt: new Date().toISOString(),
        eventLog: eventLog ? JSON.parse(eventLog) : [],
        finalSurvey: finalSurvey ? JSON.parse(finalSurvey) : null,
        surveyResponses: state.surveyResponses,
      };

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `p${String(state.participantId).padStart(2, '0')}_all_data_backup.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setJsonDownloaded(true);
    } catch (err) {
      console.error('Download failed:', err);
      alert('다운로드 실패. 실험자에게 문의하세요.');
    }
  };

  const handleDownloadZip = async () => {
    setZipDownloading(true);
    try {
      const zip = new JSZip();
      const pid = String(state.participantId).padStart(2, '0');
      const folder = zip.folder(`participant_${pid}`) ?? zip;

      // Event logs
      const eventLog = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (eventLog) {
        folder.file('event_log.json', eventLog);
      }

      // Survey responses per condition
      for (const [condition, answers] of Object.entries(state.surveyResponses)) {
        folder.file(`survey_${condition}.json`, JSON.stringify(answers, null, 2));
      }

      // Final survey
      const finalSurvey = localStorage.getItem('caf_final_survey');
      if (finalSurvey) {
        folder.file('final_survey.json', finalSurvey);
      }

      // Session state snapshot
      folder.file('session_state.json', JSON.stringify({
        participantId: state.participantId,
        assignment: state.assignment,
        completedSessions: state.completedSessions,
        exportedAt: new Date().toISOString(),
      }, null, 2));

      // Metadata
      folder.file('README.txt',
        `Context-Aware Focus Experiment Data\n` +
        `Participant: #${state.participantId}\n` +
        `Exported: ${new Date().toLocaleString('ko-KR')}\n` +
        `\n` +
        `Files:\n` +
        `- event_log.json: All session events\n` +
        `- survey_cX.json: Post-condition survey responses\n` +
        `- final_survey.json: Final comparison survey\n` +
        `- session_state.json: Session metadata\n`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `p${pid}_experiment_data.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Zip download failed:', err);
      alert('ZIP 다운로드 실패. JSON 백업을 사용해주세요.');
    } finally {
      setZipDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    }}>
      <div className="text-center max-w-lg mx-auto p-8 fade-in">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-4">
          실험이 완료되었습니다!
        </h1>
        <p className="text-indigo-300 mb-8 leading-relaxed">
          참여해주셔서 감사합니다.<br />
          모든 데이터가 성공적으로 기록되었습니다.
        </p>

        <div className="space-y-4 mb-6">
          {/* ZIP Download (Primary) */}
          <div className="card" style={{
            background: 'rgba(30, 27, 75, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
          }}>
            <p className="text-indigo-200 text-sm mb-3">
              모든 실험 데이터를 하나의 ZIP 파일로 다운로드하세요.
            </p>
            <button
              onClick={handleDownloadZip}
              disabled={zipDownloading}
              className="w-full py-3 rounded-xl font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                cursor: zipDownloading ? 'wait' : 'pointer',
                opacity: zipDownloading ? 0.7 : 1,
              }}
            >
              {zipDownloading ? '⏳ ZIP 생성 중...' : '📦 통합 ZIP 다운로드'}
            </button>
          </div>

          {/* JSON Backup (Secondary) */}
          <div className="card" style={{
            background: 'rgba(30, 27, 75, 0.4)',
            border: '1px solid rgba(129, 140, 248, 0.15)',
          }}>
            <p className="text-indigo-300/70 text-xs mb-2">
              ZIP이 안 될 경우 JSON 백업
            </p>
            <button
              onClick={handleDownloadJson}
              className="w-full py-2 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: 'rgba(129, 140, 248, 0.15)',
                border: '1px solid rgba(129, 140, 248, 0.2)',
                color: '#a5b4fc',
                cursor: 'pointer',
              }}
            >
              {jsonDownloaded ? '✅ JSON 다운로드 완료' : '📄 JSON 백업 다운로드'}
            </button>
          </div>
        </div>

        <p className="text-indigo-400/40 text-xs">
          피험자 #{state.participantId} · {new Date().toLocaleDateString('ko-KR')}
        </p>
      </div>
    </div>
  );
}

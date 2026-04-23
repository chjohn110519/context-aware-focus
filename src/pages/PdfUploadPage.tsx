import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { generateStudyMaterial, generateQuiz } from '../utils/aiGenerator';
import type { PdfSetData, QuestionSetId } from '../types/session';
import { PDF_STORAGE_KEY } from '../utils/constants';

interface PdfSlot {
  file: File | null;
  filename: string;
  status: 'empty' | 'uploaded' | 'extracting' | 'generating' | 'done' | 'error';
  progress: string;
  text?: string;
}

const SET_LABELS: { id: QuestionSetId; label: string; color: string }[] = [
  { id: 'A', label: 'PDF A', color: '#818cf8' },
  { id: 'B', label: 'PDF B', color: '#60a5fa' },
  { id: 'C', label: 'PDF C', color: '#4ade80' },
];

export default function PdfUploadPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useSession();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [slots, setSlots] = useState<PdfSlot[]>([
    { file: null, filename: '', status: 'empty', progress: '' },
    { file: null, filename: '', status: 'empty', progress: '' },
    { file: null, filename: '', status: 'empty', progress: '' },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const updateSlot = useCallback((index: number, updates: Partial<PdfSlot>) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  }, []);

  const handleFileSelect = useCallback((index: number, file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      updateSlot(index, { status: 'error', progress: 'PDF 파일만 업로드 가능합니다.' });
      return;
    }
    updateSlot(index, {
      file,
      filename: file.name,
      status: 'uploaded',
      progress: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    });
  }, [updateSlot]);

  const handleDrop = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(index, file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const allUploaded = slots.every(s => s.status === 'uploaded' || s.status === 'done');
  const allDone = slots.every(s => s.status === 'done');

  const handleProcess = async () => {
    setIsProcessing(true);
    setGlobalError(null);

    const pdfData: PdfSetData = { A: null, B: null, C: null };

    for (let i = 0; i < 3; i++) {
      const slot = slots[i];
      const setId = SET_LABELS[i].id;

      if (!slot.file) continue;

      try {
        // Step 1: PDF 텍스트 추출
        updateSlot(i, { status: 'extracting', progress: '📄 PDF 텍스트 추출 중...' });
        const text = await extractTextFromPdf(slot.file);
        updateSlot(i, { text, progress: `✅ 텍스트 추출 완료 (${text.length.toLocaleString()}자)` });

        // Step 2: AI 학습자료 생성
        updateSlot(i, { status: 'generating', progress: '🤖 AI 학습자료 생성 중...' });
        const study = await generateStudyMaterial(text, slot.filename);
        updateSlot(i, { progress: '📝 AI 퀴즈 생성 중...' });

        // Step 3: AI 퀴즈 생성
        const quiz = await generateQuiz(text, setId);

        pdfData[setId] = { study, quiz };
        updateSlot(i, { status: 'done', progress: `✅ 완료! (섹션 ${study.sections.length}개, 문제 ${quiz.questions.length}개)` });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
        updateSlot(i, { status: 'error', progress: `❌ 오류: ${errorMsg}` });
        setGlobalError(`PDF ${setId} 처리 실패: ${errorMsg}`);
        setIsProcessing(false);
        return;
      }
    }

    // 모든 PDF 처리 완료 → 상태 저장
    dispatch({ type: 'SET_PDF_DATA', pdfData });

    // localStorage에도 백업 저장
    try {
      localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(pdfData));
    } catch {
      // 용량 초과 시 무시
    }

    setIsProcessing(false);
  };

  const handleContinue = () => {
    navigate('/session/intro');
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 fade-in">
          <h1 className="text-2xl font-bold text-white mb-2">📚 학습 자료 업로드</h1>
          <p className="text-indigo-300 text-sm">
            PDF 3개를 업로드하면 AI가 학습자료와 퀴즈를 자동 생성합니다
          </p>
          <p className="text-indigo-400/60 text-xs mt-1">
            피험자 #{state.participantId} · 각 PDF가 세트 A, B, C에 독립 매핑됩니다
          </p>
        </div>

        {/* PDF Upload Slots */}
        <div className="space-y-4 mb-8">
          {SET_LABELS.map((set, idx) => {
            const slot = slots[idx];
            const isDone = slot.status === 'done';
            const isActive = slot.status === 'extracting' || slot.status === 'generating';

            return (
              <div
                key={set.id}
                className="p-5 rounded-2xl transition-all fade-in"
                style={{
                  animationDelay: `${idx * 0.1}s`,
                  background: isDone
                    ? 'rgba(74, 222, 128, 0.08)'
                    : isActive
                      ? 'rgba(129, 140, 248, 0.08)'
                      : 'rgba(15, 23, 42, 0.5)',
                  border: `1px solid ${isDone
                    ? 'rgba(74, 222, 128, 0.3)'
                    : isActive
                      ? 'rgba(129, 140, 248, 0.3)'
                      : 'rgba(51, 65, 85, 0.3)'}`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: `${set.color}20`, color: set.color }}>
                    {set.id}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
                      {set.label}
                    </h3>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      {slot.filename || '파일을 선택하세요'}
                    </p>
                  </div>
                  {slot.status !== 'empty' && (
                    <span className="text-xs px-2 py-1 rounded-md" style={{
                      background: isDone ? 'rgba(74, 222, 128, 0.15)' : 'rgba(129, 140, 248, 0.15)',
                      color: isDone ? '#4ade80' : '#818cf8',
                    }}>
                      {slot.progress}
                    </span>
                  )}
                </div>

                {/* Drop Zone / File Input */}
                {(slot.status === 'empty' || slot.status === 'uploaded' || slot.status === 'error') && (
                  <div
                    className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-indigo-400"
                    style={{
                      borderColor: slot.status === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(51, 65, 85, 0.4)',
                      background: 'rgba(15, 23, 42, 0.3)',
                    }}
                    onDrop={(e) => handleDrop(idx, e)}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRefs.current[idx]?.click()}
                  >
                    <input
                      ref={(el) => { fileInputRefs.current[idx] = el; }}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(idx, f);
                      }}
                    />
                    <p className="text-sm" style={{ color: '#94a3b8' }}>
                      {slot.file ? `📄 ${slot.filename}` : '📂 클릭 또는 드래그하여 PDF 업로드'}
                    </p>
                    {slot.status === 'error' && (
                      <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{slot.progress}</p>
                    )}
                  </div>
                )}

                {/* Processing Indicator */}
                {isActive && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{
                    background: 'rgba(129, 140, 248, 0.1)',
                  }}>
                    <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: `${set.color} transparent ${set.color} ${set.color}` }} />
                    <span className="text-sm" style={{ color: '#a5b4fc' }}>{slot.progress}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error Display */}
        {globalError && (
          <div className="mb-6 p-4 rounded-xl" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <p className="text-sm" style={{ color: '#fca5a5' }}>⚠️ {globalError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {!allDone && (
            <button
              className="flex-1 py-4 rounded-xl font-bold text-lg transition-all"
              disabled={!allUploaded || isProcessing}
              onClick={handleProcess}
              style={{
                background: allUploaded && !isProcessing
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(100, 100, 100, 0.3)',
                color: allUploaded && !isProcessing ? '#fff' : '#666',
                cursor: allUploaded && !isProcessing ? 'pointer' : 'not-allowed',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                if (allUploaded && !isProcessing) (e.target as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              {isProcessing ? '🤖 AI 처리 중...' : '🚀 AI 학습자료 & 퀴즈 생성'}
            </button>
          )}

          {allDone && (
            <button
              className="flex-1 py-4 rounded-xl font-bold text-lg transition-all"
              onClick={handleContinue}
              style={{
                background: 'linear-gradient(135deg, #16a34a, #4ade80)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              ✅ 실험 시작으로 이동 →
            </button>
          )}
        </div>

        <p className="text-center text-indigo-400/40 text-xs mt-6">
          생성된 자료는 세션 중에 학습 화면으로 제공됩니다
        </p>
      </div>
    </div>
  );
}

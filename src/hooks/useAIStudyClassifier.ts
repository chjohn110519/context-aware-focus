import { useState, useEffect, useRef, useCallback } from 'react';
import OpenAI from 'openai';
import type { GeneratedStudyMaterial } from '../types/session';
import { AI_GRACE_PERIOD_MS, AI_CLASSIFY_INTERVAL_MS } from '../utils/constants';

interface UseAIStudyClassifierOptions {
  enabled: boolean;
  studyMaterial: GeneratedStudyMaterial | null;
}

export interface AIClassifierResult {
  isStudying: boolean;
  confidence: number;
  captureActive: boolean;
  error: string | null;
  lastReason: string | null;
  requestCapture: () => Promise<void>;
}

interface JudgmentResponse {
  state?: string;
  confidence?: number;
  reason?: string;
}

function buildSystemPrompt(material: GeneratedStudyMaterial): string {
  const terms = material.terms
    .slice(0, 15)
    .map(t => t.term)
    .join(', ');
  const sections = material.sections
    .slice(0, 3)
    .map(s => s.heading)
    .join(', ');

  return `당신은 실험자의 공부 여부를 판단하는 AI입니다.

[현재 학습 자료]
제목: ${material.title}
핵심 섹션: ${sections}
주요 개념어: ${terms}

[판단 규칙]
1. 실험 웹사이트, ChatGPT/Claude/Gemini 등 AI 도구는 항상 STUDYING
2. 현재 화면 내용이 위 학습 자료와 의미적으로 관련되면 STUDYING
3. SNS, 쇼핑, 게임, 오락성 영상, 메신저면 NOT_STUDYING
4. 단순 키워드 일치가 아닌 문맥적 관련성으로 판단

반드시 아래 JSON만 응답:
{"state":"STUDYING","confidence":0.9,"reason":"판단 근거 1~2문장"}`;
}

export function useAIStudyClassifier({
  enabled,
  studyMaterial,
}: UseAIStudyClassifierOptions): AIClassifierResult {
  const [isStudying, setIsStudying] = useState(true);
  const [confidence, setConfidence] = useState(1);
  const [captureActive, setCaptureActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReason, setLastReason] = useState<string | null>(null);

  const openaiRef = useRef<OpenAI | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const graceTimerRef = useRef<number | null>(null);
  const reJudgeTimerRef = useRef<number | null>(null);
  const isHiddenRef = useRef(false);
  const isCallingRef = useRef(false);

  // captureActive는 비동기 콜백에서 최신 값이 필요하므로 ref로 동기화
  const captureActiveRef = useRef(false);
  useEffect(() => { captureActiveRef.current = captureActive; }, [captureActive]);

  // studyMaterial도 콜백에서 최신 값 참조
  const studyMaterialRef = useRef(studyMaterial);
  useEffect(() => { studyMaterialRef.current = studyMaterial; }, [studyMaterial]);

  // OpenAI 클라이언트 초기화 (enabled 시 1회)
  useEffect(() => {
    if (!enabled) return;
    const key = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    if (key) {
      openaiRef.current = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
    }
  }, [enabled]);

  // 화면 캡처 후 GPT-4o-mini Vision으로 판단
  const captureAndJudge = useCallback(async () => {
    // 화면 공유 없이 탭을 이탈한 경우: NOT_STUDYING (기본 폴백)
    if (!captureActiveRef.current) {
      setIsStudying(false);
      setConfidence(0.85);
      setLastReason('화면 공유 없이 다른 탭으로 이동함');
      return;
    }

    if (isCallingRef.current || !openaiRef.current || !studyMaterialRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    isCallingRef.current = true;
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

      const response = await openaiRef.current.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        max_tokens: 150,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(studyMaterialRef.current),
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: '현재 화면을 보고 공부 여부를 JSON으로 판단하세요.' },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'low' },
              },
            ],
          },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw) as JudgmentResponse;
      const studying = parsed.state === 'STUDYING';
      setIsStudying(studying);
      setConfidence(
        typeof parsed.confidence === 'number'
          ? parsed.confidence
          : studying ? 0.9 : 0.1
      );
      setLastReason(parsed.reason ?? null);
    } catch (err) {
      console.error('[AI Classifier] API 오류:', err);
      // 오류 시 현재 상태 유지
    } finally {
      isCallingRef.current = false;
    }
  }, []); // 의존성 없음 — 모두 ref로 접근

  // captureAndJudge ref 유지 (visibility effect에서 항상 최신 버전 사용)
  const captureAndJudgeRef = useRef(captureAndJudge);
  useEffect(() => { captureAndJudgeRef.current = captureAndJudge; }, [captureAndJudge]);

  // 탭/창 전환 감지 → 유예 시간 후 AI 판단
  useEffect(() => {
    if (!enabled) return;

    const onHide = () => {
      if (isHiddenRef.current) return;
      isHiddenRef.current = true;

      // PRD §5.5: 3초 유예 후 판단, 이후 30초마다 재판단
      graceTimerRef.current = window.setTimeout(() => {
        void captureAndJudgeRef.current();
        reJudgeTimerRef.current = window.setInterval(() => {
          void captureAndJudgeRef.current();
        }, AI_CLASSIFY_INTERVAL_MS);
      }, AI_GRACE_PERIOD_MS);
    };

    const onShow = () => {
      if (!isHiddenRef.current) return;
      isHiddenRef.current = false;

      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      if (reJudgeTimerRef.current) {
        clearInterval(reJudgeTimerRef.current);
        reJudgeTimerRef.current = null;
      }

      // 실험 웹사이트로 복귀 → 즉시 STUDYING (PRD Step 1)
      setIsStudying(true);
      setConfidence(1);
      setLastReason('실험 웹사이트로 복귀');
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        onHide();
      } else {
        onShow();
      }
    };

    // visibilitychange: 탭 전환 감지 (같은 브라우저 창 내)
    // blur/focus: 다른 앱으로 전환 감지
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onHide);
    window.addEventListener('focus', onShow);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onHide);
      window.removeEventListener('focus', onShow);
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
      if (reJudgeTimerRef.current) clearInterval(reJudgeTimerRef.current);
    };
  }, [enabled]);

  // 화면 공유 요청
  const requestCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      streamRef.current = stream;

      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      videoRef.current = video;

      // 512×512: GPT-4o-mini vision의 'low' detail 모드에 최적
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      canvasRef.current = canvas;

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
        if (reJudgeTimerRef.current) clearInterval(reJudgeTimerRef.current);
        setCaptureActive(false);
        setIsStudying(true);
      });

      setCaptureActive(true);
      setError(null);
    } catch {
      setError('화면 공유가 거부되었습니다.');
    }
  }, []);

  // 언마운트 정리
  useEffect(() => {
    return () => {
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
      if (reJudgeTimerRef.current) clearInterval(reJudgeTimerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      videoRef.current?.pause();
    };
  }, []);

  return { isStudying, confidence, captureActive, error, lastReason, requestCapture };
}

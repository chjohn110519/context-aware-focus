import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';

interface UseMLScreenClassifierOptions {
  enabled: boolean;
  intervalMs?: number;
}

interface MLClassifierResult {
  isStudying: boolean;
  confidence: number;
  modelLoaded: boolean;
  captureActive: boolean;
  error: string | null;
  requestCapture: () => Promise<void>;
}

export function useMLScreenClassifier({
  enabled,
  intervalMs = 2000,
}: UseMLScreenClassifierOptions): MLClassifierResult {
  const [isStudying, setIsStudying] = useState(true);
  const [confidence, setConfidence] = useState(1);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [captureActive, setCaptureActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelRef = useRef<tf.LayersModel | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 모델 로드
  useEffect(() => {
    if (!enabled) return;

    tf.loadLayersModel('/model/model.json')
      .then(model => {
        modelRef.current = model;
        setModelLoaded(true);
      })
      .catch((err) => {
        console.error('[ML] 모델 로드 실패:', err);
        setModelLoaded(false);
      });

    return () => {
      modelRef.current?.dispose();
      modelRef.current = null;
    };
  }, [enabled]);

  // 프레임 분류
  const classifyFrame = useCallback(() => {
    const model = modelRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!model || !video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 224, 224);

    tf.tidy(() => {
      const tensor = tf.browser
        .fromPixels(canvas)
        .toFloat()
        .div(255)
        .expandDims(0);

      const prediction = model.predict(tensor) as tf.Tensor;
      const [studyingProb] = Array.from(prediction.dataSync());

      const studying = studyingProb > 0.5;
      setIsStudying(studying);
      setConfidence(studying ? studyingProb : 1 - studyingProb);
    });
  }, []);

  // 인터벌 시작/중지 (캡처가 활성화됐을 때)
  useEffect(() => {
    if (!modelLoaded || !captureActive) return;

    intervalRef.current = window.setInterval(classifyFrame, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [modelLoaded, captureActive, classifyFrame, intervalMs]);

  // 화면 공유 요청 (반드시 버튼 클릭 등 user gesture에서 호출)
  const requestCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      streamRef.current = stream;

      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      videoRef.current = video;

      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      canvasRef.current = canvas;

      // 사용자가 공유 종료 시 자동 처리
      stream.getVideoTracks()[0].addEventListener('ended', () => {
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
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      videoRef.current?.pause();
    };
  }, []);

  return { isStudying, confidence, modelLoaded, captureActive, error, requestCapture };
}

import { useEffect, useRef } from 'react';
import { TREE_MAX_HEALTH } from '../../utils/constants';

interface ForestWidgetProps {
  health: number; // 0 ~ 100
}

/**
 * Forest Widget — 좌하단 소형 (160×160)
 * 새싹 → 나무 5단계 성장 과정
 * 반짝임/glow 효과 없음
 */
export default function ForestWidget({ health }: ForestWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const normalizedHealth = Math.max(0, Math.min(TREE_MAX_HEALTH, health)) / TREE_MAX_HEALTH;

  // 5단계 성장 판별
  const getStage = (h: number): { label: string; emoji: string; stage: number } => {
    if (h < 0.2) return { label: '씨앗', emoji: '🌰', stage: 1 };
    if (h < 0.4) return { label: '새싹', emoji: '🌱', stage: 2 };
    if (h < 0.6) return { label: '작은 나무', emoji: '🪴', stage: 3 };
    if (h < 0.8) return { label: '중간 나무', emoji: '🌲', stage: 4 };
    return { label: '큰 나무', emoji: '🌳', stage: 5 };
  };

  const { label, emoji, stage } = getStage(normalizedHealth);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 140;
    const H = 140;
    canvas.width = W;
    canvas.height = H;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Ground (타원형 지면)
      const groundHue = 30 + normalizedHealth * 90; // 갈색 → 녹색
      const groundSat = 20 + normalizedHealth * 40;
      const groundLight = 15 + normalizedHealth * 15;
      ctx.fillStyle = `hsl(${groundHue}, ${groundSat}%, ${groundLight}%)`;
      ctx.beginPath();
      ctx.ellipse(W / 2, H - 18, 50 + normalizedHealth * 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stage 1: 씨앗
      if (stage >= 1 && stage === 1) {
        ctx.fillStyle = `hsl(30, 50%, ${25 + normalizedHealth * 20}%)`;
        ctx.beginPath();
        ctx.ellipse(W / 2, H - 28, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stage 2+: 줄기/몸통
      if (stage >= 2) {
        const trunkHeight = 15 + (stage - 2) * 22 + normalizedHealth * 8;
        const trunkWidth = 3 + (stage - 2) * 2;
        const trunkColor = `hsl(25, ${30 + normalizedHealth * 30}%, ${22 + normalizedHealth * 12}%)`;

        ctx.strokeStyle = trunkColor;
        ctx.lineWidth = trunkWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(W / 2, H - 26);
        ctx.lineTo(W / 2, H - 26 - trunkHeight);
        ctx.stroke();

        // Stage 2: 작은 잎 2장
        if (stage === 2) {
          const leafY = H - 26 - trunkHeight;
          ctx.fillStyle = `hsl(120, ${40 + normalizedHealth * 30}%, ${30 + normalizedHealth * 15}%)`;
          // 왼쪽 잎
          ctx.beginPath();
          ctx.ellipse(W / 2 - 8, leafY + 2, 8, 5, -0.5, 0, Math.PI * 2);
          ctx.fill();
          // 오른쪽 잎
          ctx.beginPath();
          ctx.ellipse(W / 2 + 8, leafY + 2, 8, 5, 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Stage 3: 작은 원형 캐노피
        if (stage === 3) {
          const topY = H - 26 - trunkHeight;
          const canopyR = 18;
          const hue = 100 + normalizedHealth * 30;
          ctx.fillStyle = `hsl(${hue}, ${40 + normalizedHealth * 30}%, ${28 + normalizedHealth * 15}%)`;
          ctx.beginPath();
          ctx.arc(W / 2, topY, canopyR, 0, Math.PI * 2);
          ctx.fill();
          // 약간 밝은 inner
          ctx.fillStyle = `hsla(${hue + 10}, ${50}%, ${40}%, 0.4)`;
          ctx.beginPath();
          ctx.arc(W / 2 - 3, topY - 3, canopyR * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Stage 4: 중간 나무 (가지 + 캐노피)
        if (stage === 4) {
          const topY = H - 26 - trunkHeight;
          // 가지 2개
          ctx.strokeStyle = trunkColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(W / 2, topY + 18);
          ctx.lineTo(W / 2 - 18, topY + 8);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(W / 2, topY + 14);
          ctx.lineTo(W / 2 + 16, topY + 6);
          ctx.stroke();

          // 캐노피
          const hue = 115 + normalizedHealth * 20;
          const sat = 45 + normalizedHealth * 25;
          ctx.fillStyle = `hsl(${hue}, ${sat}%, ${28 + normalizedHealth * 12}%)`;
          ctx.beginPath();
          ctx.ellipse(W / 2, topY - 2, 28, 22, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `hsla(${hue + 5}, ${sat}%, ${35}%, 0.5)`;
          ctx.beginPath();
          ctx.ellipse(W / 2 - 4, topY - 6, 16, 12, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Stage 5: 큰 나무 (풍성한 캐노피)
        if (stage === 5) {
          const topY = H - 26 - trunkHeight;
          // 가지 3개
          ctx.strokeStyle = trunkColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(W / 2, topY + 20);
          ctx.quadraticCurveTo(W / 2 - 10, topY + 12, W / 2 - 22, topY + 6);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(W / 2, topY + 16);
          ctx.quadraticCurveTo(W / 2 + 10, topY + 8, W / 2 + 20, topY + 4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(W / 2, topY + 8);
          ctx.lineTo(W / 2 + 5, topY - 5);
          ctx.stroke();

          // 풍성한 캐노피 (3층)
          const hue = 125;
          const sat = 55;
          for (let layer = 0; layer < 3; layer++) {
            const ly = topY - 6 + layer * 8;
            const lr = 32 - layer * 4;
            ctx.fillStyle = `hsla(${hue + layer * 5}, ${sat}%, ${26 + layer * 5}%, ${0.8 - layer * 0.15})`;
            ctx.beginPath();
            ctx.ellipse(W / 2 + (layer % 2 === 0 ? -2 : 2), ly, lr, lr * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 잔디 디테일 (stage 3+)
      if (stage >= 3) {
        const grassCount = Math.floor(3 + normalizedHealth * 5);
        for (let i = 0; i < grassCount; i++) {
          const gx = W / 2 - 40 + (i / grassCount) * 80;
          const gh = 4 + Math.random() * 6;
          ctx.strokeStyle = `hsla(120, 50%, ${30 + normalizedHealth * 20}%, 0.5)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(gx, H - 20);
          ctx.lineTo(gx + (Math.random() - 0.5) * 3, H - 20 - gh);
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [normalizedHealth, stage]);

  // 성장 상태 색상
  const stageColors = ['#78350f', '#a16207', '#4ade80', '#22c55e', '#16a34a'];
  const stageColor = stageColors[stage - 1];

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-2xl" style={{
      background: 'rgba(15, 30, 10, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(74, 222, 128, 0.15)',
    }}>
      <canvas
        ref={canvasRef}
        style={{ width: 140, height: 140, borderRadius: 12 }}
      />
      <div className="text-center">
        <p className="text-xs font-semibold" style={{ color: stageColor }}>
          {emoji} {label}
        </p>
        {/* 성장 바 */}
        <div className="mt-1 w-28 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${normalizedHealth * 100}%`,
              background: `linear-gradient(90deg, ${stageColor}, #4ade80)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

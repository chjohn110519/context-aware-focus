import { useEffect, useRef } from 'react';
import { TREE_MAX_HEALTH, TREE_EXTENDED_MAX } from '../../utils/constants';

interface ForestWidgetProps {
  health: number; // 0 ~ 100
}

/**
 * Forest Widget — 좌하단 소형 (140×140)
 * 씨앗 → 열매 7단계 성장 과정
 * 반짝임/glow 효과 없음
 */
export default function ForestWidget({ health }: ForestWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const normalizedHealth = Math.max(0, Math.min(TREE_EXTENDED_MAX, health)) / TREE_MAX_HEALTH;

  // 7단계 성장 판별 (큰 나무 이후 꽃→열매)
  const getStage = (h: number): { label: string; emoji: string; stage: number } => {
    if (h < 0.2) return { label: '씨앗', emoji: '🌰', stage: 1 };
    if (h < 0.4) return { label: '새싹', emoji: '🌱', stage: 2 };
    if (h < 0.6) return { label: '작은 나무', emoji: '🪴', stage: 3 };
    if (h < 0.8) return { label: '중간 나무', emoji: '🌲', stage: 4 };
    if (h < 1.0) return { label: '큰 나무', emoji: '🌳', stage: 5 };
    if (h < 1.3) return { label: '꽃피는 나무', emoji: '🌸', stage: 6 };
    return { label: '열매 나무', emoji: '🍎', stage: 7 };
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
        const rawTrunkHeight = 15 + (stage - 2) * 22 + normalizedHealth * 8;
        const trunkHeight = Math.min(rawTrunkHeight, H - 50); // canvas 내 clamp
        const trunkWidth = Math.min(3 + (stage - 2) * 2, 13); // stage 7에서도 적정 두께
        const trunkColor = `hsl(25, ${30 + Math.min(normalizedHealth, 1) * 30}%, ${22 + Math.min(normalizedHealth, 1) * 12}%)`;

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

        // Stage 5+: 큰 나무 base (풍성한 캐노피)
        if (stage >= 5) {
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

          // Stage 6: 꽃피는 나무 — 캐노피 위에 꽃잎
          if (stage >= 6) {
            const flowerPositions = [
              { dx: -18, dy: -14 }, { dx: 14, dy: -10 }, { dx: -8, dy: -20 },
              { dx: 20, dy: -16 }, { dx: 0, dy: -24 }, { dx: -24, dy: -6 },
              { dx: 10, dy: -22 }, { dx: -14, dy: -4 },
            ];
            for (const fp of flowerPositions) {
              const fx = W / 2 + fp.dx;
              const fy = topY + fp.dy;
              // 꽃잎 (분홍/연보라 계열)
              const petalHue = 330 + Math.random() * 40;
              ctx.fillStyle = `hsla(${petalHue}, 70%, 75%, 0.85)`;
              for (let p = 0; p < 5; p++) {
                const pa = (p / 5) * Math.PI * 2;
                ctx.beginPath();
                ctx.ellipse(fx + Math.cos(pa) * 3.5, fy + Math.sin(pa) * 3.5, 3, 2, pa, 0, Math.PI * 2);
                ctx.fill();
              }
              // 꽃 중심 (노란색)
              ctx.fillStyle = 'hsla(50, 90%, 65%, 0.9)';
              ctx.beginPath();
              ctx.arc(fx, fy, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Stage 7: 열매 나무 — health에 비례해 1→6개 점진 증가
          if (stage >= 7) {
            const fruitPositions = [
              { dx: -20, dy: 2, hue: 0 }, { dx: 16, dy: -2, hue: 25 },
              { dx: -6, dy: 8, hue: 0 }, { dx: 22, dy: 6, hue: 25 },
              { dx: -16, dy: 12, hue: 0 }, { dx: 8, dy: 10, hue: 25 },
            ];
            // normalizedHealth 1.3 → 1개, 1.5(EXTENDED_MAX/MAX) → 6개
            const fruitProgress = Math.min((normalizedHealth - 1.3) / 0.2, 1); // 0~1
            const visibleFruits = Math.max(1, Math.ceil(fruitProgress * fruitPositions.length));
            for (let fi = 0; fi < visibleFruits; fi++) {
              const fp = fruitPositions[fi];
              const fx = W / 2 + fp.dx;
              const fy = topY + fp.dy;
              // 열매 그림자
              ctx.fillStyle = 'hsla(0, 70%, 35%, 0.4)';
              ctx.beginPath();
              ctx.arc(fx + 1, fy + 1, 4.5, 0, Math.PI * 2);
              ctx.fill();
              // 열매 (빨간/주황 계열)
              const grad = ctx.createRadialGradient(fx - 1, fy - 1, 1, fx, fy, 4.5);
              grad.addColorStop(0, `hsla(${fp.hue}, 85%, 60%, 0.95)`);
              grad.addColorStop(1, `hsla(${fp.hue}, 75%, 40%, 0.9)`);
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
              ctx.fill();
              // 하이라이트
              ctx.fillStyle = 'hsla(0, 0%, 100%, 0.5)';
              ctx.beginPath();
              ctx.arc(fx - 1.5, fy - 1.5, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
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
  const stageColors = ['#78350f', '#a16207', '#4ade80', '#22c55e', '#16a34a', '#f472b6', '#ef4444'];
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
              width: `${Math.min(normalizedHealth * 100, 100)}%`,
              background: `linear-gradient(90deg, ${stageColor}, #4ade80)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

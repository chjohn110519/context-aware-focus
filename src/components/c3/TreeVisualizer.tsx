import { useEffect, useRef } from 'react';
import { TREE_MAX_HEALTH } from '../../utils/constants';

interface TreeVisualizerProps {
  health: number; // 0 ~ 100
}

export default function TreeVisualizer({ health }: TreeVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Array<{ x: number; y: number; vy: number; vx: number; size: number; opacity: number; color: string }>>([]);

  const normalizedHealth = Math.max(0, Math.min(TREE_MAX_HEALTH, health)) / TREE_MAX_HEALTH;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 280;
    const H = 400;
    canvas.width = W;
    canvas.height = H;

    // Spawn falling leaf particles when wilting
    if (normalizedHealth < 0.4 && Math.random() > 0.7) {
      particlesRef.current.push({
        x: W / 2 + (Math.random() - 0.5) * 80,
        y: 100 + Math.random() * 80,
        vy: 0.3 + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        size: 3 + Math.random() * 4,
        opacity: 0.8,
        color: `hsl(${30 + Math.random() * 20}, 70%, ${40 + Math.random() * 20}%)`,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Ground
      const groundGradient = ctx.createLinearGradient(0, H - 40, 0, H);
      groundGradient.addColorStop(0, `hsl(30, ${20 + normalizedHealth * 40}%, ${15 + normalizedHealth * 10}%)`);
      groundGradient.addColorStop(1, `hsl(25, ${15 + normalizedHealth * 30}%, ${10 + normalizedHealth * 5}%)`);
      ctx.fillStyle = groundGradient;
      ctx.beginPath();
      ctx.ellipse(W / 2, H - 30, 100, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      const trunkHeight = 120 + normalizedHealth * 40;
      const trunkWidth = 12 + normalizedHealth * 8;
      const trunkColor = `hsl(25, ${30 + normalizedHealth * 30}%, ${20 + normalizedHealth * 15}%)`;

      ctx.strokeStyle = trunkColor;
      ctx.lineWidth = trunkWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(W / 2, H - 50);
      ctx.quadraticCurveTo(W / 2 - 5, H - 50 - trunkHeight / 2, W / 2, H - 50 - trunkHeight);
      ctx.stroke();

      // Branches
      const branchCount = 3 + Math.floor(normalizedHealth * 4);
      const topY = H - 50 - trunkHeight;
      for (let i = 0; i < branchCount; i++) {
        const angle = (i / branchCount) * Math.PI - Math.PI / 2 + (Math.random() - 0.5) * 0.3;
        const length = 30 + normalizedHealth * 40 + Math.random() * 20;
        const bx = W / 2 + Math.cos(angle) * length;
        const by = topY + 30 + i * 15 + Math.sin(angle) * length * 0.3;

        ctx.strokeStyle = trunkColor;
        ctx.lineWidth = 3 + normalizedHealth * 3;
        ctx.beginPath();
        ctx.moveTo(W / 2, topY + 30 + i * 15);
        ctx.quadraticCurveTo(
          W / 2 + Math.cos(angle) * length * 0.5,
          topY + 30 + i * 15 + Math.sin(angle) * length * 0.2 - 10,
          bx, by
        );
        ctx.stroke();
      }

      // Canopy (leaves cluster)
      const canopyLayers = 4;
      for (let layer = 0; layer < canopyLayers; layer++) {
        const layerY = topY - 20 + layer * 25;
        const layerRadius = (40 + normalizedHealth * 50) * (1 - layer * 0.15);
        const hue = normalizedHealth > 0.5 ? 120 + normalizedHealth * 20 : 40 + normalizedHealth * 80;
        const sat = 30 + normalizedHealth * 50;
        const light = 15 + normalizedHealth * 30;

        const leafGradient = ctx.createRadialGradient(
          W / 2, layerY, 0,
          W / 2, layerY, layerRadius
        );
        leafGradient.addColorStop(0, `hsla(${hue}, ${sat}%, ${light + 15}%, ${0.4 + normalizedHealth * 0.5})`);
        leafGradient.addColorStop(0.7, `hsla(${hue}, ${sat}%, ${light}%, ${0.3 + normalizedHealth * 0.4})`);
        leafGradient.addColorStop(1, `hsla(${hue}, ${sat}%, ${light - 5}%, 0)`);

        ctx.fillStyle = leafGradient;
        ctx.beginPath();
        ctx.ellipse(W / 2 + (layer % 2 === 0 ? -5 : 5), layerY, layerRadius, layerRadius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Small detail leaves
      const leafCount = Math.floor(8 + normalizedHealth * 20);
      for (let i = 0; i < leafCount; i++) {
        const angle = (i / leafCount) * Math.PI * 2;
        const dist = 20 + Math.random() * (30 + normalizedHealth * 40);
        const lx = W / 2 + Math.cos(angle) * dist;
        const ly = topY - 10 + Math.sin(angle) * dist * 0.6;
        const leafSize = 4 + normalizedHealth * 6 + Math.random() * 3;

        const hue = normalizedHealth > 0.5 ? 100 + Math.random() * 40 : 30 + Math.random() * 30;
        ctx.fillStyle = `hsla(${hue}, ${40 + normalizedHealth * 40}%, ${25 + normalizedHealth * 25}%, ${0.5 + normalizedHealth * 0.4})`;
        ctx.beginPath();
        ctx.ellipse(lx, ly, leafSize, leafSize * 0.6, angle, 0, Math.PI * 2);
        ctx.fill();
      }

      // Falling leaf particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y * 0.02) * 0.3;
        p.opacity -= 0.003;

        if (p.opacity <= 0 || p.y > H) return false;

        ctx.fillStyle = p.color.replace(')', `, ${p.opacity})`).replace('hsl', 'hsla');
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, p.vx, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      // Health glow effect
      if (normalizedHealth > 0.7) {
        const glowGradient = ctx.createRadialGradient(W / 2, topY, 0, W / 2, topY, 80);
        glowGradient.addColorStop(0, `hsla(120, 60%, 50%, ${(normalizedHealth - 0.7) * 0.3})`);
        glowGradient.addColorStop(1, 'hsla(120, 60%, 50%, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, W, H);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [normalizedHealth]);

  // Status label
  const statusText = normalizedHealth > 0.7 ? '🌳 무성하게 자라는 중' :
    normalizedHealth > 0.4 ? '🌱 성장 중' :
      normalizedHealth > 0.2 ? '🍂 시들어가는 중...' : '🥀 도움이 필요해요';

  const statusColor = normalizedHealth > 0.7 ? 'var(--tree-healthy)' :
    normalizedHealth > 0.4 ? 'var(--accent)' :
      normalizedHealth > 0.2 ? 'var(--tree-wilting)' : 'var(--tree-dead)';

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        style={{ width: 280, height: 400, borderRadius: 16 }}
      />
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: statusColor }}>
          {statusText}
        </p>
        <div className="mt-2 w-48 h-2 rounded-full overflow-hidden" style={{ background: 'var(--progress-bg)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${normalizedHealth * 100}%`,
              background: `linear-gradient(90deg, ${statusColor}, var(--accent))`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

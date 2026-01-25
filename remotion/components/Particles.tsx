import React from 'react';
import { useCurrentFrame } from 'remotion';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  fadeSpeed: number;
}

interface ParticlesProps {
  count: number;
  colors?: string[];
  spread?: number;
  gravity?: number;
  fadeOut?: boolean;
  startFrame?: number;
}

export const Particles: React.FC<ParticlesProps> = ({
  count,
  colors = ['#9B5CFF', '#FF4FD8', '#3CCBFF', '#00FF88'],
  spread = 1,
  gravity = 0.5,
  fadeOut = true,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = Math.max(0, frame - startFrame);

  // Génération déterministe des particules
  const particles = React.useMemo(() => {
    const p: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (i * 137.5 * Math.PI) / 180; // Golden angle
      const velocity = 2 + (i % 5) * 0.5;

      p.push({
        id: i,
        x: 50, // Centre
        y: 50,
        vx: Math.cos(angle) * velocity * spread,
        vy: Math.sin(angle) * velocity * spread - 5, // Bias vers le haut
        size: 8 + (i % 4) * 4,
        color: colors[i % colors.length],
        rotation: (i * 45) % 360,
        rotationSpeed: 2 + (i % 3) * 2,
        opacity: 0.9 - (i % 10) * 0.05,
        fadeSpeed: 0.01 + (i % 5) * 0.005,
      });
    }
    return p;
  }, [count, spread, colors]);

  return (
    <>
      {particles.map((p) => {
        // Physique réaliste
        const x = p.x + p.vx * relativeFrame;
        const y = p.y + p.vy * relativeFrame + gravity * relativeFrame * relativeFrame * 0.05;
        const rotation = p.rotation + p.rotationSpeed * relativeFrame;
        const opacity = fadeOut
          ? Math.max(0, p.opacity - p.fadeSpeed * relativeFrame)
          : p.opacity;

        // Clipping bounds
        if (x < -10 || x > 110 || y < -10 || y > 110 || opacity <= 0) {
          return null;
        }

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: p.id % 3 === 0 ? '50%' : '0%',
              transform: `rotate(${rotation}deg)`,
              opacity,
              boxShadow: `0 0 ${p.size}px ${p.color}`,
              filter: `blur(${p.id % 5 === 0 ? '1px' : '0px'})`,
            }}
          />
        );
      })}
    </>
  );
};

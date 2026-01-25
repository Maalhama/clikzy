import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { COLORS, SPRING_CONFIG } from '../config/constants';

/**
 * SCÈNE 1 — INTRO (2.5s / 75 frames)
 * "Tu cliques. Tu gagnes."
 *
 * Best practices:
 * - spring() avec config "smooth" (no bounce)
 * - interpolate() avec Easing.inOut pour fade
 * - Pas de CSS animations
 */

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === ANIMATIONS (Best practices Remotion) ===

  // Fade in avec easing professionnel
  const opacity = interpolate(
    frame,
    [0, 0.7 * fps], // 0-0.7s
    [0, 1],
    {
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  );

  // Zoom caméra subtil avec spring smooth (no bounce)
  const cameraZoom = spring({
    frame,
    fps,
    config: SPRING_CONFIG.smooth,
    from: 1.1,
    to: 1,
  });

  // Glow pulse léger
  const glowPulse = interpolate(
    Math.sin(frame / 15),
    [-1, 1],
    [10, 15]
  );

  // Gradient rotation lente
  const gradientRotation = interpolate(
    frame,
    [0, 2.5 * fps], // 0-2.5s
    [0, 10],
    {
      easing: Easing.inOut(Easing.sin),
    }
  );

  return (
    <AbsoluteFill>
      {/* Background animé */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${135 + gradientRotation}deg, ${COLORS.bg.darker} 0%, ${COLORS.bg.dark} 50%, ${COLORS.bg.lighter} 100%)`,
        }}
      />

      {/* Ambient glow léger */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.neon.purple}20 0%, transparent 70%)`,
          filter: `blur(${glowPulse * 4}px)`,
        }}
      />

      {/* Texte principal avec zoom caméra */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${cameraZoom})`,
          opacity,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 120,
            fontWeight: 900,
            margin: 0,
            color: COLORS.text.primary,
            letterSpacing: 4,
            lineHeight: 1.2,
            textShadow: `0 0 ${glowPulse}px ${COLORS.neon.purple}80`,
          }}
        >
          Tu cliques.
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${COLORS.neon.purple} 0%, ${COLORS.neon.pink} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: `drop-shadow(0 0 ${glowPulse}px ${COLORS.neon.purple}80)`,
            }}
          >
            Tu gagnes.
          </span>
        </h1>
      </div>
    </AbsoluteFill>
  );
};

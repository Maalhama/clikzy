import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { COLORS, SPRING_CONFIG } from '../config/constants';

/**
 * SCÈNE 2 — HERO (3.5s / 105 frames)
 * Hero du site avec CTA
 */

// Cursor component
const Cursor: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 24,
      height: 24,
      pointerEvents: 'none',
      zIndex: 100,
    }}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3 L3 18 L7.5 14 L10 21 L12 20 L9.5 13 L15 13 Z"
        fill="#FFFFFF"
        stroke={COLORS.neon.purple}
        strokeWidth="1.5"
        filter={`drop-shadow(0 0 10px ${COLORS.neon.purple})`}
      />
    </svg>
  </div>
);

export const Scene2Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === ANIMATIONS ===

  // Entrance avec spring bouncy
  const entrance = spring({
    frame,
    fps,
    config: SPRING_CONFIG.bouncy,
  });

  const slideY = interpolate(entrance, [0, 1], [30, 0]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

  // Scroll animation
  const scrollProgress = interpolate(
    frame,
    [1 * fps, 2.5 * fps], // 1-2.5s
    [0, 1],
    {
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  );

  const scrollY = interpolate(scrollProgress, [0, 1], [0, -20]);

  // Button pulse (spring snappy)
  const buttonPulse = spring({
    frame,
    fps,
    config: SPRING_CONFIG.snappy,
    durationInFrames: 40,
  });

  const buttonScale = interpolate(buttonPulse, [0, 1], [0.98, 1]);

  // Cursor movement
  const cursorProgress = interpolate(
    frame,
    [1.3 * fps, 2.7 * fps], // 1.3-2.7s
    [0, 1],
    {
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }
  );

  const cursorX = interpolate(cursorProgress, [0, 1], [300, 960]);
  const cursorY = interpolate(cursorProgress, [0, 1], [300, 650]);

  // Glow
  const glowPulse = interpolate(Math.sin(frame / 12), [-1, 1], [10, 15]);

  return (
    <AbsoluteFill>
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: COLORS.bg.dark,
        }}
      />

      {/* Hero content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity,
          transform: `translateY(${slideY + scrollY}px)`,
        }}
      >
        {/* Logo */}
        <div
          style={{
            position: 'absolute',
            top: 150,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: 120,
              fontWeight: 900,
              margin: 0,
              background: `linear-gradient(135deg, ${COLORS.neon.purple} 0%, ${COLORS.neon.pink} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: 6,
              filter: `drop-shadow(0 0 ${glowPulse}px ${COLORS.neon.purple}60)`,
            }}
          >
            CLIKZY
          </h1>
          <p
            style={{
              fontSize: 24,
              color: COLORS.text.secondary,
              marginTop: 20,
              fontWeight: 600,
            }}
          >
            Le jeu où chaque clic compte
          </p>
        </div>

        {/* Badge gratuit */}
        <div
          style={{
            position: 'absolute',
            top: 350,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '16px 32px',
            background: `linear-gradient(135deg, ${COLORS.neon.purple}20 0%, ${COLORS.neon.cyan}10 100%)`,
            border: `2px solid ${COLORS.neon.purple}40`,
            borderRadius: 12,
            boxShadow: `0 0 ${glowPulse}px ${COLORS.neon.purple}30`,
          }}
        >
          <p
            style={{
              fontSize: 40,
              fontWeight: 700,
              margin: 0,
              color: COLORS.text.primary,
            }}
          >
            🎁 <span style={{ color: COLORS.neon.cyan }}>10 clics gratuits</span> par jour
          </p>
        </div>

        {/* CTA button */}
        <div
          style={{
            position: 'absolute',
            top: 500,
            left: '50%',
            transform: `translateX(-50%) scale(${buttonScale})`,
          }}
        >
          <div
            style={{
              padding: '24px 60px',
              background: `linear-gradient(135deg, ${COLORS.neon.purple} 0%, ${COLORS.neon.pink} 100%)`,
              borderRadius: 16,
              boxShadow: `0 0 ${glowPulse * 2}px ${COLORS.neon.purple}60, 0 8px 24px rgba(0,0,0,0.3)`,
            }}
          >
            <span
              style={{
                fontSize: 60,
                fontWeight: 700,
                color: COLORS.text.primary,
                letterSpacing: 2,
              }}
            >
              Jouer gratuitement
            </span>
          </div>
        </div>
      </div>

      {/* Curseur */}
      {cursorProgress > 0 && <Cursor x={cursorX} y={cursorY} />}
    </AbsoluteFill>
  );
};

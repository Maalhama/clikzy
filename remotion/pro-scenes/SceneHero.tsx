import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { COLORS, EASING, EFFECTS, FONTS, SCENE_START, SCENE_DURATION } from '../config/theme';

/**
 * SCÈNE 2 — HERO DU SITE (3.5s)
 *
 * - Hero CLIKZY
 * - Animation de scroll léger
 * - Curseur visible
 * - "10 clics gratuits par jour"
 * - Bouton "Jouer gratuitement" pulse
 */

// Composant Cursor
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
        filter={`drop-shadow(0 0 ${EFFECTS.glow.min}px ${COLORS.neon.purple})`}
      />
    </svg>
  </div>
);

export const SceneHero: React.FC = () => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - SCENE_START.hero;

  // Slide in de toute la scène
  const slideY = interpolate(
    relativeFrame,
    [0, 25],
    [30, 0],
    { extrapolateRight: 'clamp', easing: EASING.bounce }
  );

  const opacity = interpolate(
    relativeFrame,
    [0, 20],
    [0, 1],
    { extrapolateRight: 'clamp', easing: EASING.smooth }
  );

  // Scroll animation légère
  const scrollY = interpolate(
    relativeFrame,
    [30, 80],
    [0, -20],
    { extrapolateRight: 'clamp', easing: EASING.smooth }
  );

  // Button pulse
  const buttonPulse = 1 + Math.sin(frame / 15) * 0.03;

  // Cursor movement (va vers le bouton)
  const cursorProgress = interpolate(
    relativeFrame,
    [40, 80],
    [0, 1],
    { extrapolateRight: 'clamp', easing: EASING.smooth }
  );

  const cursorX = interpolate(cursorProgress, [0, 1], [300, 960]);
  const cursorY = interpolate(cursorProgress, [0, 1], [300, 650]);

  // Glow
  const glowSize = EFFECTS.glow.min + Math.sin(frame / 12) * EFFECTS.glow.pulse;

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
        {/* Logo / Title */}
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
              fontSize: FONTS.size.huge,
              fontWeight: FONTS.weight.black,
              margin: 0,
              background: `linear-gradient(135deg, ${COLORS.neon.purple} 0%, ${COLORS.neon.pink} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: 6,
              filter: `drop-shadow(0 0 ${glowSize}px ${COLORS.neon.purple}60)`,
            }}
          >
            CLIKZY
          </h1>

          <p
            style={{
              fontSize: FONTS.size.normal,
              color: COLORS.text.secondary,
              marginTop: 20,
              fontWeight: FONTS.weight.normal,
            }}
          >
            Le jeu où chaque clic compte
          </p>
        </div>

        {/* Badge "10 clics gratuits" */}
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
            boxShadow: `0 0 ${glowSize}px ${COLORS.neon.purple}30`,
          }}
        >
          <p
            style={{
              fontSize: FONTS.size.medium,
              fontWeight: FONTS.weight.bold,
              margin: 0,
              color: COLORS.text.primary,
            }}
          >
            🎁 <span style={{ color: COLORS.neon.cyan }}>10 clics gratuits</span> par jour
          </p>
        </div>

        {/* Bouton CTA avec pulse */}
        <div
          style={{
            position: 'absolute',
            top: 500,
            left: '50%',
            transform: `translateX(-50%) scale(${buttonPulse})`,
          }}
        >
          <div
            style={{
              padding: '24px 60px',
              background: `linear-gradient(135deg, ${COLORS.neon.purple} 0%, ${COLORS.neon.pink} 100%)`,
              borderRadius: 16,
              boxShadow: `0 0 ${glowSize * 2}px ${COLORS.neon.purple}60, 0 8px 24px rgba(0,0,0,0.3)`,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontSize: FONTS.size.large,
                fontWeight: FONTS.weight.bold,
                color: COLORS.text.primary,
                letterSpacing: 2,
              }}
            >
              Jouer gratuitement
            </span>
          </div>
        </div>
      </div>

      {/* Curseur animé */}
      {cursorProgress > 0 && <Cursor x={cursorX} y={cursorY} />}
    </AbsoluteFill>
  );
};

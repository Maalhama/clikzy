import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { COLORS, EASING, EFFECTS, FONTS, SCENE_START, SCENE_DURATION } from '../config/theme';

/**
 * SCÈNE 6 — OUTRO (3.5s)
 *
 * - Logo CLIKZY
 * - "Joue gratuitement."
 * - CTA visuel
 * - Fade out fluide
 */

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - SCENE_START.outro;

  // Logo fade in + scale
  const logoOpacity = interpolate(
    relativeFrame,
    [0, 20],
    [0, 1],
    { extrapolateRight: 'clamp', easing: EASING.smooth }
  );

  const logoScale = interpolate(
    relativeFrame,
    [0, 25],
    [0.9, 1],
    { extrapolateRight: 'clamp', easing: EASING.bounce }
  );

  // Texte CTA
  const ctaOpacity = interpolate(
    relativeFrame,
    [25, 45],
    [0, 1],
    { extrapolateRight: 'clamp', easing: EASING.smooth }
  );

  const ctaY = interpolate(
    relativeFrame,
    [25, 50],
    [20, 0],
    { extrapolateRight: 'clamp', easing: EASING.bounce }
  );

  // Fade out final
  const fadeOut = interpolate(
    relativeFrame,
    [SCENE_DURATION.outro - 20, SCENE_DURATION.outro],
    [1, 0],
    { extrapolateRight: 'clamp', easing: EASING.smooth }
  );

  // Glow pulse
  const glowSize = EFFECTS.glow.min + Math.sin(frame / 12) * EFFECTS.glow.pulse;

  // Background gradient animation
  const bgRotation = interpolate(
    relativeFrame,
    [0, SCENE_DURATION.outro],
    [135, 155],
    { easing: EASING.smooth }
  );

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* Background animé */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${bgRotation}deg, ${COLORS.bg.darker} 0%, ${COLORS.bg.dark} 50%, ${COLORS.bg.lighter} 100%)`,
        }}
      />

      {/* Glow ambiant */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.neon.purple}20 0%, transparent 70%)`,
          filter: `blur(${glowSize * 3}px)`,
        }}
      />

      {/* Logo CLIKZY */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${logoScale})`,
          opacity: logoOpacity,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: FONTS.size.huge * 1.3,
            fontWeight: FONTS.weight.black,
            margin: 0,
            background: `linear-gradient(135deg, ${COLORS.neon.purple} 0%, ${COLORS.neon.pink} 50%, ${COLORS.neon.cyan} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% 200%',
            backgroundPosition: `${interpolate(frame, [SCENE_START.outro, SCENE_START.outro + SCENE_DURATION.outro], [0, 100])}% 50%`,
            letterSpacing: 8,
            filter: `drop-shadow(0 0 ${glowSize}px ${COLORS.neon.purple}60)`,
          }}
        >
          CLIKZY
        </h1>
      </div>

      {/* CTA */}
      <div
        style={{
          position: 'absolute',
          top: '65%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${ctaY}px))`,
          opacity: ctaOpacity,
          textAlign: 'center',
        }}
      >
        {/* Texte principal */}
        <p
          style={{
            fontSize: FONTS.size.big,
            fontWeight: FONTS.weight.bold,
            color: COLORS.text.primary,
            margin: 0,
            marginBottom: 30,
            letterSpacing: 3,
          }}
        >
          Joue gratuitement.
        </p>

        {/* Badge URL */}
        <div
          style={{
            display: 'inline-block',
            padding: '20px 50px',
            background: `linear-gradient(135deg, ${COLORS.neon.purple}15 0%, ${COLORS.neon.cyan}10 100%)`,
            border: `2px solid ${COLORS.neon.purple}50`,
            borderRadius: 100,
            boxShadow: `0 0 ${glowSize}px ${COLORS.neon.purple}30`,
            backdropFilter: `blur(${EFFECTS.blur.light}px)`,
          }}
        >
          <p
            style={{
              fontSize: FONTS.size.large,
              fontWeight: FONTS.weight.bold,
              color: COLORS.neon.cyan,
              margin: 0,
              letterSpacing: 2,
              textShadow: `0 0 ${EFFECTS.glow.min}px ${COLORS.neon.cyan}80`,
            }}
          >
            cleekzy.com
          </p>
        </div>

        {/* Petites particules autour du CTA */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const distance = 180 + Math.sin(frame / 10 + i) * 20;
          const size = 3 + (i % 2);

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(50% + ${Math.cos(angle) * distance}px)`,
                top: `calc(50% + ${Math.sin(angle) * distance}px)`,
                width: size,
                height: size,
                borderRadius: '50%',
                background: i % 2 ? COLORS.neon.purple : COLORS.neon.cyan,
                opacity: 0.4 + Math.sin(frame / 8 + i) * 0.2,
                boxShadow: `0 0 ${size * 2}px ${i % 2 ? COLORS.neon.purple : COLORS.neon.cyan}`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

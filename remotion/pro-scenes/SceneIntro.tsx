import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { COLORS, EASING, EFFECTS, FONTS, SCENE_START, SCENE_DURATION } from '../config/theme';

/**
 * SCÈNE 1 — INTRO (2.5s)
 *
 * "Tu cliques. Tu gagnes."
 * - Fond sombre animé
 * - Texte central avec glow léger
 * - Zoom caméra lent (effet 3D subtil)
 */

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - SCENE_START.intro;

  // Fade in du texte
  const textOpacity = interpolate(
    relativeFrame,
    [0, 20],
    [0, 1],
    { extrapolateRight: 'clamp', easing: EASING.smooth }
  );

  // Zoom caméra subtil (effet 3D)
  const cameraZoom = interpolate(
    relativeFrame,
    [0, SCENE_DURATION.intro],
    [1.1, 1],
    { easing: EASING.smooth }
  );

  // Glow pulse léger
  const glowSize = EFFECTS.glow.min + Math.sin(frame / 15) * EFFECTS.glow.pulse;

  // Gradient animé (rotation lente)
  const gradientRotation = interpolate(
    relativeFrame,
    [0, SCENE_DURATION.intro],
    [0, 10],
    { easing: EASING.smooth }
  );

  return (
    <AbsoluteFill>
      {/* Background sombre animé */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${135 + gradientRotation}deg, ${COLORS.bg.darker} 0%, ${COLORS.bg.dark} 50%, ${COLORS.bg.lighter} 100%)`,
        }}
      />

      {/* Ambient glow subtil */}
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
          filter: `blur(${glowSize * 4}px)`,
        }}
      />

      {/* Texte principal avec zoom caméra */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${cameraZoom})`,
          opacity: textOpacity,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: FONTS.size.huge,
            fontWeight: FONTS.weight.black,
            margin: 0,
            color: COLORS.text.primary,
            letterSpacing: 4,
            lineHeight: 1.2,
            textShadow: `0 0 ${glowSize}px ${COLORS.neon.purple}80`,
          }}
        >
          Tu cliques.
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${COLORS.neon.purple} 0%, ${COLORS.neon.pink} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: `drop-shadow(0 0 ${glowSize}px ${COLORS.neon.purple}80)`,
            }}
          >
            Tu gagnes.
          </span>
        </h1>
      </div>
    </AbsoluteFill>
  );
};

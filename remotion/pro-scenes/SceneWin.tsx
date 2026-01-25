import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { COLORS, EASING, EFFECTS, FONTS, SCENE_START, SCENE_DURATION } from '../config/theme';

/**
 * SCÈNE 5 — DÉNOUEMENT (4.5s)
 *
 * - Dernier clic
 * - Timer → 0
 * - Effet flash doux
 * - "Gagné."
 * - Carte produit mise en avant
 *
 * 👉 RELÂCHEMENT DE LA TENSION + RÉCOMPENSE
 */

export const SceneWin: React.FC = () => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - SCENE_START.win;

  // === SÉQUENCE ===

  // Flash initial (très bref)
  const flashOpacity = interpolate(
    relativeFrame,
    [0, 5, 15],
    [0, 1, 0],
    { extrapolateRight: 'clamp', easing: EASING.snap }
  );

  // Timer qui tombe à 0
  const timerValue = interpolate(
    relativeFrame,
    [0, 20],
    [125, 0],
    { extrapolateRight: 'clamp', easing: EASING.smooth }
  );

  // "Gagné." apparaît
  const textOpacity = interpolate(
    relativeFrame,
    [25, 45],
    [0, 1],
    { extrapolateRight: 'clamp', easing: EASING.smooth }
  );

  const textScale = interpolate(
    relativeFrame,
    [25, 50],
    [0.8, 1],
    { extrapolateRight: 'clamp', easing: EASING.bounce }
  );

  // Produit mise en avant
  const productOpacity = interpolate(
    relativeFrame,
    [50, 70],
    [0, 1],
    { extrapolateRight: 'clamp', easing: EASING.smooth }
  );

  const productScale = interpolate(
    relativeFrame,
    [50, 75],
    [0.7, 1],
    { extrapolateRight: 'clamp', easing: EASING.bounce }
  );

  // Glow de victoire
  const glowSize = EFFECTS.glow.max + Math.sin(frame / 10) * EFFECTS.glow.pulse;

  // Confettis légers (particules)
  const confettiCount = Math.min(Math.floor(relativeFrame / 3), 40);

  return (
    <AbsoluteFill>
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${COLORS.bg.dark} 0%, ${COLORS.bg.darker} 100%)`,
        }}
      />

      {/* Flash blanc */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#FFFFFF',
          opacity: flashOpacity,
        }}
      />

      {/* Glow de victoire (vert) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.success}25 0%, transparent 70%)`,
          filter: `blur(${glowSize * 2}px)`,
        }}
      />

      {/* Timer qui tombe à 0 */}
      {relativeFrame < 25 && (
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: FONTS.size.small,
              color: COLORS.text.secondary,
              margin: 0,
              marginBottom: 15,
              letterSpacing: 3,
              fontWeight: FONTS.weight.bold,
            }}
          >
            TEMPS RESTANT
          </p>
          <div
            style={{
              fontSize: 180,
              fontWeight: FONTS.weight.black,
              color: Math.floor(timerValue) === 0 ? COLORS.success : COLORS.danger,
              textShadow: `0 0 ${glowSize}px ${Math.floor(timerValue) === 0 ? COLORS.success : COLORS.danger}`,
              letterSpacing: 8,
            }}
          >
            0:{Math.floor(timerValue).toString().padStart(3, '0')}
          </div>
        </div>
      )}

      {/* "Gagné." */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${textScale})`,
          opacity: textOpacity,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: FONTS.size.huge * 1.2,
            fontWeight: FONTS.weight.black,
            margin: 0,
            background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.neon.cyan} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 ${glowSize}px ${COLORS.success}80)`,
            letterSpacing: 6,
          }}
        >
          Gagné.
        </h1>
      </div>

      {/* Produit mis en avant */}
      <div
        style={{
          position: 'absolute',
          top: '62%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${productScale})`,
          opacity: productOpacity,
          textAlign: 'center',
        }}
      >
        {/* Card produit */}
        <div
          style={{
            padding: '40px 60px',
            background: `${COLORS.bg.lighter}CC`,
            border: `3px solid ${COLORS.success}40`,
            borderRadius: 24,
            boxShadow: `0 0 ${glowSize}px ${COLORS.success}40, 0 20px 60px rgba(0,0,0,0.4)`,
            backdropFilter: `blur(${EFFECTS.blur.medium}px)`,
          }}
        >
          <div
            style={{
              fontSize: 100,
              marginBottom: 20,
              filter: `drop-shadow(0 10px 30px rgba(0,0,0,0.3))`,
            }}
          >
            📱
          </div>
          <h2
            style={{
              fontSize: FONTS.size.big,
              fontWeight: FONTS.weight.black,
              color: COLORS.text.primary,
              margin: 0,
              marginBottom: 10,
            }}
          >
            iPhone 17 Pro Max
          </h2>
          <p
            style={{
              fontSize: FONTS.size.medium,
              color: COLORS.success,
              margin: 0,
              fontWeight: FONTS.weight.bold,
            }}
          >
            1 699€
          </p>
        </div>
      </div>

      {/* Confettis légers */}
      {[...Array(confettiCount)].map((_, i) => {
        const x = (i * 47) % 100;
        const y = ((relativeFrame * 2 + i * 20) % 120) - 10; // Tombent du haut
        const size = 4 + (i % 3);
        const colors = [COLORS.success, COLORS.neon.cyan, COLORS.neon.purple];
        const color = colors[i % colors.length];

        // Disparaissent en sortant de l'écran
        if (y > 100) return null;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size * 2,
              background: color,
              borderRadius: i % 2 ? '50%' : '0',
              opacity: 0.7,
              transform: `rotate(${i * 45}deg)`,
              boxShadow: `0 0 ${size}px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

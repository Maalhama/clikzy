import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { COLORS, EASING, EFFECTS, FONTS, SCENE_START, SCENE_DURATION } from '../config/theme';

/**
 * SCÈNE 4 — TENSION (7s)
 *
 * - Timer < 1 minute
 * - Clics plus rapprochés
 * - Shake caméra léger
 * - Glow plus intense
 * - Accélération dramatique
 *
 * 👉 TENSION MAXIMALE
 */

const Cursor: React.FC<{ x: number; y: number; clicking: boolean }> = ({ x, y, clicking }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 28,
      height: 28,
      pointerEvents: 'none',
      zIndex: 100,
      transform: clicking ? 'scale(0.8)' : 'scale(1)',
      transition: 'transform 0.08s ease-out',
    }}
  >
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M3 3 L3 20 L8 15 L11 23 L13 22 L10 14 L17 14 Z"
        fill="#FFFFFF"
        stroke={COLORS.neon.pink}
        strokeWidth="2"
        filter={`drop-shadow(0 0 ${EFFECTS.glow.max}px ${COLORS.neon.pink})`}
      />
    </svg>

    {clicking && (
      <div
        style={{
          position: 'absolute',
          top: -8,
          left: -8,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `4px solid ${COLORS.neon.pink}`,
          opacity: 0,
          animation: 'ripple 0.4s ease-out',
        }}
      />
    )}
  </div>
);

export const SceneTension: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - SCENE_START.tension;

  // === CLICS RAPIDES ===
  // Accélération progressive : clics de plus en plus rapprochés
  const clickTimings = [
    10, 25, 38, 49,        // Début modéré
    58, 66, 73, 79,        // Accélération
    84, 88, 92, 95,        // Très rapide
    98, 101, 104, 106,     // Ultra rapide
    108, 110, 112, 114,    // Frénétique
    116, 118, 120,         // Climax
  ];

  const isClicking = clickTimings.some((timing) =>
    relativeFrame >= timing && relativeFrame < timing + 4
  );

  const clickCount = clickTimings.filter((t) => relativeFrame >= t).length;

  // Timer qui descend rapidement
  const lastClickFrame = clickTimings.filter((t) => relativeFrame >= t).pop() || 0;
  const timeSinceLastClick = relativeFrame - lastClickFrame;
  const timerMs = Math.max(0, 800 - Math.floor(timeSinceLastClick / fps * 1000));

  // === EFFETS DE TENSION ===

  // Shake caméra (intensifie progressivement)
  const shakeIntensity = interpolate(
    clickCount,
    [0, clickTimings.length],
    [0, EFFECTS.shake.intensity],
    { easing: EASING.smooth }
  );

  const shakeX = Math.sin(frame * EFFECTS.shake.frequency) * shakeIntensity;
  const shakeY = Math.cos(frame * EFFECTS.shake.frequency * 1.3) * shakeIntensity;

  // Glow intense progressif
  const glowIntensity = EFFECTS.glow.max + Math.sin(frame / 5) * EFFECTS.glow.pulse +
    interpolate(clickCount, [0, clickTimings.length], [0, 30]);

  // Zoom progressif
  const zoom = interpolate(
    clickCount,
    [0, clickTimings.length],
    [1, 1.25],
    { easing: EASING.smooth }
  );

  // Vignette (assombrit les bords)
  const vignetteOpacity = interpolate(
    clickCount,
    [0, clickTimings.length],
    [0, 0.4],
    { easing: EASING.smooth }
  );

  // Cursor frénétique
  const cursorX = 960 + Math.sin(frame / 3) * 15;
  const cursorY = 650 + Math.cos(frame / 4) * 12;

  // Couleur du timer (rouge intense)
  const timerColor = timerMs < 500 ? COLORS.danger : COLORS.warning;

  return (
    <AbsoluteFill>
      <style>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>

      {/* Background avec glow rouge */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: COLORS.bg.dark,
        }}
      />

      {/* Ambient glow intense */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1000,
          height: 1000,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${timerColor}30 0%, transparent 60%)`,
          filter: `blur(${glowIntensity}px)`,
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 40%, #00000080 100%)',
          opacity: vignetteOpacity,
        }}
      />

      {/* Content avec shake + zoom */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px) scale(${zoom})`,
        }}
      >
        {/* Timer en grand (focus principal) */}
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
              color: timerColor,
              textShadow: `0 0 ${glowIntensity}px ${timerColor}`,
              letterSpacing: 8,
              lineHeight: 1,
            }}
          >
            0:{(timerMs).toString().padStart(3, '0')}
          </div>
        </div>

        {/* Produit en arrière-plan (blur) */}
        <div
          style={{
            position: 'absolute',
            top: '65%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            filter: `blur(${EFFECTS.blur.light}px)`,
            opacity: 0.6,
          }}
        >
          <div style={{ fontSize: 80, marginBottom: 10 }}>📱</div>
          <p
            style={{
              fontSize: FONTS.size.medium,
              color: COLORS.text.secondary,
              margin: 0,
              fontWeight: FONTS.weight.bold,
            }}
          >
            iPhone 17 Pro Max
          </p>
        </div>

        {/* Button zone */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '50%',
            transform: `translate(-50%, 0) scale(${isClicking ? 0.92 : 1})`,
            transition: 'transform 0.08s ease-out',
          }}
        >
          <div
            style={{
              padding: '35px 90px',
              background: `linear-gradient(135deg, ${COLORS.neon.pink} 0%, ${COLORS.danger} 100%)`,
              borderRadius: 20,
              boxShadow: `0 0 ${glowIntensity}px ${COLORS.neon.pink}80, 0 15px 40px rgba(0,0,0,0.5)`,
            }}
          >
            <span
              style={{
                fontSize: FONTS.size.big,
                fontWeight: FONTS.weight.black,
                color: COLORS.text.primary,
                letterSpacing: 4,
              }}
            >
              CLIQUER !
            </span>
          </div>
        </div>
      </div>

      {/* Curseur frénétique */}
      <Cursor x={cursorX} y={cursorY} clicking={isClicking} />

      {/* Particles de stress */}
      {isClicking && (
        <>
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 50 + Math.random() * 30;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: cursorX + Math.cos(angle) * distance,
                  top: cursorY + Math.sin(angle) * distance,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: i % 2 ? COLORS.neon.pink : COLORS.danger,
                  opacity: 0.7,
                  boxShadow: `0 0 ${EFFECTS.glow.min}px ${i % 2 ? COLORS.neon.pink : COLORS.danger}`,
                }}
              />
            );
          })}
        </>
      )}

      {/* Compteur rapide */}
      <div
        style={{
          position: 'absolute',
          top: 50,
          right: 50,
          fontSize: FONTS.size.medium,
          fontWeight: FONTS.weight.black,
          color: COLORS.text.secondary,
        }}
      >
        {clickCount} clics
      </div>
    </AbsoluteFill>
  );
};

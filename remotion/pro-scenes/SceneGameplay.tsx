import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS, EASING, EFFECTS, FONTS, SCENE_START, SCENE_DURATION } from '../config/theme';

/**
 * SCÈNE 3 — GAMEPLAY (9s)
 *
 * - Carte produit visible
 * - Timer qui descend
 * - Curseur qui clique
 * - Timer reset après clic
 * - Accélération progressive du rythme
 * - Zoom dynamique sur le timer
 *
 * 👉 On doit RESSENTIR la montée en puissance
 */

// Cursor avec état de clic
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
      transform: clicking ? 'scale(0.85)' : 'scale(1)',
      transition: 'transform 0.1s ease-out',
    }}
  >
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M3 3 L3 20 L8 15 L11 23 L13 22 L10 14 L17 14 Z"
        fill="#FFFFFF"
        stroke={COLORS.neon.purple}
        strokeWidth="2"
        filter={`drop-shadow(0 0 ${EFFECTS.glow.min}px ${COLORS.neon.purple})`}
      />
    </svg>

    {/* Ripple au clic */}
    {clicking && (
      <div
        style={{
          position: 'absolute',
          top: -5,
          left: -5,
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: `3px solid ${COLORS.neon.purple}`,
          opacity: 0,
          animation: 'ripple 0.5s ease-out',
        }}
      />
    )}
  </div>
);

export const SceneGameplay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - SCENE_START.gameplay;

  // Transition d'entrée
  const entranceOpacity = interpolate(
    relativeFrame,
    [0, 20],
    [0, 1],
    { extrapolateRight: 'clamp', easing: EASING.smooth }
  );

  // === SYSTÈME DE CLICS ===

  // Définir les moments de clic (accélération progressive)
  const clickTimings = [
    30,   // Premier clic lent
    90,   // Deuxième clic
    140,  // Accélération
    180,  // Accélération
    210,  // Plus rapide
    235,  // Plus rapide
    255,  // Très rapide
  ];

  // Trouver le dernier clic passé
  const currentClickIndex = clickTimings.findIndex((timing) => relativeFrame < timing + 10);
  const lastClickFrame = clickTimings[Math.max(0, (currentClickIndex === -1 ? clickTimings.length : currentClickIndex) - 1)];
  const clickCount = currentClickIndex === -1 ? clickTimings.length : Math.max(0, currentClickIndex);

  // État de clic (true pendant 5 frames après le clic)
  const isClicking = clickTimings.some((timing) =>
    relativeFrame >= timing && relativeFrame < timing + 5
  );

  // Timer countdown (reset après chaque clic)
  const timeSinceLastClick = relativeFrame - lastClickFrame;
  const timerValue = Math.max(0, 60 - Math.floor(timeSinceLastClick / fps * 1000));

  // === ANIMATIONS ===

  // Zoom dynamique sur le timer (intensifie au fil du temps)
  const zoomIntensity = interpolate(
    clickCount,
    [0, clickTimings.length],
    [1, 1.15],
    { easing: EASING.smooth }
  );

  const timerScale = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 100, stiffness: 200 },
    from: 1,
    to: zoomIntensity,
  });

  // Cursor movement (suit le bouton de clic)
  const cursorBaseX = 960;
  const cursorBaseY = 650;

  // Léger mouvement vers le bouton avant chaque clic
  const nextClickTiming = clickTimings.find((t) => t > relativeFrame) || clickTimings[clickTimings.length - 1];
  const anticipation = interpolate(
    relativeFrame,
    [nextClickTiming - 10, nextClickTiming],
    [0, 8],
    { extrapolateRight: 'clamp', easing: EASING.smooth }
  );

  const cursorX = cursorBaseX + Math.sin(frame / 20) * 10;
  const cursorY = cursorBaseY - anticipation;

  // Glow du bouton (intensifie avec les clics)
  const buttonGlow = EFFECTS.glow.min + Math.sin(frame / 10) * EFFECTS.glow.pulse + clickCount * 2;

  // Couleur du timer (devient rouge quand proche de 0)
  const timerColor = timerValue < 20 ? COLORS.danger : COLORS.neon.cyan;

  return (
    <AbsoluteFill>
      {/* CSS animations */}
      <style>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>

      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: COLORS.bg.dark,
          opacity: entranceOpacity,
        }}
      />

      {/* Game card */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${timerScale})`,
          opacity: entranceOpacity,
        }}
      >
        {/* Produit */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 120,
              marginBottom: 20,
              filter: `drop-shadow(0 10px 30px rgba(0,0,0,0.4))`,
            }}
          >
            📱
          </div>
          <h2
            style={{
              fontSize: FONTS.size.large,
              fontWeight: FONTS.weight.bold,
              color: COLORS.text.primary,
              margin: 0,
              marginBottom: 8,
            }}
          >
            iPhone 17 Pro Max
          </h2>
          <p
            style={{
              fontSize: FONTS.size.normal,
              color: COLORS.text.secondary,
              margin: 0,
            }}
          >
            Valeur: <span style={{ color: COLORS.success, fontWeight: FONTS.weight.bold }}>1 699€</span>
          </p>
        </div>

        {/* Timer */}
        <div
          style={{
            padding: '20px 40px',
            background: `${COLORS.bg.lighter}80`,
            border: `3px solid ${timerColor}40`,
            borderRadius: 16,
            textAlign: 'center',
            marginBottom: 30,
            boxShadow: `0 0 ${EFFECTS.glow.min}px ${timerColor}40`,
          }}
        >
          <p
            style={{
              fontSize: FONTS.size.small,
              color: COLORS.text.secondary,
              margin: 0,
              marginBottom: 8,
              letterSpacing: 2,
              fontWeight: FONTS.weight.semibold,
            }}
          >
            TEMPS RESTANT
          </p>
          <p
            style={{
              fontSize: FONTS.size.huge,
              fontWeight: FONTS.weight.black,
              color: timerColor,
              margin: 0,
              textShadow: `0 0 ${EFFECTS.glow.min}px ${timerColor}80`,
              letterSpacing: 4,
            }}
          >
            {Math.floor(timerValue / 1000)}:{(timerValue % 1000).toString().padStart(3, '0')}
          </p>
        </div>

        {/* Click button */}
        <div
          style={{
            padding: '30px 80px',
            background: `linear-gradient(135deg, ${COLORS.neon.purple} 0%, ${COLORS.neon.pink} 100%)`,
            borderRadius: 20,
            textAlign: 'center',
            boxShadow: `0 0 ${buttonGlow}px ${COLORS.neon.purple}60, 0 10px 30px rgba(0,0,0,0.3)`,
            transform: isClicking ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.1s ease-out',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              fontSize: FONTS.size.big,
              fontWeight: FONTS.weight.black,
              color: COLORS.text.primary,
              letterSpacing: 3,
            }}
          >
            CLIQUER
          </span>
        </div>

        {/* Compteur de clics */}
        <p
          style={{
            fontSize: FONTS.size.normal,
            color: COLORS.text.secondary,
            textAlign: 'center',
            marginTop: 30,
            fontWeight: FONTS.weight.semibold,
          }}
        >
          {clickCount} clic{clickCount > 1 ? 's' : ''}
        </p>
      </div>

      {/* Curseur */}
      {relativeFrame > 15 && <Cursor x={cursorX} y={cursorY} clicking={isClicking} />}

      {/* Indicateur visuel d'accélération (particules légères) */}
      {isClicking && (
        <>
          {[...Array(6)].map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const distance = 40;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: cursorX + Math.cos(angle) * distance,
                  top: cursorY + Math.sin(angle) * distance,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: COLORS.neon.purple,
                  opacity: 0.6,
                  boxShadow: `0 0 ${EFFECTS.glow.min}px ${COLORS.neon.purple}`,
                }}
              />
            );
          })}
        </>
      )}
    </AbsoluteFill>
  );
};

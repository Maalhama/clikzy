import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { COLORS, SPRING_CONFIG } from './config/constants';

/**
 * CLIKZY - TikTok/Reels AD (9:16)
 * Pub ultra-dynamique : 13.5s
 * Max 2s par séquence, transitions constantes
 */

//=============================================================================
// 1. HOOK (0.5s) - Accroche choc
//=============================================================================

const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 300 },
    from: 0,
    to: 1,
  });

  const glowPulse = 30 + Math.sin(frame / 3) * 10;

  return (
    <AbsoluteFill style={{ background: COLORS.bg.darker }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${scale})`,
        }}
      >
        <div style={{ fontSize: 200, marginBottom: 30 }}>📱</div>
        <h1
          style={{
            fontSize: 90,
            fontWeight: 900,
            margin: 0,
            background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.neon.cyan} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 ${glowPulse}px ${COLORS.success})`,
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          GAGNE UN
          <br />
          iPHONE
        </h1>
      </div>
    </AbsoluteFill>
  );
};

//=============================================================================
// 2. PROBLEM (1s) - Question engageante
//=============================================================================

const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  const emojiScale = spring({
    frame,
    fps,
    config: SPRING_CONFIG.bouncy,
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bg.dark }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
          opacity: textOpacity,
        }}
      >
        <div
          style={{
            fontSize: 140,
            marginBottom: 40,
            transform: `scale(${emojiScale})`,
          }}
        >
          🤔
        </div>
        <h2
          style={{
            fontSize: 70,
            fontWeight: 700,
            color: COLORS.text.primary,
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Tu scrolles
          <br />
          toute la journée...
        </h2>
        <p
          style={{
            fontSize: 46,
            color: COLORS.text.secondary,
            textAlign: 'center',
            marginTop: 40,
          }}
        >
          Et si ça rapportait ?
        </p>
      </div>
    </AbsoluteFill>
  );
};

//=============================================================================
// 3. SOLUTION (1.5s) - Présentation rapide
//=============================================================================

const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoEntrance = spring({
    frame,
    fps,
    config: SPRING_CONFIG.snappy,
  });

  const textDelay = 0.4 * fps;
  const textOpacity = interpolate(frame, [textDelay, textDelay + 0.3 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const glowPulse = 15 + Math.sin(frame / 8) * 5;

  return (
    <AbsoluteFill style={{ background: COLORS.bg.dark }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        <h1
          style={{
            fontSize: 160,
            fontWeight: 900,
            margin: 0,
            marginBottom: 50,
            background: `linear-gradient(135deg, ${COLORS.neon.purple} 0%, ${COLORS.neon.pink} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 ${glowPulse}px ${COLORS.neon.purple}60)`,
            transform: `scale(${logoEntrance})`,
          }}
        >
          CLIKZY
        </h1>
        <div style={{ opacity: textOpacity }}>
          <p
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: COLORS.text.primary,
              textAlign: 'center',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            Chaque clic =
            <br />
            <span style={{ color: COLORS.neon.cyan }}>une chance de gagner</span>
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

//=============================================================================
// 4. GAMEPLAY MONTAGE (6s) - Ultra rapide, découpage en mini-séquences
//=============================================================================

const SceneGameplay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Découpage en mini-phases
  const phase = Math.floor(frame / (0.8 * fps)); // Change toutes les 0.8s

  // Clics automatiques rapides
  const clickInterval = interpolate(phase, [0, 7], [20, 5]); // Accélère
  const isClicking = Math.floor(frame % clickInterval) < 3;

  // Compteur qui monte vite
  const clickCount = Math.floor(frame / 3);

  // Timer qui descend
  const timerMs = Math.max(0, 999 - Math.floor((frame / fps) * 250));

  // Zoom progressif
  const zoom = interpolate(phase, [0, 7], [1, 1.3], {
    easing: Easing.inOut(Easing.quad),
  });

  // Shake qui intensifie
  const shakeIntensity = interpolate(phase, [0, 7], [0, 5]);
  const shakeX = Math.sin(frame / 2) * shakeIntensity;
  const shakeY = Math.cos(frame / 2.5) * shakeIntensity;

  // Glow qui intensifie
  const glow = interpolate(phase, [0, 7], [15, 40]);

  // Couleur timer (rouge à la fin)
  const timerColor = timerMs < 300 ? COLORS.danger : timerMs < 600 ? COLORS.warning : COLORS.neon.cyan;

  // Curseur frénétique
  const cursorX = 540 + Math.sin(frame / 2) * 20;
  const cursorY = 1350 + Math.cos(frame / 3) * 15;

  return (
    <AbsoluteFill style={{ background: COLORS.bg.dark }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px) scale(${zoom})`,
        }}
      >
        {/* Produit (petit, en haut) */}
        <div
          style={{
            position: 'absolute',
            top: 120,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 100, marginBottom: 15 }}>📱</div>
          <p style={{ fontSize: 36, fontWeight: 700, color: COLORS.text.primary, margin: 0 }}>
            iPhone 17 Pro
          </p>
        </div>

        {/* Timer ÉNORME (focus principal) */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 24,
              color: COLORS.text.secondary,
              margin: 0,
              marginBottom: 10,
              letterSpacing: 3,
              fontWeight: 600,
            }}
          >
            TEMPS RESTANT
          </p>
          <div
            style={{
              fontSize: 180,
              fontWeight: 900,
              color: timerColor,
              textShadow: `0 0 ${glow}px ${timerColor}`,
              letterSpacing: 4,
              lineHeight: 1,
            }}
          >
            0:{(timerMs).toString().padStart(3, '0')}
          </div>
        </div>

        {/* Button */}
        <div
          style={{
            position: 'absolute',
            bottom: 320,
            left: '50%',
            transform: `translateX(-50%) scale(${isClicking ? 0.9 : 1})`,
            transition: 'transform 0.05s',
          }}
        >
          <div
            style={{
              padding: '50px 110px',
              background: `linear-gradient(135deg, ${phase > 4 ? COLORS.danger : COLORS.neon.purple} 0%, ${COLORS.neon.pink} 100%)`,
              borderRadius: 28,
              boxShadow: `0 0 ${glow}px ${COLORS.neon.purple}80, 0 10px 40px rgba(0,0,0,0.4)`,
            }}
          >
            <span style={{ fontSize: 80, fontWeight: 900, color: COLORS.text.primary }}>
              CLIQUER
            </span>
          </div>
        </div>

        {/* Compteur */}
        <div
          style={{
            position: 'absolute',
            bottom: 190,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 50,
            fontWeight: 900,
            color: COLORS.success,
          }}
        >
          {clickCount} CLICS
        </div>

        {/* Curseur */}
        <div
          style={{
            position: 'absolute',
            left: cursorX,
            top: cursorY,
            width: 36,
            height: 36,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36">
            <path
              d="M4 4 L4 26 L11 19 L14 30 L17 29 L14 18 L23 18 Z"
              fill="#FFFFFF"
              stroke={COLORS.neon.pink}
              strokeWidth="2.5"
              filter={`drop-shadow(0 0 ${glow / 2}px ${COLORS.neon.pink})`}
            />
          </svg>
        </div>

        {/* Particules de stress */}
        {isClicking &&
          [...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 60;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: cursorX + Math.cos(angle) * dist,
                  top: cursorY + Math.sin(angle) * dist,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: COLORS.neon.pink,
                  boxShadow: `0 0 10px ${COLORS.neon.pink}`,
                }}
              />
            );
          })}
      </div>
    </AbsoluteFill>
  );
};

//=============================================================================
// 5. PRODUCTS FLASH (2s) - Défilement rapide
//=============================================================================

const SceneProducts: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const products = [
    { emoji: '📱', name: 'iPhone 17 Pro', value: '1 699€', color: COLORS.neon.purple },
    { emoji: '🎮', name: 'PlayStation 5', value: '549€', color: COLORS.neon.pink },
    { emoji: '💻', name: 'MacBook Pro', value: '2 499€', color: COLORS.neon.cyan },
    { emoji: '🎧', name: 'AirPods Max', value: '629€', color: COLORS.neon.blue },
  ];

  const currentIndex = Math.floor((frame / fps) * 2.5) % products.length; // Change rapide
  const product = products[currentIndex];

  const entrance = spring({
    frame: frame % (0.5 * fps),
    fps,
    config: { damping: 15, stiffness: 400 },
  });

  const scale = interpolate(entrance, [0, 1], [0.5, 1]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

  const glowPulse = 25 + Math.sin(frame / 5) * 10;

  return (
    <AbsoluteFill style={{ background: COLORS.bg.darker }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        <div
          style={{
            fontSize: 240,
            marginBottom: 40,
            filter: `drop-shadow(0 20px ${glowPulse}px ${product.color})`,
          }}
        >
          {product.emoji}
        </div>
        <h2
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: COLORS.text.primary,
            margin: 0,
            marginBottom: 20,
          }}
        >
          {product.name}
        </h2>
        <p
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: product.color,
            margin: 0,
            textShadow: `0 0 ${glowPulse}px ${product.color}`,
          }}
        >
          {product.value}
        </p>
      </div>

      {/* Indicateur */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 32,
          color: COLORS.text.secondary,
        }}
      >
        {currentIndex + 1} / {products.length}
      </div>
    </AbsoluteFill>
  );
};

//=============================================================================
// 6. WIN (1s) - Victoire explosive
//=============================================================================

const SceneWin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const flash = interpolate(frame, [0, 3, 8], [0, 1, 0], {
    extrapolateRight: 'clamp',
  });

  const textEntrance = spring({
    frame: frame - 0.2 * fps,
    fps,
    config: { damping: 10, stiffness: 300 },
  });

  const scale = interpolate(textEntrance, [0, 1], [0.3, 1]);

  const glowPulse = 35 + Math.sin(frame / 4) * 15;

  return (
    <AbsoluteFill style={{ background: COLORS.bg.dark }}>
      {/* Flash blanc */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#FFFFFF',
          opacity: flash,
        }}
      />

      {/* Glow victoire */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1000,
          height: 1000,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.success}40 0%, transparent 70%)`,
          filter: `blur(${glowPulse * 2}px)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${scale})`,
        }}
      >
        <div style={{ fontSize: 220, marginBottom: 40 }}>🏆</div>
        <h1
          style={{
            fontSize: 150,
            fontWeight: 900,
            margin: 0,
            background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.neon.cyan} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 ${glowPulse}px ${COLORS.success})`,
          }}
        >
          GAGNÉ !
        </h1>
      </div>
    </AbsoluteFill>
  );
};

//=============================================================================
// 7. CTA (1.5s) - Call to action
//=============================================================================

const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoEntrance = spring({
    frame,
    fps,
    config: SPRING_CONFIG.smooth,
  });

  const ctaDelay = 0.5 * fps;
  const ctaOpacity = interpolate(frame, [ctaDelay, ctaDelay + 0.4 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const buttonPulse = 1 + Math.sin(frame / 10) * 0.05;

  const glowPulse = 15 + Math.sin(frame / 8) * 5;

  return (
    <AbsoluteFill style={{ background: COLORS.bg.dark }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {/* Logo */}
        <h1
          style={{
            fontSize: 150,
            fontWeight: 900,
            margin: 0,
            marginBottom: 80,
            background: `linear-gradient(135deg, ${COLORS.neon.purple} 0%, ${COLORS.neon.pink} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 ${glowPulse}px ${COLORS.neon.purple}60)`,
            opacity: logoEntrance,
          }}
        >
          CLIKZY
        </h1>

        {/* CTA */}
        <div style={{ opacity: ctaOpacity }}>
          <div
            style={{
              padding: '35px 70px',
              background: `linear-gradient(135deg, ${COLORS.neon.purple} 0%, ${COLORS.neon.pink} 100%)`,
              borderRadius: 100,
              marginBottom: 50,
              boxShadow: `0 0 ${glowPulse * 2}px ${COLORS.neon.purple}60`,
              transform: `scale(${buttonPulse})`,
            }}
          >
            <p
              style={{
                fontSize: 62,
                fontWeight: 900,
                color: COLORS.text.primary,
                margin: 0,
                letterSpacing: 2,
              }}
            >
              JOUE MAINTENANT
            </p>
          </div>

          <p
            style={{
              fontSize: 54,
              fontWeight: 700,
              color: COLORS.neon.cyan,
              margin: 0,
              textAlign: 'center',
              textShadow: `0 0 ${glowPulse / 2}px ${COLORS.neon.cyan}`,
            }}
          >
            cleekzy.com
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

//=============================================================================
// COMPOSITION PRINCIPALE - Ultra dynamique avec transitions variées
//=============================================================================

export const ClikzyAd: React.FC = () => {
  const { fps } = useVideoConfig();

  const transitionFast = 0.3; // 9 frames
  const transitionMedium = 0.4; // 12 frames

  return (
    <TransitionSeries>
      {/* 1. HOOK (0.5s) */}
      <TransitionSeries.Sequence durationInFrames={0.5 * fps}>
        <SceneHook />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={flip({ direction: 'from-left' })}
        timing={linearTiming({ durationInFrames: transitionFast * fps })}
      />

      {/* 2. PROBLEM (1s) */}
      <TransitionSeries.Sequence durationInFrames={1 * fps}>
        <SceneProblem />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={linearTiming({ durationInFrames: transitionFast * fps })}
      />

      {/* 3. SOLUTION (1.5s) */}
      <TransitionSeries.Sequence durationInFrames={1.5 * fps}>
        <SceneSolution />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={wipe({ direction: 'from-bottom' })}
        timing={linearTiming({ durationInFrames: transitionMedium * fps })}
      />

      {/* 4. GAMEPLAY (6s) */}
      <TransitionSeries.Sequence durationInFrames={6 * fps}>
        <SceneGameplay />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionFast * fps })}
      />

      {/* 5. PRODUCTS (2s) */}
      <TransitionSeries.Sequence durationInFrames={2 * fps}>
        <SceneProducts />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-top' })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: transitionMedium * fps })}
      />

      {/* 6. WIN (1s) */}
      <TransitionSeries.Sequence durationInFrames={1 * fps}>
        <SceneWin />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionFast * fps })}
      />

      {/* 7. CTA (1.5s) */}
      <TransitionSeries.Sequence durationInFrames={1.5 * fps}>
        <SceneCTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

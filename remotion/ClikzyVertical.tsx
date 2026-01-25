import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { COLORS, SPRING_CONFIG, DURATION, TRANSITION_DURATION } from './config/constants';

/**
 * CLIKZY - Promo TikTok/Reels (9:16)
 * Format: 1080x1920 (vertical)
 * Durée: 30s
 *
 * Best practices Remotion:
 * - @remotion/transitions pour transitions professionnelles
 * - spring() avec configs officielles
 * - Pas de CSS animations
 * - interpolate() avec easing professionnels
 */

//=============================================================================
// SCENE 1: INTRO (2.5s)
//=============================================================================

const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 0.7 * fps], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  const scale = spring({
    frame,
    fps,
    config: SPRING_CONFIG.smooth,
    from: 1.1,
    to: 1,
  });

  const glowPulse = interpolate(Math.sin(frame / 15), [-1, 1], [10, 15]);

  return (
    <AbsoluteFill style={{ background: COLORS.bg.dark }}>
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          textAlign: 'center',
          width: '90%',
        }}
      >
        <h1
          style={{
            fontSize: 90,
            fontWeight: 900,
            margin: 0,
            color: COLORS.text.primary,
            letterSpacing: 3,
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
            }}
          >
            Tu gagnes.
          </span>
        </h1>
      </div>
    </AbsoluteFill>
  );
};

//=============================================================================
// SCENE 2: GAMEPLAY (15s) - Build-up progressif
//=============================================================================

const Scene2Gameplay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Clics progressifs (accélération)
  const clickTimings = [
    0.5, 2, 3.5, 4.5, 5.3, 6, 6.6, 7.1, 7.5, 7.9, 8.2, 8.5, 8.7, 9, 9.2,
    9.4, 9.6, 9.8, 10, 10.2, 10.4, 10.6, 10.8, 11, 11.2,
  ].map((t) => t * fps);

  const isClicking = clickTimings.some((t) => frame >= t && frame < t + 4);
  const clickCount = clickTimings.filter((t) => frame >= t).length;

  // Timer countdown
  const lastClick = clickTimings.filter((t) => frame >= t).pop() || 0;
  const timeSinceClick = (frame - lastClick) / fps;
  const timerMs = Math.max(0, 900 - Math.floor(timeSinceClick * 1000));

  // Zoom + tension progressive
  const tension = interpolate(clickCount, [0, clickTimings.length], [1, 1.15], {
    easing: Easing.inOut(Easing.quad),
  });

  // Shake léger
  const shakeX = Math.sin(frame / 3) * interpolate(clickCount, [0, clickTimings.length], [0, 3]);
  const shakeY = Math.cos(frame / 4) * interpolate(clickCount, [0, clickTimings.length], [0, 3]);

  // Glow intense
  const glowIntensity = interpolate(clickCount, [0, clickTimings.length], [10, 30]);

  // Couleur timer (rouge si < 500ms)
  const timerColor = timerMs < 500 ? COLORS.danger : timerMs < 700 ? COLORS.warning : COLORS.neon.cyan;

  // Cursor
  const cursorX = 540 + Math.sin(frame / 3) * 15;
  const cursorY = 1350 + (isClicking ? 5 : 0);

  return (
    <AbsoluteFill style={{ background: COLORS.bg.dark }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px) scale(${tension})`,
        }}
      >
        {/* Produit */}
        <div
          style={{
            position: 'absolute',
            top: 180,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 140, marginBottom: 20 }}>📱</div>
          <h2
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: COLORS.text.primary,
              margin: 0,
            }}
          >
            iPhone 17 Pro Max
          </h2>
          <p style={{ fontSize: 28, color: COLORS.success, fontWeight: 700, marginTop: 10 }}>
            1 699€
          </p>
        </div>

        {/* Timer (focus principal) */}
        <div
          style={{
            position: 'absolute',
            top: 550,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 20,
              color: COLORS.text.secondary,
              margin: 0,
              marginBottom: 15,
              letterSpacing: 2,
              fontWeight: 600,
            }}
          >
            TEMPS RESTANT
          </p>
          <div
            style={{
              fontSize: 140,
              fontWeight: 900,
              color: timerColor,
              textShadow: `0 0 ${glowIntensity}px ${timerColor}`,
              letterSpacing: 4,
            }}
          >
            0:{(timerMs).toString().padStart(3, '0')}
          </div>
        </div>

        {/* Button */}
        <div
          style={{
            position: 'absolute',
            bottom: 350,
            left: '50%',
            transform: `translateX(-50%) scale(${isClicking ? 0.92 : 1})`,
          }}
        >
          <div
            style={{
              padding: '40px 100px',
              background: `linear-gradient(135deg, ${clickCount > 15 ? COLORS.neon.pink : COLORS.neon.purple} 0%, ${clickCount > 15 ? COLORS.danger : COLORS.neon.pink} 100%)`,
              borderRadius: 24,
              boxShadow: `0 0 ${glowIntensity}px ${COLORS.neon.purple}80`,
            }}
          >
            <span style={{ fontSize: 70, fontWeight: 900, color: COLORS.text.primary, letterSpacing: 3 }}>
              CLIQUER
            </span>
          </div>
        </div>

        {/* Compteur */}
        <div
          style={{
            position: 'absolute',
            bottom: 200,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 32,
            fontWeight: 700,
            color: COLORS.text.secondary,
          }}
        >
          {clickCount} clic{clickCount > 1 ? 's' : ''}
        </div>

        {/* Cursor */}
        <div
          style={{
            position: 'absolute',
            left: cursorX,
            top: cursorY,
            width: 32,
            height: 32,
            zIndex: 100,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32">
            <path
              d="M4 4 L4 24 L10 18 L13 28 L16 27 L13 17 L21 17 Z"
              fill="#FFFFFF"
              stroke={COLORS.neon.pink}
              strokeWidth="2"
              filter={`drop-shadow(0 0 ${glowIntensity / 2}px ${COLORS.neon.pink})`}
            />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

//=============================================================================
// SCENE 3: WIN (4.5s)
//=============================================================================

const Scene3Win: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Flash initial
  const flashOpacity = interpolate(frame, [0, 5, 15], [0, 1, 0], {
    extrapolateRight: 'clamp',
  });

  // "Gagné." avec bounce
  const textEntrance = spring({
    frame: frame - 0.8 * fps,
    fps,
    config: SPRING_CONFIG.bouncy,
  });

  const textScale = interpolate(textEntrance, [0, 1], [0.5, 1]);
  const textOpacity = interpolate(frame, [0.8 * fps, 1.5 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Produit
  const productEntrance = spring({
    frame: frame - 1.7 * fps,
    fps,
    config: SPRING_CONFIG.smooth,
  });

  const productScale = interpolate(productEntrance, [0, 1], [0.7, 1]);
  const productOpacity = interpolate(frame, [1.7 * fps, 2.4 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const glowPulse = interpolate(Math.sin(frame / 10), [-1, 1], [15, 25]);

  return (
    <AbsoluteFill style={{ background: COLORS.bg.dark }}>
      {/* Flash */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#FFFFFF',
          opacity: flashOpacity,
        }}
      />

      {/* Glow victoire */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.success}30 0%, transparent 70%)`,
          filter: `blur(${glowPulse * 3}px)`,
        }}
      />

      {/* "Gagné." */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${textScale})`,
          opacity: textOpacity,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 130,
            fontWeight: 900,
            margin: 0,
            background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.neon.cyan} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 ${glowPulse}px ${COLORS.success}80)`,
          }}
        >
          Gagné.
        </h1>
      </div>

      {/* Produit */}
      <div
        style={{
          position: 'absolute',
          top: '58%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${productScale})`,
          opacity: productOpacity,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            padding: '50px 60px',
            background: `${COLORS.bg.lighter}CC`,
            border: `3px solid ${COLORS.success}40`,
            borderRadius: 28,
            boxShadow: `0 0 ${glowPulse}px ${COLORS.success}40`,
          }}
        >
          <div style={{ fontSize: 120, marginBottom: 25 }}>📱</div>
          <h2 style={{ fontSize: 54, fontWeight: 900, color: COLORS.text.primary, margin: 0, marginBottom: 12 }}>
            iPhone 17 Pro Max
          </h2>
          <p style={{ fontSize: 42, color: COLORS.success, margin: 0, fontWeight: 700 }}>1 699€</p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

//=============================================================================
// SCENE 4: OUTRO (3.5s)
//=============================================================================

const Scene4Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoEntrance = spring({
    frame,
    fps,
    config: SPRING_CONFIG.smooth,
  });

  const logoScale = interpolate(logoEntrance, [0, 1], [0.9, 1]);
  const logoOpacity = interpolate(logoEntrance, [0, 1], [0, 1]);

  const ctaOpacity = interpolate(frame, [0.8 * fps, 1.5 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const glowPulse = interpolate(Math.sin(frame / 12), [-1, 1], [10, 15]);

  return (
    <AbsoluteFill style={{ background: COLORS.bg.dark }}>
      {/* Logo */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${logoScale})`,
          opacity: logoOpacity,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 140,
            fontWeight: 900,
            margin: 0,
            background: `linear-gradient(135deg, ${COLORS.neon.purple} 0%, ${COLORS.neon.pink} 50%, ${COLORS.neon.cyan} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 6,
            filter: `drop-shadow(0 0 ${glowPulse}px ${COLORS.neon.purple}60)`,
          }}
        >
          CLIKZY
        </h1>
      </div>

      {/* CTA */}
      <div
        style={{
          position: 'absolute',
          top: '62%',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: ctaOpacity,
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 52, fontWeight: 700, color: COLORS.text.primary, margin: 0, marginBottom: 40, letterSpacing: 2 }}>
          Joue gratuitement.
        </p>
        <div
          style={{
            padding: '28px 60px',
            background: `${COLORS.neon.purple}15`,
            border: `2px solid ${COLORS.neon.purple}50`,
            borderRadius: 100,
            boxShadow: `0 0 ${glowPulse}px ${COLORS.neon.purple}30`,
          }}
        >
          <p style={{ fontSize: 56, fontWeight: 700, color: COLORS.neon.cyan, margin: 0, letterSpacing: 2 }}>
            cleekzy.com
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

//=============================================================================
// COMPOSITION PRINCIPALE avec @remotion/transitions
//=============================================================================

export const ClikzyVertical: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <TransitionSeries>
      {/* Scene 1: Intro (2.5s) */}
      <TransitionSeries.Sequence durationInFrames={DURATION.intro * fps}>
        <Scene1Intro />
      </TransitionSeries.Sequence>

      {/* Transition fade */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION * fps })}
      />

      {/* Scene 2: Gameplay (15s) */}
      <TransitionSeries.Sequence durationInFrames={15 * fps}>
        <Scene2Gameplay />
      </TransitionSeries.Sequence>

      {/* Transition slide */}
      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-bottom' })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION * fps })}
      />

      {/* Scene 3: Win (4.5s) */}
      <TransitionSeries.Sequence durationInFrames={DURATION.win * fps}>
        <Scene3Win />
      </TransitionSeries.Sequence>

      {/* Transition fade */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION * fps })}
      />

      {/* Scene 4: Outro (3.5s) */}
      <TransitionSeries.Sequence durationInFrames={DURATION.outro * fps}>
        <Scene4Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

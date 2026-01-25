import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Easing, zoomTransition } from '../components/Transition';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Glow pulse sophistiqué
  const glowIntensity = interpolate(
    Math.sin(frame / 8),
    [-1, 1],
    [40, 80]
  );

  // Rotation subtile du gradient
  const gradientRotation = interpolate(
    frame,
    [0, 60],
    [0, 15],
    { easing: Easing.easeInOutCubic }
  );

  // Transition zoom + fade
  const transition = zoomTransition(frame, 0, 30, 1.5, 1);

  // Lettres individuelles avec animation décalée
  const letters = 'CLEEKZY'.split('');

  return (
    <AbsoluteFill>
      {/* Gradient background animé */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${135 + gradientRotation}deg, #0B0F1A 0%, #1a0f2e 30%, #141B2D 70%, #1E2942 100%)`,
        }}
      />

      {/* Effets de lumière ambiant */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155, 92, 255, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 79, 216, 0.12) 0%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'float 8s ease-in-out infinite 2s',
        }}
      />

      {/* Logo principal */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) ${transition.transform}`,
          opacity: transition.opacity,
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Glow layer derrière */}
          <div
            style={{
              position: 'absolute',
              inset: -20,
              background: `radial-gradient(circle, rgba(155, 92, 255, 0.4) 0%, transparent 70%)`,
              filter: `blur(${glowIntensity}px)`,
              zIndex: 0,
            }}
          />

          {/* Texte principal avec lettres animées */}
          <h1
            style={{
              fontSize: 180,
              fontWeight: 900,
              margin: 0,
              letterSpacing: 16,
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              gap: 8,
            }}
          >
            {letters.map((letter, i) => {
              const delay = i * 3;
              const letterOpacity = interpolate(
                frame,
                [delay, delay + 12],
                [0, 1],
                { extrapolateRight: 'clamp', easing: Easing.easeOutExpo }
              );

              const letterY = interpolate(
                frame,
                [delay, delay + 15],
                [30, 0],
                { extrapolateRight: 'clamp', easing: Easing.easeOutBack }
              );

              return (
                <span
                  key={i}
                  style={{
                    background: 'linear-gradient(135deg, #9B5CFF 0%, #FF4FD8 50%, #3CCBFF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    backgroundPosition: `${interpolate(frame, [0, 60], [0, 100])}% 50%`,
                    filter: `drop-shadow(0 0 ${glowIntensity * 0.6}px rgba(155, 92, 255, 0.8))`,
                    opacity: letterOpacity,
                    transform: `translateY(${letterY}px)`,
                    display: 'inline-block',
                  }}
                >
                  {letter}
                </span>
              );
            })}
          </h1>

          {/* Underline animé */}
          <div
            style={{
              width: interpolate(frame, [25, 50], [0, 100], {
                extrapolateRight: 'clamp',
                easing: Easing.easeOutExpo,
              }) + '%',
              height: 6,
              background: 'linear-gradient(90deg, #9B5CFF 0%, #FF4FD8 50%, #3CCBFF 100%)',
              borderRadius: 3,
              margin: '20px auto 0',
              boxShadow: `0 0 20px rgba(155, 92, 255, 0.8)`,
            }}
          />
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 32,
            color: '#8B9BB4',
            marginTop: 40,
            fontWeight: 600,
            opacity: interpolate(frame, [40, 55], [0, 1], {
              extrapolateRight: 'clamp',
              easing: Easing.easeInOutCubic,
            }),
            letterSpacing: 4,
          }}
        >
          CLIQUE. GAGNE. RÉPÈTE.
        </p>
      </div>
    </AbsoluteFill>
  );
};

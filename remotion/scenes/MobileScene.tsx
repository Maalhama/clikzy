import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { MobilePhone } from '../MobilePhone';
import { Easing as CustomEasing, slideTransition } from '../components/Transition';

// Cursor component amélioré
const Cursor: React.FC<{ x: number; y: number; clicking: boolean }> = ({ x, y, clicking }) => {
  const frame = useCurrentFrame();

  // Trail effect pour motion blur
  const trailOpacity = clicking ? 0.6 : 0;

  return (
    <>
      {/* Trails pour motion blur effect */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`trail-${i}`}
          style={{
            position: 'absolute',
            left: x - i * 3,
            top: y - i * 2,
            width: 40,
            height: 40,
            pointerEvents: 'none',
            opacity: trailOpacity * (1 - i * 0.15),
            zIndex: 999 - i,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M5 5 L5 30 L12 23 L16 35 L20 34 L16 22 L25 22 Z"
              fill="#EDEDED"
              stroke="#9B5CFF"
              strokeWidth="2"
              opacity={0.3 - i * 0.05}
            />
          </svg>
        </div>
      ))}

      {/* Cursor principal */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 40,
          height: 40,
          pointerEvents: 'none',
          zIndex: 1000,
          transform: clicking ? 'scale(0.9)' : 'scale(1)',
          transition: 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M5 5 L5 30 L12 23 L16 35 L20 34 L16 22 L25 22 Z"
            fill="#EDEDED"
            stroke="#9B5CFF"
            strokeWidth="2"
            filter="drop-shadow(0 0 10px rgba(155, 92, 255, 0.8))"
          />
        </svg>

        {/* Click ripple amélioré */}
        {clicking && (
          <>
            <div
              style={{
                position: 'absolute',
                top: -10,
                left: -10,
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: '4px solid #9B5CFF',
                opacity: 0,
                animation: 'ripple 0.6s ease-out',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(155, 92, 255, 0.6) 0%, transparent 70%)',
                filter: 'blur(10px)',
              }}
            />
          </>
        )}
      </div>
    </>
  );
};

export const MobileScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const sceneStart = 60;
  const sceneDuration = 180; // 6 secondes
  const relativeFrame = frame - sceneStart;

  // Transition d'entrée sophistiquée
  const phoneTransition = slideTransition(frame, sceneStart, 25, 'down', 50);

  // Scale avec elastic bounce
  const phoneScale = interpolate(
    relativeFrame,
    [0, 30],
    [0.7, 0.95],
    {
      extrapolateRight: 'clamp',
      easing: (t) => CustomEasing.easeOutElastic(t),
    }
  );

  // Glow pulse
  const glowIntensity = interpolate(
    Math.sin(frame / 12),
    [-1, 1],
    [30, 50]
  );

  // Animation du cursor
  const cursorStartFrame = 30;
  const cursorProgress = interpolate(
    relativeFrame,
    [cursorStartFrame, cursorStartFrame + 40],
    [0, 1],
    { extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1) }
  );

  // Position du cursor avec courbe organique
  const cursorX = width / 2 - 80 + cursorProgress * 160 + Math.sin(relativeFrame / 8) * 5;
  const cursorY = height / 2 + 80 + Math.sin(cursorProgress * Math.PI * 2) * 20;

  // Click animation
  const isClicking = relativeFrame >= cursorStartFrame + 40 &&
                     Math.floor((relativeFrame - cursorStartFrame - 40) / 5) % 2 === 0 &&
                     relativeFrame < sceneDuration - 20;

  // Compteur de clics avec animation
  const clickCount = Math.min(
    Math.floor(Math.max(0, relativeFrame - cursorStartFrame - 40) / 1.5),
    350
  );

  // Timer countdown
  const timeRemaining = Math.max(0, 45 - Math.floor(relativeFrame / 30));

  // Floating animation pour le téléphone
  const floatY = Math.sin(frame / 20) * 8;
  const floatRotate = Math.sin(frame / 30) * 1.5;

  return (
    <AbsoluteFill>
      {/* Background avec gradient animé */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #0B0F1A 0%, #141B2D 50%, #1E2942 100%)',
        }}
      />

      {/* Ambient lights */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(155, 92, 255, ${0.15 + glowIntensity * 0.002}) 0%, transparent 70%)`,
          filter: 'blur(100px)',
        }}
      />

      {/* Téléphone avec floating animation */}
      <div
        style={{
          ...phoneTransition,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${floatY}px)) scale(${phoneScale}) rotate(${floatRotate}deg)`,
          filter: `drop-shadow(0 ${20 + floatY}px ${60 + glowIntensity}px rgba(0, 0, 0, 0.5))`,
        }}
      >
        <MobilePhone scale={0.95}>
          <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header avec animation */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: 25,
                opacity: interpolate(relativeFrame, [10, 25], [0, 1]),
                transform: `translateY(${interpolate(relativeFrame, [10, 25], [20, 0], { extrapolateRight: 'clamp' })}px)`,
              }}
            >
              <h1
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  margin: 0,
                  background: 'linear-gradient(135deg, #9B5CFF 0%, #FF4FD8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(155, 92, 255, 0.9))',
                  letterSpacing: 3,
                }}
              >
                CLEEKZY
              </h1>
            </div>

            {/* Timer avec glow */}
            <div
              style={{
                background: 'rgba(155, 92, 255, 0.12)',
                border: '2px solid rgba(155, 92, 255, 0.4)',
                borderRadius: 18,
                padding: '14px 22px',
                textAlign: 'center',
                marginBottom: 22,
                boxShadow: `0 0 ${glowIntensity * 0.5}px rgba(155, 92, 255, 0.4)`,
                opacity: interpolate(relativeFrame, [15, 30], [0, 1]),
              }}
            >
              <div style={{ fontSize: 13, color: '#8B9BB4', marginBottom: 5, fontWeight: 600, letterSpacing: 1 }}>
                TEMPS RESTANT
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: timeRemaining < 10 ? '#FF4FD8' : '#3CCBFF',
                  textShadow: `0 0 20px ${timeRemaining < 10 ? 'rgba(255, 79, 216, 0.8)' : 'rgba(60, 203, 255, 0.8)'}`,
                  transition: 'color 0.3s',
                }}
              >
                00:{timeRemaining.toString().padStart(2, '0')}
              </div>
            </div>

            {/* Product */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: interpolate(relativeFrame, [20, 35], [0, 1]),
              }}
            >
              <div
                style={{
                  fontSize: 90,
                  marginBottom: 12,
                  transform: `scale(${1 + Math.sin(frame / 15) * 0.05})`,
                  filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))',
                }}
              >
                📱
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#EDEDED', marginBottom: 6, letterSpacing: 0.5 }}>
                iPhone 17 Pro Max
              </div>
              <div style={{ fontSize: 15, color: '#8B9BB4', fontWeight: 500 }}>
                Valeur: <span style={{ color: '#00FF88', fontWeight: 700 }}>1 699€</span>
              </div>
            </div>

            {/* Click button avec animation avancée */}
            <div style={{ marginBottom: 22 }}>
              <div
                style={{
                  width: '100%',
                  height: 150,
                  borderRadius: 26,
                  background: isClicking
                    ? 'linear-gradient(135deg, #FF4FD8 0%, #9B5CFF 100%)'
                    : 'linear-gradient(135deg, #9B5CFF 0%, #FF4FD8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  boxShadow: `0 0 ${glowIntensity}px rgba(155, 92, 255, 0.7), 0 10px 40px rgba(155, 92, 255, 0.3)`,
                  transform: isClicking ? 'scale(0.96)' : 'scale(1)',
                  transition: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Shimmer effect */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
                    transform: `translateX(${interpolate(frame % 60, [0, 60], [-100, 100])}%)`,
                  }}
                />

                <div style={{ fontSize: 56, fontWeight: 900, color: '#EDEDED', position: 'relative', zIndex: 1 }}>
                  {clickCount}
                </div>
                <div style={{ fontSize: 17, color: '#EDEDED', opacity: 0.9, fontWeight: 600, letterSpacing: 2 }}>
                  CLICS
                </div>
              </div>
            </div>

            {/* Stats avec pulse */}
            <div
              style={{
                fontSize: 13,
                color: '#8B9BB4',
                textAlign: 'center',
                fontWeight: 500,
                opacity: interpolate(relativeFrame, [25, 40], [0, 1]),
              }}
            >
              <span
                style={{
                  color: '#00FF88',
                  display: 'inline-block',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              >
                ●
              </span>{' '}
              {Math.floor(150 + Math.sin(frame / 10) * 30)} joueurs en ligne
            </div>
          </div>
        </MobilePhone>
      </div>

      {/* Cursor avec smooth movement */}
      {relativeFrame >= cursorStartFrame && (
        <Cursor x={cursorX} y={cursorY} clicking={isClicking} />
      )}

      {/* Particules de click */}
      {isClicking && (
        <>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: cursorX + Math.cos(angle) * distance,
                  top: cursorY + Math.sin(angle) * distance,
                  width: 6 + Math.random() * 4,
                  height: 6 + Math.random() * 4,
                  borderRadius: '50%',
                  background: '#9B5CFF',
                  opacity: 0.6,
                  boxShadow: '0 0 10px #9B5CFF',
                }}
              />
            );
          })}
        </>
      )}
    </AbsoluteFill>
  );
};

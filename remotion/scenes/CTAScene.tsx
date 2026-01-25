import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Easing, slideTransition } from '../components/Transition';

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneStart = 480;
  const relativeFrame = frame - sceneStart;

  // Main text transition
  const mainTextTransition = slideTransition(relativeFrame, 0, 25, 'up', 40);

  // URL transition
  const urlOpacity = interpolate(
    relativeFrame,
    [20, 35],
    [0, 1],
    { extrapolateRight: 'clamp', easing: Easing.easeOutExpo }
  );

  const urlScale = interpolate(
    relativeFrame,
    [20, 40],
    [0.8, 1],
    { extrapolateRight: 'clamp', easing: Easing.easeOutBack }
  );

  // Glow pulse intense
  const glowIntensity = 60 + Math.sin(frame / 6) * 30;

  // Background gradient animation
  const bgShift = interpolate(relativeFrame, [0, 120], [0, 50]);

  // Button pulse
  const buttonScale = 1 + Math.sin(frame / 10) * 0.05;

  return (
    <AbsoluteFill>
      {/* Dynamic gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, #0B0F1A 0%, #1a0f2e ${bgShift}%, #141B2D 100%)`,
        }}
      />

      {/* Multiple ambient lights */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155, 92, 255, 0.3) 0%, transparent 70%)',
          filter: `blur(${glowIntensity}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '25%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 79, 216, 0.25) 0%, transparent 70%)',
          filter: `blur(${glowIntensity * 0.8}px)`,
        }}
      />

      {/* Particles flottantes */}
      {[...Array(30)].map((_, i) => {
        const x = (i * 37) % 100;
        const y = ((i * 53) % 100 + (relativeFrame * 0.3) % 100) % 100;
        const size = 2 + (i % 4);
        const colors = ['#9B5CFF', '#FF4FD8', '#3CCBFF'];
        const color = colors[i % colors.length];

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: color,
              opacity: 0.15 + (i % 5) * 0.05,
              boxShadow: `0 0 ${size * 3}px ${color}`,
            }}
          />
        );
      })}

      {/* Main CTA */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        {/* "JOUE MAINTENANT" avec animation */}
        <div
          style={{
            ...mainTextTransition,
            marginBottom: 50,
          }}
        >
          {/* Glow layer derrière */}
          <div
            style={{
              position: 'absolute',
              inset: -40,
              background: 'radial-gradient(circle, rgba(155, 92, 255, 0.4) 0%, transparent 70%)',
              filter: `blur(${glowIntensity}px)`,
              zIndex: 0,
            }}
          />

          <h1
            style={{
              fontSize: 130,
              fontWeight: 900,
              margin: 0,
              background: 'linear-gradient(135deg, #9B5CFF 0%, #FF4FD8 50%, #3CCBFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '200% 200%',
              backgroundPosition: `${interpolate(frame, [sceneStart, sceneStart + 120], [0, 100])}% 50%`,
              filter: `drop-shadow(0 0 ${glowIntensity}px rgba(155, 92, 255, 1))`,
              letterSpacing: 8,
              position: 'relative',
              zIndex: 1,
              transform: `scale(${buttonScale})`,
            }}
          >
            JOUE MAINTENANT
          </h1>

          {/* Underline animé */}
          <div
            style={{
              width: '100%',
              height: 8,
              background: 'linear-gradient(90deg, #9B5CFF 0%, #FF4FD8 50%, #3CCBFF 100%)',
              borderRadius: 4,
              margin: '25px auto 0',
              boxShadow: `0 0 30px rgba(155, 92, 255, 0.8)`,
              transform: `scaleX(${interpolate(relativeFrame, [5, 20], [0, 1], { extrapolateRight: 'clamp' })})`,
            }}
          />
        </div>

        {/* URL cleekzy.com */}
        <div
          style={{
            opacity: urlOpacity,
            transform: `scale(${urlScale})`,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '25px 60px',
              background: 'linear-gradient(135deg, rgba(155, 92, 255, 0.2) 0%, rgba(255, 79, 216, 0.2) 100%)',
              border: '3px solid rgba(155, 92, 255, 0.5)',
              borderRadius: 100,
              boxShadow: `0 0 ${glowIntensity * 0.8}px rgba(155, 92, 255, 0.5), inset 0 0 40px rgba(155, 92, 255, 0.1)`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <p
              style={{
                fontSize: 68,
                color: '#3CCBFF',
                textShadow: `0 0 ${glowIntensity * 0.5}px rgba(60, 203, 255, 1)`,
                margin: 0,
                fontWeight: 800,
                letterSpacing: 4,
              }}
            >
              cleekzy.com
            </p>
          </div>

          {/* Arrow pointer */}
          <div
            style={{
              fontSize: 50,
              marginTop: 20,
              opacity: 0.5 + Math.sin(frame / 8) * 0.3,
              transform: `translateY(${Math.sin(frame / 8) * 8}px)`,
            }}
          >
            ⬇️
          </div>
        </div>
      </div>

      {/* Sparkles autour du CTA */}
      {[...Array(20)].map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const distance = 400 + Math.sin(frame / 12 + i) * 50;
        const sparkleSize = 6 + (i % 3) * 3;
        const sparkleOpacity = 0.3 + Math.sin(frame / 10 + i * 1.5) * 0.2;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${Math.cos(angle) * distance}px)`,
              top: `calc(50% + ${Math.sin(angle) * distance}px)`,
              width: sparkleSize,
              height: sparkleSize,
              background: i % 3 === 0 ? '#9B5CFF' : i % 3 === 1 ? '#FF4FD8' : '#3CCBFF',
              borderRadius: '50%',
              opacity: sparkleOpacity * urlOpacity,
              boxShadow: `0 0 ${sparkleSize * 3}px ${i % 3 === 0 ? '#9B5CFF' : i % 3 === 1 ? '#FF4FD8' : '#3CCBFF'}`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

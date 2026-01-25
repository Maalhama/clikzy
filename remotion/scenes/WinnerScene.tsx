import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Particles } from '../components/Particles';
import { Easing, zoomTransition } from '../components/Transition';

export const WinnerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneStart = 360;
  const relativeFrame = frame - sceneStart;

  // Trophy animation avec bounce
  const trophyTransition = zoomTransition(relativeFrame, 0, 25, 0.3, 1);

  // Rotation légère du trophée
  const trophyRotate = interpolate(
    Math.sin(frame / 15),
    [-1, 1],
    [-8, 8]
  );

  // Glow pulse
  const glowIntensity = 40 + Math.sin(frame / 8) * 20;

  // Text reveal avec elastic
  const textOpacity = interpolate(
    relativeFrame,
    [15, 30],
    [0, 1],
    { extrapolateRight: 'clamp', easing: Easing.easeOutExpo }
  );

  const textScale = interpolate(
    relativeFrame,
    [15, 35],
    [0.5, 1],
    { extrapolateRight: 'clamp', easing: Easing.easeOutElastic }
  );

  // Confetti burst par vagues
  const confettiWaves = Math.floor(relativeFrame / 15);

  return (
    <AbsoluteFill>
      {/* Background gradient animé */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #0B0F1A 0%, #1a2810 30%, #141B2D 70%, #1E2942 100%)',
        }}
      />

      {/* Glow ambiant vert (victoire) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1000,
          height: 1000,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 255, 136, 0.25) 0%, transparent 70%)',
          filter: `blur(${glowIntensity * 2}px)`,
        }}
      />

      {/* Confetti system - vagues multiples */}
      {[...Array(confettiWaves)].map((_, waveIndex) => (
        <Particles
          key={waveIndex}
          count={40}
          colors={['#9B5CFF', '#FF4FD8', '#3CCBFF', '#00FF88', '#FFD700']}
          spread={1.5}
          gravity={0.3}
          fadeOut={true}
          startFrame={sceneStart + waveIndex * 15}
        />
      ))}

      {/* Trophy avec animation */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: `translate(-50%, -50%) ${trophyTransition.transform} rotate(${trophyRotate}deg)`,
          opacity: trophyTransition.opacity,
        }}
      >
        <div
          style={{
            fontSize: 220,
            filter: `drop-shadow(0 20px ${glowIntensity}px rgba(0, 255, 136, 0.8)) drop-shadow(0 0 ${glowIntensity}px rgba(255, 215, 0, 0.6))`,
            transform: `scale(${1 + Math.sin(frame / 12) * 0.08})`,
          }}
        >
          🏆
        </div>

        {/* Rings de victoire */}
        {[...Array(3)].map((_, i) => {
          const ringDelay = i * 8;
          const ringOpacity = interpolate(
            relativeFrame,
            [ringDelay, ringDelay + 20],
            [0.6, 0],
            { extrapolateRight: 'clamp' }
          );

          const ringScale = interpolate(
            relativeFrame,
            [ringDelay, ringDelay + 20],
            [1, 2.5],
            { extrapolateRight: 'clamp', easing: Easing.easeOutCubic }
          );

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${ringScale})`,
                width: 250,
                height: 250,
                borderRadius: '50%',
                border: '6px solid #00FF88',
                opacity: ringOpacity,
                boxShadow: `0 0 30px rgba(0, 255, 136, ${ringOpacity})`,
              }}
            />
          );
        })}
      </div>

      {/* Texte "TU GAGNES!" */}
      <div
        style={{
          position: 'absolute',
          top: '62%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${textScale})`,
          opacity: textOpacity,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 120,
            fontWeight: 900,
            margin: 0,
            background: 'linear-gradient(135deg, #00FF88 0%, #3CCBFF 50%, #FFD700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% 200%',
            backgroundPosition: `${interpolate(frame, [sceneStart, sceneStart + 60], [0, 100])}% 50%`,
            filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 136, 1))`,
            letterSpacing: 6,
          }}
        >
          TU GAGNES !
        </h2>

        {/* Sparkles autour du texte */}
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const distance = 200 + Math.sin(frame / 10 + i) * 30;
          const sparkleOpacity = 0.4 + Math.sin(frame / 8 + i * 2) * 0.3;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(50% + ${Math.cos(angle) * distance}px)`,
                top: `calc(50% + ${Math.sin(angle) * distance}px)`,
                width: 8,
                height: 8,
                background: i % 2 ? '#00FF88' : '#FFD700',
                borderRadius: '50%',
                opacity: sparkleOpacity * textOpacity,
                boxShadow: `0 0 20px ${i % 2 ? '#00FF88' : '#FFD700'}`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        })}
      </div>

      {/* Fireworks effect */}
      {relativeFrame > 20 && relativeFrame % 20 < 3 && (
        <div
          style={{
            position: 'absolute',
            left: `${30 + (relativeFrame % 3) * 20}%`,
            top: `${20 + (relativeFrame % 2) * 15}%`,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, transparent 70%)',
            filter: 'blur(20px)',
            opacity: 0,
            animation: 'firework 1s ease-out',
          }}
        />
      )}
    </AbsoluteFill>
  );
};

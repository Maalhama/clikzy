import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { Easing as CustomEasing } from '../components/Transition';

interface ProductProps {
  emoji: string;
  name: string;
  color: string;
  progress: number;
}

const Product3D: React.FC<ProductProps> = ({ emoji, name, color, progress }) => {
  const frame = useCurrentFrame();

  // Scale avec bounce
  const scale = interpolate(
    progress,
    [0, 0.4, 1],
    [0, 1.2, 1],
    { easing: CustomEasing.easeOutBack }
  );

  // Rotation 3D
  const rotateY = interpolate(progress, [0, 1], [180, 0]);
  const rotateX = interpolate(progress, [0, 1], [-20, 0]);

  // Glow pulse
  const glowSize = 50 + Math.sin(frame / 8) * 20;

  return (
    <div
      style={{
        position: 'absolute',
        top: '35%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scale}) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
        opacity: progress,
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Glow background */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
          filter: `blur(${glowSize}px)`,
        }}
      />

      {/* Product */}
      <div
        style={{
          fontSize: 250,
          filter: `drop-shadow(0 20px ${glowSize}px ${color}) drop-shadow(0 0 ${glowSize * 0.8}px ${color})`,
          transform: `scale(${1 + Math.sin(frame / 10) * 0.05})`,
        }}
      >
        {emoji}
      </div>
    </div>
  );
};

export const ProductsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneStart = 240;
  const relativeFrame = frame - sceneStart;

  // Produits à afficher
  const products = [
    { emoji: '📱', name: 'iPhone 17 Pro Max', color: '#9B5CFF', duration: 40 },
    { emoji: '🎮', name: 'PlayStation 5 Pro', color: '#FF4FD8', duration: 40 },
    { emoji: '💻', name: 'MacBook Pro M4', color: '#3CCBFF', duration: 40 },
  ];

  // Cycle entre les produits
  const currentProductIndex = Math.floor(relativeFrame / 40) % 3;
  const currentProduct = products[currentProductIndex];
  const productFrame = relativeFrame % 40;

  // Transition progress
  const productProgress = interpolate(
    productFrame,
    [0, 15],
    [0, 1],
    { extrapolateRight: 'clamp', easing: CustomEasing.easeOutExpo }
  );

  // Fade out avant changement
  const fadeOut = interpolate(
    productFrame,
    [30, 39],
    [1, 0],
    { extrapolateRight: 'clamp' }
  );

  const opacity = Math.min(productProgress, fadeOut);

  // Background gradient rotation
  const bgRotation = interpolate(relativeFrame, [0, 120], [135, 180]);

  return (
    <AbsoluteFill>
      {/* Dynamic background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${bgRotation}deg, #0B0F1A 0%, #1a0f2e 50%, #141B2D 100%)`,
        }}
      />

      {/* Floating particles background */}
      {[...Array(20)].map((_, i) => {
        const x = (i * 47) % 100;
        const y = ((i * 73) % 100 + (relativeFrame * 0.5) % 100) % 100;
        const size = 2 + (i % 3);
        const opacity = 0.1 + (i % 5) * 0.05;

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
              background: products[i % 3].color,
              opacity,
              boxShadow: `0 0 ${size * 2}px ${products[i % 3].color}`,
            }}
          />
        );
      })}

      {/* Product 3D */}
      <Product3D
        emoji={currentProduct.emoji}
        name={currentProduct.name}
        color={currentProduct.color}
        progress={opacity}
      />

      {/* Product name */}
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: interpolate(productFrame, [10, 20], [0, 1], { extrapolateRight: 'clamp' }) * fadeOut,
        }}
      >
        <h2
          style={{
            fontSize: 72,
            fontWeight: 900,
            margin: 0,
            background: `linear-gradient(135deg, ${currentProduct.color} 0%, #EDEDED 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 30px ${currentProduct.color})`,
            letterSpacing: 2,
          }}
        >
          {currentProduct.name}
        </h2>
      </div>

      {/* Counter rapide */}
      <div
        style={{
          position: 'absolute',
          top: '70%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 48,
          fontWeight: 700,
          color: '#8B9BB4',
          opacity: 0.6,
        }}
      >
        {Math.floor(relativeFrame * 10)} produits disponibles
      </div>
    </AbsoluteFill>
  );
};

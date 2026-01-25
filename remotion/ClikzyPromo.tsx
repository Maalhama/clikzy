import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { IntroScene } from './scenes/IntroScene';
import { MobileScene } from './scenes/MobileScene';
import { ProductsScene } from './scenes/ProductsScene';
import { WinnerScene } from './scenes/WinnerScene';
import { CTAScene } from './scenes/CTAScene';
import { Easing } from './components/Transition';

/**
 * CLEEKZY - Promotional Video (20 seconds @ 30fps = 600 frames)
 *
 * Timeline:
 * - 0-60 frames (0-2s): Intro avec logo CLEEKZY
 * - 60-240 frames (2-8s): Scène mobile avec site mockup
 * - 240-360 frames (8-12s): Montage produits rapide
 * - 360-480 frames (12-16s): Scène de victoire avec confettis
 * - 480-600 frames (16-20s): Call to Action final
 */

export const ClikzyPromo: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene timings
  const scenes = {
    intro: { start: 0, end: 60 },
    mobile: { start: 60, end: 240 },
    products: { start: 240, end: 360 },
    winner: { start: 360, end: 480 },
    cta: { start: 480, end: 600 },
  };

  // Transition duration
  const transitionDuration = 20;

  // Helper pour calculer l'opacité de chaque scène avec transitions
  const getSceneOpacity = (sceneStart: number, sceneEnd: number) => {
    // Fade in
    const fadeIn = interpolate(
      frame,
      [sceneStart, sceneStart + transitionDuration],
      [0, 1],
      { extrapolateRight: 'clamp', easing: Easing.easeInOutCubic }
    );

    // Fade out
    const fadeOut = interpolate(
      frame,
      [sceneEnd - transitionDuration, sceneEnd],
      [1, 0],
      { extrapolateRight: 'clamp', easing: Easing.easeInOutCubic }
    );

    // Si on est avant la scène
    if (frame < sceneStart) return 0;
    // Si on est après la scène
    if (frame >= sceneEnd) return 0;
    // Pendant la scène
    return Math.min(fadeIn, fadeOut);
  };

  // CSS animations globales
  const globalStyles = `
    @keyframes ripple {
      0% {
        transform: scale(1);
        opacity: 0.8;
      }
      100% {
        transform: scale(3);
        opacity: 0;
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-20px);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.7;
        transform: scale(0.95);
      }
    }

    @keyframes firework {
      0% {
        transform: scale(0);
        opacity: 1;
      }
      100% {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;

  return (
    <>
      {/* Inject global styles */}
      <style>{globalStyles}</style>

      <AbsoluteFill
        style={{
          background: '#0B0F1A',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Scene 1: Intro */}
        {frame >= scenes.intro.start && frame < scenes.intro.end && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: getSceneOpacity(scenes.intro.start, scenes.intro.end),
            }}
          >
            <IntroScene />
          </div>
        )}

        {/* Scene 2: Mobile */}
        {frame >= scenes.mobile.start && frame < scenes.mobile.end && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: getSceneOpacity(scenes.mobile.start, scenes.mobile.end),
            }}
          >
            <MobileScene />
          </div>
        )}

        {/* Scene 3: Products */}
        {frame >= scenes.products.start && frame < scenes.products.end && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: getSceneOpacity(scenes.products.start, scenes.products.end),
            }}
          >
            <ProductsScene />
          </div>
        )}

        {/* Scene 4: Winner */}
        {frame >= scenes.winner.start && frame < scenes.winner.end && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: getSceneOpacity(scenes.winner.start, scenes.winner.end),
            }}
          >
            <WinnerScene />
          </div>
        )}

        {/* Scene 5: CTA */}
        {frame >= scenes.cta.start && frame < scenes.cta.end && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: getSceneOpacity(scenes.cta.start, scenes.cta.end),
            }}
          >
            <CTAScene />
          </div>
        )}
      </AbsoluteFill>
    </>
  );
};

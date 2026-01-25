import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { SceneIntro } from './pro-scenes/SceneIntro';
import { SceneHero } from './pro-scenes/SceneHero';
import { SceneGameplay } from './pro-scenes/SceneGameplay';
import { SceneTension } from './pro-scenes/SceneTension';
import { SceneWin } from './pro-scenes/SceneWin';
import { SceneOutro } from './pro-scenes/SceneOutro';
import { COLORS, SCENE_START, SCENE_DURATION, EASING } from './config/theme';

/**
 * CLIKZY - Promotional Video PRO
 *
 * Senior Motion Designer approach
 * Durée: 30s @ 30fps = 900 frames
 *
 * Timeline:
 * - 0-75 frames (0-2.5s): Intro "Tu cliques. Tu gagnes."
 * - 75-180 frames (2.5-6s): Hero du site avec CTA
 * - 180-450 frames (6-15s): Gameplay avec clics progressifs
 * - 450-660 frames (15-22s): Tension maximale
 * - 660-795 frames (22-26.5s): Victoire
 * - 795-900 frames (26.5-30s): Outro + CTA
 *
 * Format: 16:9 (1920x1080)
 * Facilement adaptable en 9:16 pour TikTok/Reels
 */

export const ClikzyProPro: React.FC = () => {
  const frame = useCurrentFrame();

  // Helper pour calculer l'opacité avec transitions fluides
  const getSceneOpacity = (sceneKey: keyof typeof SCENE_START): number => {
    const start = SCENE_START[sceneKey];
    const duration = SCENE_DURATION[sceneKey];
    const end = start + duration;

    const transitionDuration = 15; // frames de transition

    // Avant la scène
    if (frame < start) return 0;

    // Après la scène
    if (frame >= end) return 0;

    // Fade in
    if (frame < start + transitionDuration) {
      return interpolate(
        frame,
        [start, start + transitionDuration],
        [0, 1],
        { easing: EASING.smooth }
      );
    }

    // Fade out
    if (frame >= end - transitionDuration) {
      return interpolate(
        frame,
        [end - transitionDuration, end],
        [1, 0],
        { easing: EASING.smooth }
      );
    }

    // Pendant la scène
    return 1;
  };

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg.dark,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Scene 1: Intro */}
      {frame >= SCENE_START.intro && frame < SCENE_START.intro + SCENE_DURATION.intro && (
        <div style={{ position: 'absolute', inset: 0, opacity: getSceneOpacity('intro') }}>
          <SceneIntro />
        </div>
      )}

      {/* Scene 2: Hero */}
      {frame >= SCENE_START.hero && frame < SCENE_START.hero + SCENE_DURATION.hero && (
        <div style={{ position: 'absolute', inset: 0, opacity: getSceneOpacity('hero') }}>
          <SceneHero />
        </div>
      )}

      {/* Scene 3: Gameplay */}
      {frame >= SCENE_START.gameplay && frame < SCENE_START.gameplay + SCENE_DURATION.gameplay && (
        <div style={{ position: 'absolute', inset: 0, opacity: getSceneOpacity('gameplay') }}>
          <SceneGameplay />
        </div>
      )}

      {/* Scene 4: Tension */}
      {frame >= SCENE_START.tension && frame < SCENE_START.tension + SCENE_DURATION.tension && (
        <div style={{ position: 'absolute', inset: 0, opacity: getSceneOpacity('tension') }}>
          <SceneTension />
        </div>
      )}

      {/* Scene 5: Win */}
      {frame >= SCENE_START.win && frame < SCENE_START.win + SCENE_DURATION.win && (
        <div style={{ position: 'absolute', inset: 0, opacity: getSceneOpacity('win') }}>
          <SceneWin />
        </div>
      )}

      {/* Scene 6: Outro */}
      {frame >= SCENE_START.outro && frame < SCENE_START.outro + SCENE_DURATION.outro && (
        <div style={{ position: 'absolute', inset: 0, opacity: getSceneOpacity('outro') }}>
          <SceneOutro />
        </div>
      )}
    </AbsoluteFill>
  );
};

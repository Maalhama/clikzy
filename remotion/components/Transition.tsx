import { interpolate } from 'remotion';

// Easing functions professionnelles
export const Easing = {
  // Cubic bezier custom pour transitions cinématiques
  easeInOutCubic: (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  easeOutCubic: (t: number) => {
    return 1 - Math.pow(1 - t, 3);
  },

  easeOutExpo: (t: number) => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  },

  easeInOutQuart: (t: number) => {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  },

  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  // Elastic bounce pour effets dynamiques
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// Transition fade avec timing personnalisé
export const fadeTransition = (
  frame: number,
  startFrame: number,
  duration: number = 15,
  easing: (t: number) => number = Easing.easeInOutCubic
) => {
  const progress = Math.max(0, Math.min(1, (frame - startFrame) / duration));
  return easing(progress);
};

// Transition slide avec direction
export const slideTransition = (
  frame: number,
  startFrame: number,
  duration: number = 20,
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 100
) => {
  const progress = Easing.easeOutExpo(
    Math.max(0, Math.min(1, (frame - startFrame) / duration))
  );

  const offset = (1 - progress) * distance;

  switch (direction) {
    case 'up':
      return { transform: `translateY(${offset}%)`, opacity: progress };
    case 'down':
      return { transform: `translateY(-${offset}%)`, opacity: progress };
    case 'left':
      return { transform: `translateX(${offset}%)`, opacity: progress };
    case 'right':
      return { transform: `translateX(-${offset}%)`, opacity: progress };
  }
};

// Transition zoom cinématique
export const zoomTransition = (
  frame: number,
  startFrame: number,
  duration: number = 20,
  fromScale: number = 0.8,
  toScale: number = 1
) => {
  const progress = Easing.easeOutBack(
    Math.max(0, Math.min(1, (frame - startFrame) / duration))
  );

  const scale = interpolate(progress, [0, 1], [fromScale, toScale]);
  const opacity = Easing.easeInOutCubic(progress);

  return {
    transform: `scale(${scale})`,
    opacity,
  };
};

// Wipe transition (cinématique)
export const wipeTransition = (
  frame: number,
  startFrame: number,
  duration: number = 25,
  direction: 'horizontal' | 'vertical' = 'horizontal'
) => {
  const progress = Easing.easeInOutQuart(
    Math.max(0, Math.min(1, (frame - startFrame) / duration))
  );

  if (direction === 'horizontal') {
    return {
      clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
    };
  } else {
    return {
      clipPath: `inset(${(1 - progress) * 100}% 0 0 0)`,
    };
  }
};

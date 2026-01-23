"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Zap, Star, ChevronRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';

import { useCredits } from '@/contexts/CreditsContext';
import { useCountdown } from '@/hooks/useCountdown';
import { playMiniGame } from '@/actions/miniGames';
import { MiniGameType, MiniGameEligibility, WHEEL_SEGMENTS, SCRATCH_VALUES, PACHINKO_SLOTS } from '@/types/miniGames';

import WheelOfFortune from '@/components/mini-games/WheelOfFortune';
import ScratchCard from '@/components/mini-games/ScratchCard';
import Pachinko from '@/components/mini-games/Pachinko';

interface MiniGamesClientProps {
  initialEligibility: MiniGameEligibility;
}

interface GameResult {
  creditsWon: number;
  newTotalCredits: number;
}

interface PendingGame {
  type: MiniGameType;
  creditsWon: number;
  segmentIndex?: number;
  slotIndex?: number;
}

const GAME_CONFIG = {
  wheel: {
    id: 'wheel' as MiniGameType,
    title: 'Roue de la Fortune',
    icon: '🎡',
    description: 'Faites tourner la roue et tentez de gagner jusqu\'à 10 crédits !',
    color: 'var(--neon-purple)',
    glowClass: 'neon-glow',
    textClass: 'neon-text',
    gradient: 'from-[#9B5CFF] to-[#6E36FF]',
  },
  scratch: {
    id: 'scratch' as MiniGameType,
    title: 'Carte à Gratter',
    icon: '🎴',
    description: 'Grattez la carte pour révéler votre gain instantanément !',
    color: 'var(--neon-pink)',
    glowClass: 'neon-glow-pink',
    textClass: 'neon-text-pink',
    gradient: 'from-[#FF4FD8] to-[#D434B1]',
  },
  pachinko: {
    id: 'pachinko' as MiniGameType,
    title: 'Pachinko',
    icon: '🎰',
    description: 'Lancez la bille et regardez-la tomber vers votre récompense !',
    color: 'var(--neon-blue)',
    glowClass: 'neon-glow-blue',
    textClass: 'neon-text-blue',
    gradient: 'from-[#3CCBFF] to-[#1DA1D1]',
  },
};

export default function MiniGamesClient({ initialEligibility }: MiniGamesClientProps) {
  const { refreshCredits } = useCredits();
  const [eligibility, setEligibility] = useState(initialEligibility);
  const [activeGame, setActiveGame] = useState<MiniGameType | null>(null);
  const [pendingGame, setPendingGame] = useState<PendingGame | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const triggerWinEffect = useCallback(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }, []);

  // Called when user clicks "Play" - fetches result from server first
  const handleStartGame = async (gameType: MiniGameType) => {
    setIsLoading(true);
    setActiveGame(gameType);
    setResult(null);
    setPendingGame(null);

    try {
      const gameResult = await playMiniGame(gameType);

      if (gameResult.success && gameResult.data) {
        // Store the predetermined result
        setPendingGame({
          type: gameType,
          creditsWon: gameResult.data.creditsWon,
          segmentIndex: gameResult.data.segmentIndex,
          slotIndex: gameResult.data.slotIndex,
        });

        // Update eligibility
        const tomorrow = new Date();
        tomorrow.setUTCHours(0, 0, 0, 0);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        setEligibility(prev => ({
          ...prev,
          [gameType]: {
            canPlay: false,
            lastPlayedAt: new Date().toISOString(),
            nextPlayAt: tomorrow.toISOString()
          }
        }));
      } else {
        // Error - close modal
        setActiveGame(null);
        console.error('Game error:', gameResult.error);
      }
    } catch (error) {
      console.error("Error starting game:", error);
      setActiveGame(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Called when game animation completes
  const handleGameComplete = async (creditsWon: number) => {
    setResult({
      creditsWon,
      newTotalCredits: 0, // Will be refreshed
    });

    if (creditsWon > 0) {
      triggerWinEffect();
    }

    await refreshCredits();
  };

  const closeModal = () => {
    setActiveGame(null);
    setResult(null);
    setPendingGame(null);
  };

  // Get the target for the current game based on server result
  const getGameTarget = () => {
    if (!pendingGame) return 0;

    switch (pendingGame.type) {
      case 'wheel':
        return pendingGame.segmentIndex ?? WHEEL_SEGMENTS.indexOf(pendingGame.creditsWon as typeof WHEEL_SEGMENTS[number]);
      case 'scratch':
        return pendingGame.creditsWon;
      case 'pachinko':
        return pendingGame.slotIndex ?? PACHINKO_SLOTS.indexOf(pendingGame.creditsWon as typeof PACHINKO_SLOTS[number]);
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--neon-purple)] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--neon-blue)] blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-[var(--bg-tertiary)] text-[var(--neon-purple)] text-sm font-bold tracking-wider uppercase mb-4"
          >
            <Zap size={16} fill="currentColor" />
            Bonus Quotidiens
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight"
          >
            Mini-Jeux <span className="gradient-text">Quotidiens</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto"
          >
            Jouez à nos 3 jeux exclusifs chaque jour pour gagner des crédits gratuits.
            Réinitialisation toutes les 24 heures.
          </motion.p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(Object.keys(GAME_CONFIG) as MiniGameType[]).map((key, index) => (
            <GameCard
              key={key}
              config={GAME_CONFIG[key]}
              eligibility={eligibility[key]}
              onPlay={() => handleStartGame(key)}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Game Modal */}
      <AnimatePresence>
        {activeGame && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => result && closeModal()}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-dark rounded-2xl border border-[var(--bg-tertiary)] overflow-hidden my-8"
            >
              {/* Close button - only when showing result */}
              {result && (
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 z-50 text-[var(--text-secondary)] hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              )}

              {/* Loading state */}
              {isLoading && (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4 animate-bounce">
                    {GAME_CONFIG[activeGame].icon}
                  </div>
                  <p className="text-[var(--text-secondary)]">Chargement...</p>
                </div>
              )}

              {/* Game Component */}
              {!isLoading && pendingGame && !result && (
                <div className="p-4">
                  <h2 className={`text-2xl font-black text-center mb-4 ${GAME_CONFIG[activeGame].textClass}`}>
                    {GAME_CONFIG[activeGame].title}
                  </h2>

                  {activeGame === 'wheel' && (
                    <WheelOfFortune
                      onComplete={handleGameComplete}
                      targetSegment={getGameTarget()}
                    />
                  )}

                  {activeGame === 'scratch' && (
                    <ScratchCard
                      onComplete={handleGameComplete}
                      prizeAmount={pendingGame.creditsWon}
                    />
                  )}

                  {activeGame === 'pachinko' && (
                    <Pachinko
                      onComplete={handleGameComplete}
                      targetSlot={getGameTarget()}
                    />
                  )}
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="relative z-10 text-center py-12 px-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                    className={`w-24 h-24 ${result.creditsWon > 0 ? 'bg-[var(--success)]' : 'bg-[var(--bg-tertiary)]'} rounded-full flex items-center justify-center mx-auto mb-6 ${result.creditsWon > 0 ? 'neon-glow-success' : ''}`}
                  >
                    <Trophy className={result.creditsWon > 0 ? 'text-[var(--bg-primary)]' : 'text-[var(--text-secondary)]'} size={48} />
                  </motion.div>

                  <h2 className="text-4xl sm:text-5xl font-black text-white mb-2">
                    {result.creditsWon > 0 ? 'FÉLICITATIONS !' : 'PAS DE CHANCE !'}
                  </h2>
                  <p className="text-[var(--text-secondary)] text-xl mb-8">
                    {result.creditsWon > 0 ? 'Vous avez remporté' : 'Vous repartez avec'}
                  </p>

                  <div className={`text-6xl sm:text-7xl font-black ${result.creditsWon > 0 ? 'gradient-text-blue' : 'text-[var(--text-secondary)]'} mb-8`}>
                    {result.creditsWon} <span className="text-2xl sm:text-3xl">CRÉDITS</span>
                  </div>

                  <button
                    onClick={closeModal}
                    className="gaming-btn-large w-full max-w-xs mx-auto"
                  >
                    CONTINUER
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface GameCardProps {
  config: typeof GAME_CONFIG['wheel'];
  eligibility: { canPlay: boolean; nextPlayAt: string | null };
  onPlay: () => void;
  index: number;
}

function GameCard({ config, eligibility, onPlay, index }: GameCardProps) {
  const { canPlay, nextPlayAt } = eligibility;
  const countdown = useCountdown(nextPlayAt);

  const isAvailable = canPlay || countdown.isExpired;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -10 }}
      className="group relative glass rounded-2xl p-8 border border-[var(--bg-tertiary)] flex flex-col items-center text-center transition-all duration-300 hover:border-[var(--neon-purple)]/50 overflow-hidden"
    >
      {/* Decorative Corner */}
      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${config.gradient} opacity-20 clip-angle-sm`} />

      {/* Max Reward Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-full border border-white/10">
        <Star size={12} className="text-[var(--warning)] fill-[var(--warning)]" />
        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Max: 10 Crédits</span>
      </div>

      <div className={`text-7xl my-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12 ${isAvailable ? config.glowClass : 'opacity-40 grayscale'}`}>
        {config.icon}
      </div>

      <h3 className={`text-2xl font-black mb-3 ${isAvailable ? config.textClass : 'text-[var(--text-secondary)]'}`}>
        {config.title}
      </h3>

      <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8 flex-grow">
        {config.description}
      </p>

      {isAvailable ? (
        <button
          onClick={onPlay}
          className="gaming-btn w-full py-3 px-6 group/btn relative flex items-center justify-center gap-2"
        >
          <span>JOUER MAINTENANT</span>
          <ChevronRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
        </button>
      ) : (
        <div className="w-full space-y-3">
          <div className="flex items-center justify-center gap-3 py-3 px-4 bg-[var(--bg-primary)]/50 rounded-lg border border-white/5 text-[var(--text-secondary)]">
            <Clock size={16} />
            <span className="font-mono font-bold tracking-widest text-lg">
              {countdown.formatted}
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold">
            Prochain essai disponible
          </p>
        </div>
      )}

      {/* Interactive hover lines */}
      <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${config.gradient} transition-all duration-500 w-0 group-hover:w-full`} />
    </motion.div>
  );
}

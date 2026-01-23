"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Zap, ChevronRight, X, Sparkles, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';

import { WheelIcon, ScratchIcon, PachinkoIcon, CreditIcon } from '@/components/mini-games/GameIcons';
import { CreditPacksModal } from '@/components/modals/CreditPacksModal';

import { useCredits } from '@/contexts/CreditsContext';
import { useCountdown } from '@/hooks/useCountdown';
import { playMiniGame, playMiniGamePaid } from '@/actions/miniGames';
import { MiniGameType, MiniGameEligibility, WHEEL_SEGMENTS, SCRATCH_VALUES, PACHINKO_SLOTS } from '@/types/miniGames';

import WheelOfFortune from '@/components/mini-games/WheelOfFortune';
import ScratchCard from '@/components/mini-games/ScratchCard';
import Pachinko from '@/components/mini-games/Pachinko';

const PLAY_COST = 3; // Coût en crédits pour une partie payante

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
  finalCredits?: number; // For paid games: the final credit total after winnings
}

const GAME_CONFIG = {
  wheel: {
    id: 'wheel' as MiniGameType,
    title: 'Roue de la Fortune',
    IconComponent: WheelIcon,
    description: 'Faites tourner la roue et tentez de gagner jusqu\'à 10 crédits !',
    color: 'var(--neon-purple)',
    glowClass: 'neon-glow',
    textClass: 'neon-text',
    gradient: 'from-[#9B5CFF] to-[#6E36FF]',
  },
  scratch: {
    id: 'scratch' as MiniGameType,
    title: 'Carte à Gratter',
    IconComponent: ScratchIcon,
    description: 'Grattez la carte pour révéler votre gain instantanément !',
    color: 'var(--neon-pink)',
    glowClass: 'neon-glow-pink',
    textClass: 'neon-text-pink',
    gradient: 'from-[#FF4FD8] to-[#D434B1]',
  },
  pachinko: {
    id: 'pachinko' as MiniGameType,
    title: 'Pachinko',
    IconComponent: PachinkoIcon,
    description: 'Lancez la bille et regardez-la tomber vers votre récompense !',
    color: 'var(--neon-blue)',
    glowClass: 'neon-glow-blue',
    textClass: 'neon-text-blue',
    gradient: 'from-[#3CCBFF] to-[#1DA1D1]',
  },
};

export default function MiniGamesClient({ initialEligibility }: MiniGamesClientProps) {
  const { credits, updateCredits, refreshCredits } = useCredits();
  const [eligibility, setEligibility] = useState(initialEligibility);
  const [activeGame, setActiveGame] = useState<MiniGameType | null>(null);
  const [pendingGame, setPendingGame] = useState<PendingGame | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const hasEnoughCredits = credits >= PLAY_COST;

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

  // Called when user clicks "Play Free" - fetches result from server first
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

  // Called when user clicks "Play with credits" - paid play
  const handleStartPaidGame = async (gameType: MiniGameType) => {
    if (!hasEnoughCredits) {
      setShowCreditModal(true);
      return;
    }

    setIsLoading(true);
    setActiveGame(gameType);
    setResult(null);
    setPendingGame(null);

    // Immediately show credit deduction for better UX
    const creditsBeforePlay = credits;
    updateCredits(creditsBeforePlay - PLAY_COST);

    try {
      const gameResult = await playMiniGamePaid(gameType);

      if (gameResult.success && gameResult.data) {
        // Store the predetermined result + final credits for after animation
        setPendingGame({
          type: gameType,
          creditsWon: gameResult.data.creditsWon,
          segmentIndex: gameResult.data.segmentIndex,
          slotIndex: gameResult.data.slotIndex,
          finalCredits: gameResult.data.newTotalCredits,
        });
      } else {
        // Error - restore credits and close modal
        updateCredits(creditsBeforePlay);
        setActiveGame(null);
        console.error('Game error:', gameResult.error);
      }
    } catch (error) {
      console.error("Error starting paid game:", error);
      // Restore credits on error
      updateCredits(creditsBeforePlay);
      setActiveGame(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Called when game animation completes
  const handleGameComplete = async (creditsWon: number) => {
    setResult({
      creditsWon,
      newTotalCredits: pendingGame?.finalCredits || 0,
    });

    if (creditsWon > 0) {
      triggerWinEffect();
    }

    // For paid games, use the stored final credits; for free games, refresh from server
    if (pendingGame?.finalCredits !== undefined) {
      updateCredits(pendingGame.finalCredits);
    } else {
      await refreshCredits();
    }
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
              onPlayFree={() => handleStartGame(key)}
              onPlayPaid={() => handleStartPaidGame(key)}
              hasEnoughCredits={hasEnoughCredits}
              onBuyCredits={() => setShowCreditModal(true)}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Credit Packs Modal */}
      <CreditPacksModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
      />

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
                  <div className="w-24 h-24 mx-auto mb-4">
                    {React.createElement(GAME_CONFIG[activeGame].IconComponent, {
                      className: 'w-full h-full',
                      animate: true
                    })}
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
                <div className="relative z-10 text-center py-12 px-8 overflow-hidden">
                  {/* Background glow effect */}
                  {result.creditsWon > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#FFB800] opacity-10 blur-[100px] rounded-full animate-pulse" />
                    </div>
                  )}

                  {/* Floating sparkles for wins */}
                  {result.creditsWon > 0 && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{
                            opacity: 0,
                            y: 100,
                            x: Math.random() * 300 - 150,
                            scale: 0.5
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                            y: -100,
                            rotate: 360,
                            scale: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 2 + Math.random(),
                            repeat: Infinity,
                            delay: i * 0.3
                          }}
                          className="absolute left-1/2"
                          style={{ top: `${50 + Math.random() * 30}%` }}
                        >
                          <Sparkles
                            size={16 + Math.random() * 16}
                            className={i % 2 === 0 ? 'text-[#FFB800]' : 'text-[#9B5CFF]'}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Trophy icon with enhanced animation */}
                  <motion.div
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{
                      scale: 1,
                      rotateY: 0,
                      y: result.creditsWon > 0 ? [0, -10, 0] : 0
                    }}
                    transition={{
                      scale: { type: "spring", stiffness: 200, damping: 15 },
                      y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className={`relative w-28 h-28 mx-auto mb-6`}
                  >
                    {/* Rotating ring for wins */}
                    {result.creditsWon > 0 && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-8px] rounded-full border-2 border-dashed border-[#FFB800]/30"
                      />
                    )}
                    <div className={`w-full h-full rounded-full flex items-center justify-center ${
                      result.creditsWon >= 10
                        ? 'bg-gradient-to-br from-[#FFB800] to-[#FF8C00] shadow-[0_0_40px_rgba(255,184,0,0.5)]'
                        : result.creditsWon > 0
                          ? 'bg-gradient-to-br from-[#9B5CFF] to-[#FF4FD8] shadow-[0_0_30px_rgba(155,92,255,0.4)]'
                          : 'bg-[var(--bg-tertiary)]'
                    }`}>
                      <Trophy className={result.creditsWon > 0 ? 'text-white drop-shadow-lg' : 'text-[var(--text-secondary)]'} size={56} />
                    </div>
                  </motion.div>

                  {/* Result title with staggered letters for wins */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`text-4xl sm:text-5xl font-black mb-2 ${
                      result.creditsWon >= 10
                        ? 'text-[#FFB800] drop-shadow-[0_0_20px_rgba(255,184,0,0.5)]'
                        : 'text-white'
                    }`}
                  >
                    {result.creditsWon > 0 ? 'FÉLICITATIONS !' : 'PAS DE CHANCE !'}
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-[var(--text-secondary)] text-xl mb-6"
                  >
                    {result.creditsWon > 0 ? 'Vous avez remporté' : 'Vous repartez avec'}
                  </motion.p>

                  {/* Credits won with animated counter effect */}
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="relative mb-8"
                  >
                    <div className={`flex items-center justify-center gap-3 ${
                      result.creditsWon >= 10
                        ? 'text-[#FFB800]'
                        : result.creditsWon > 0
                          ? 'text-white'
                          : 'text-[var(--text-secondary)]'
                    }`}>
                      <CreditIcon className="w-12 h-12 sm:w-16 sm:h-16" />
                      <span className="text-7xl sm:text-8xl font-black tracking-tight">
                        {result.creditsWon}
                      </span>
                    </div>
                    <span className={`text-lg sm:text-xl font-bold uppercase tracking-widest ${
                      result.creditsWon > 0 ? 'text-white/60' : 'text-[var(--text-secondary)]'
                    }`}>
                      Crédits gagnés
                    </span>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={closeModal}
                    className={`w-full max-w-xs mx-auto py-4 px-8 rounded-xl font-black text-lg uppercase tracking-wider transition-all duration-300 ${
                      result.creditsWon > 0
                        ? 'bg-gradient-to-r from-[#9B5CFF] to-[#FF4FD8] text-white hover:shadow-[0_0_30px_rgba(155,92,255,0.5)] hover:scale-105'
                        : 'bg-[var(--bg-tertiary)] text-white hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    CONTINUER
                  </motion.button>
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
  config: {
    id: MiniGameType;
    title: string;
    IconComponent: React.ComponentType<{ className?: string; animate?: boolean }>;
    description: string;
    color: string;
    glowClass: string;
    textClass: string;
    gradient: string;
  };
  eligibility: { canPlay: boolean; nextPlayAt: string | null };
  onPlayFree: () => void;
  onPlayPaid: () => void;
  hasEnoughCredits: boolean;
  onBuyCredits: () => void;
  index: number;
}

function GameCard({ config, eligibility, onPlayFree, onPlayPaid, hasEnoughCredits, onBuyCredits, index }: GameCardProps) {
  const { canPlay, nextPlayAt } = eligibility;
  const countdown = useCountdown(nextPlayAt);

  const isFreeAvailable = canPlay || countdown.isExpired;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -10 }}
      className="group relative glass rounded-2xl p-8 border border-[var(--bg-tertiary)] flex flex-col items-center text-center transition-all duration-300 hover:border-[var(--neon-purple)]/50 overflow-hidden"
    >
      {/* Decorative Corner Badge - Shows "Gratuit" only if free play available */}
      {isFreeAvailable && (
        <div className="absolute -top-1 -right-1">
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} blur-xl opacity-40`} />
          <div className={`relative bg-gradient-to-br ${config.gradient} text-white text-[9px] font-black uppercase tracking-wider px-6 py-1.5 transform rotate-45 translate-x-4 translate-y-3 shadow-lg`}>
            <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">Gratuit</span>
          </div>
          <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-br ${config.gradient} opacity-20 rounded-bl-2xl`} />
        </div>
      )}

      {/* Max Reward Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 rounded-full border border-[#FFB800]/30 backdrop-blur-sm">
        <CreditIcon className="w-4 h-4" />
        <span className="text-[10px] font-bold text-[#FFB800] uppercase tracking-tighter">Max: 10</span>
      </div>

      <div className={`w-24 h-24 my-8 transition-transform duration-500 group-hover:scale-110`}>
        <config.IconComponent className="w-full h-full" animate={true} />
      </div>

      <h3 className={`text-2xl font-black mb-3 ${config.textClass}`}>
        {config.title}
      </h3>

      <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6 flex-grow">
        {config.description}
      </p>

      {/* Buttons */}
      <div className="w-full space-y-3">
        {isFreeAvailable ? (
          // Free play available
          <button
            onClick={onPlayFree}
            className="gaming-btn w-full py-3 px-6 group/btn relative flex items-center justify-center gap-2"
          >
            <span>JOUER GRATUITEMENT</span>
            <ChevronRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
          </button>
        ) : (
          // Free play used - show countdown
          <div className="flex items-center justify-center gap-3 py-3 px-4 bg-[var(--bg-primary)]/50 rounded-lg border border-white/5 text-[var(--text-secondary)]">
            <Clock size={16} />
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-wider opacity-60">Prochain gratuit</span>
              <span className="font-mono font-bold tracking-widest">
                {countdown.formatted}
              </span>
            </div>
          </div>
        )}

        {/* Paid play button - always visible */}
        {hasEnoughCredits ? (
          <button
            onClick={onPlayPaid}
            className="w-full py-2.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-[var(--bg-tertiary)] border border-white/10 text-white hover:bg-[var(--bg-secondary)] hover:border-[var(--neon-purple)]/50"
          >
            <Coins size={16} className="text-[#FFB800]" />
            <span>Rejouer pour {PLAY_COST} crédits</span>
          </button>
        ) : (
          <button
            onClick={onBuyCredits}
            className="w-full py-2.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#9B5CFF]/20 to-[#FF4FD8]/20 border border-[#9B5CFF]/30 text-[#9B5CFF] hover:from-[#9B5CFF]/30 hover:to-[#FF4FD8]/30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Acheter des crédits</span>
          </button>
        )}
      </div>

      {/* Interactive hover lines */}
      <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${config.gradient} transition-all duration-500 w-0 group-hover:w-full`} />
    </motion.div>
  );
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { signOut } from '@/actions/auth'
import { Logo } from '@/components/ui/Logo'
import { useCredits } from '@/contexts/CreditsContext'
import type { Profile } from '@/types/database'

interface HeaderProps {
  profile: Profile | null
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuClosing, setMenuClosing] = useState(false)
  const { credits } = useCredits()

  const closeMenu = () => {
    if (menuClosing) return
    setMenuClosing(true)
    setTimeout(() => {
      setMobileMenuOpen(false)
      setMenuClosing(false)
    }, 300)
  }

  async function handleSignOut() {
    closeMenu()
    await signOut()
    router.push('/login')
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Background with glassmorphism */}
        <div className="absolute inset-0 bg-bg-primary/80 backdrop-blur-xl" />

        {/* Animated gradient border */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-purple to-transparent animate-border-scan" />
          <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 via-neon-pink/40 to-neon-purple/20" />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden relative px-4 py-3 flex items-center justify-between">
          {/* Menu button */}
          <button
            onClick={() => mobileMenuOpen ? closeMenu() : setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-gradient-to-r from-neon-purple/15 to-neon-pink/15 border border-neon-purple/30 hover:border-neon-pink/50 transition-colors"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <svg className="w-5 h-5 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo - Center */}
          <div className="absolute left-1/2 -translate-x-1/2 z-10">
            <Logo size="md" animated={true} href="/" />
          </div>

          {/* Credits badge - Right */}
          {profile && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/30">
              <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold text-neon-purple">{credits}</span>
            </div>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex relative max-w-7xl mx-auto px-6 py-4 items-center justify-between">
          {/* Logo */}
          <Logo size="md" animated={true} href="/" />

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/60 hover:text-neon-blue transition-colors font-medium group"
            >
              {/* Home icon - Neon blue style */}
              <svg className="w-5 h-5 text-neon-blue/70 group-hover:text-neon-blue transition-colors drop-shadow-[0_0_6px_rgba(60,203,255,0.5)] group-hover:drop-shadow-[0_0_8px_rgba(60,203,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Accueil</span>
            </Link>
            <Link
              href="/lobby"
              className="flex items-center gap-2 text-white/60 hover:text-neon-pink transition-colors font-medium group"
            >
              {/* Gamepad icon - Neon pink style */}
              <svg className="w-5 h-5 text-neon-pink/70 group-hover:text-neon-pink transition-colors drop-shadow-[0_0_6px_rgba(255,79,216,0.5)] group-hover:drop-shadow-[0_0_8px_rgba(255,79,216,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 11h4M8 9v4" />
                <line x1="15" y1="12" x2="15.01" y2="12" />
                <line x1="18" y1="10" x2="18.01" y2="10" />
                <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
              </svg>
              <span>Lobby</span>
            </Link>
            <Link
              href="/mini-games"
              className="flex items-center gap-2 text-white/60 hover:text-neon-purple transition-colors font-medium group"
            >
              {/* Dice icon - Neon style */}
              <svg className="w-5 h-5 text-neon-purple/70 group-hover:text-neon-purple transition-colors drop-shadow-[0_0_6px_rgba(155,92,255,0.5)] group-hover:drop-shadow-[0_0_8px_rgba(155,92,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="3" />
                <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                <circle cx="16" cy="8" r="1.5" fill="currentColor" />
                <circle cx="8" cy="16" r="1.5" fill="currentColor" />
                <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
              <span>Mini-Jeux</span>
            </Link>
            <Link
              href="/shop"
              className="flex items-center gap-2 text-white/60 hover:text-neon-pink transition-colors font-medium group"
            >
              {/* Shopping bag icon - Neon style */}
              <svg className="w-5 h-5 text-neon-pink/70 group-hover:text-neon-pink transition-colors drop-shadow-[0_0_6px_rgba(255,79,216,0.5)] group-hover:drop-shadow-[0_0_8px_rgba(255,79,216,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Boutique</span>
            </Link>
            <Link
              href="/vip"
              className="flex items-center gap-2 text-white/60 hover:text-yellow-400 transition-colors font-medium group"
            >
              {/* Crown icon - Neon style */}
              <svg className="w-5 h-5 text-yellow-500/70 group-hover:text-yellow-400 transition-colors drop-shadow-[0_0_6px_rgba(234,179,8,0.5)] group-hover:drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6l3.5 4.5L19 6l-2 10H7L5 6l3.5 4.5L12 6z" />
                <circle cx="12" cy="4" r="1" fill="currentColor" />
                <circle cx="5" cy="5" r="1" fill="currentColor" />
                <circle cx="19" cy="5" r="1" fill="currentColor" />
                <path d="M7 16h10" />
                <path d="M6 20h12" />
              </svg>
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent font-bold drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">V.I.P</span>
            </Link>
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {profile && (
              <>
                {/* Credits with glow */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-purple/10 border border-neon-purple/30 hover:border-neon-purple/50 transition-colors group">
                  <svg className="w-5 h-5 text-neon-purple group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-neon-purple">{credits}</span>
                  <span className="text-white/50 text-sm">crédits</span>
                </div>

                {/* User avatar + name */}
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  {profile.avatar_url ? (
                    <div className="w-9 h-9 rounded-lg overflow-hidden group-hover:scale-105 transition-transform ring-2 ring-neon-purple/50">
                      <Image
                        src={profile.avatar_url}
                        alt={profile.username}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center font-bold text-white group-hover:scale-105 transition-transform">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-white/80 group-hover:text-white transition-colors">
                      {profile.username}
                    </span>
                    {profile.is_vip && (
                      <span title="Membre V.I.P">
                        <svg
                          className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-label="Membre V.I.P"
                        >
                          <path d="M12 6l3.5 4.5L19 6l-2 10H7L5 6l3.5 4.5L12 6z" />
                          <circle cx="12" cy="4" r="1.5" />
                          <circle cx="5" cy="5" r="1.5" />
                          <circle cx="19" cy="5" r="1.5" />
                          <rect x="6" y="16" width="12" height="2" rx="0.5" />
                        </svg>
                      </span>
                    )}
                  </div>
                </Link>

                {/* Sign out */}
                <button
                  onClick={handleSignOut}
                  className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-danger/50 hover:bg-danger/10 transition-all group"
                  aria-label="Déconnexion"
                >
                  <svg className="w-5 h-5 text-white/50 group-hover:text-danger transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-14 md:h-[72px]" />

      {/* Mobile Menu Portal */}
      {typeof window !== 'undefined' && mobileMenuOpen && createPortal(
        <div className="md:hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}>
          {/* Backdrop */}
          <div
            onClick={closeMenu}
            className={menuClosing ? 'animate-fade-out' : 'animate-fade-in'}
            style={{
              position: 'fixed',
              top: '3.5rem',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)'
            }}
          />

          {/* Menu Panel */}
          <div
            className={menuClosing ? 'animate-slide-out-left' : 'animate-slide-in-left'}
            style={{
              position: 'fixed',
              top: '3.5rem',
              left: 0,
              width: '17rem',
              backgroundColor: '#0a0a0f',
              border: '2px solid rgba(155, 92, 255, 0.5)',
              borderLeft: 'none',
              borderRadius: '0 1rem 1rem 0',
              boxShadow: '0 0 60px rgba(155, 92, 255, 0.4), 10px 10px 40px rgba(0, 0, 0, 0.8)'
            }}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Menu</span>
              <button
                onClick={closeMenu}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/30 transition-all"
                aria-label="Fermer le menu"
              >
                <svg className="w-4 h-4 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User info - clickable to profile */}
            {profile && (
              <Link
                href="/profile"
                onClick={closeMenu}
                className="block px-4 py-4 border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {profile.avatar_url ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-neon-purple/50">
                      <Image
                        src={profile.avatar_url}
                        alt={profile.username}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center font-bold text-white text-lg">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{profile.username}</span>
                      {profile.is_vip && (
                        <span title="Membre V.I.P">
                          <svg
                            className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-label="Membre V.I.P"
                          >
                            <path d="M12 6l3.5 4.5L19 6l-2 10H7L5 6l3.5 4.5L12 6z" />
                            <circle cx="12" cy="4" r="1.5" />
                            <circle cx="5" cy="5" r="1.5" />
                            <circle cx="19" cy="5" r="1.5" />
                            <rect x="6" y="16" width="12" height="2" rx="0.5" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-neon-purple text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-bold">{credits} crédits</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )}

            {/* Navigation Links */}
            <div className="px-4 py-2 space-y-1">
              <Link
                href="/"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neon-blue/10 transition-colors border border-transparent hover:border-neon-blue/30 group"
              >
                {/* Home icon - Neon blue style */}
                <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center group-hover:bg-neon-blue/20 transition-colors shadow-[0_0_10px_rgba(60,203,255,0.2)] group-hover:shadow-[0_0_15px_rgba(60,203,255,0.4)]">
                  <svg className="w-4 h-4 text-neon-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span className="font-medium text-white/80 group-hover:text-neon-blue transition-colors">Accueil</span>
              </Link>
              <Link
                href="/lobby"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neon-pink/10 transition-colors border border-transparent hover:border-neon-pink/30 group"
              >
                {/* Gamepad icon - Neon pink style */}
                <div className="w-8 h-8 rounded-lg bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-center group-hover:bg-neon-pink/20 transition-colors shadow-[0_0_10px_rgba(255,79,216,0.2)] group-hover:shadow-[0_0_15px_rgba(255,79,216,0.4)]">
                  <svg className="w-4 h-4 text-neon-pink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 11h4M8 9v4" />
                    <line x1="15" y1="12" x2="15.01" y2="12" />
                    <line x1="18" y1="10" x2="18.01" y2="10" />
                    <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
                  </svg>
                </div>
                <span className="font-medium text-white/80 group-hover:text-neon-pink transition-colors">Lobby</span>
              </Link>
              <Link
                href="/mini-games"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neon-purple/10 transition-colors border border-transparent hover:border-neon-purple/30 group"
              >
                {/* Dice icon - Neon style */}
                <div className="w-8 h-8 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center group-hover:bg-neon-purple/20 transition-colors shadow-[0_0_10px_rgba(155,92,255,0.2)] group-hover:shadow-[0_0_15px_rgba(155,92,255,0.4)]">
                  <svg className="w-4 h-4 text-neon-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="3" />
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                    <circle cx="16" cy="8" r="1.5" fill="currentColor" />
                    <circle cx="8" cy="16" r="1.5" fill="currentColor" />
                    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <span className="font-medium text-white/80 group-hover:text-neon-purple transition-colors">Mini-Jeux</span>
              </Link>
              <Link
                href="/shop"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neon-pink/10 transition-colors border border-transparent hover:border-neon-pink/30 group"
              >
                {/* Shopping bag icon - Neon style */}
                <div className="w-8 h-8 rounded-lg bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-center group-hover:bg-neon-pink/20 transition-colors shadow-[0_0_10px_rgba(255,79,216,0.2)] group-hover:shadow-[0_0_15px_rgba(255,79,216,0.4)]">
                  <svg className="w-4 h-4 text-neon-pink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <span className="font-medium text-white/80 group-hover:text-neon-pink transition-colors">Boutique</span>
              </Link>
              <Link
                href="/vip"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-yellow-500/10 transition-colors border border-transparent hover:border-yellow-500/30 group"
              >
                {/* Crown icon - Neon style */}
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors shadow-[0_0_10px_rgba(234,179,8,0.2)] group-hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                  <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 6l3.5 4.5L19 6l-2 10H7L5 6l3.5 4.5L12 6z" />
                    <circle cx="12" cy="4" r="1" fill="currentColor" />
                    <circle cx="5" cy="5" r="1" fill="currentColor" />
                    <circle cx="19" cy="5" r="1" fill="currentColor" />
                    <path d="M7 16h10" />
                    <path d="M6 20h12" />
                  </svg>
                </div>
                <span className="font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent group-hover:from-yellow-300 group-hover:to-amber-400 transition-colors">V.I.P</span>
              </Link>
            </div>

            {/* Sign out */}
            <div className="px-4 pt-4 pb-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-semibold">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

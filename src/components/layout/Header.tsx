'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { signOut } from '@/actions/auth'
import { Avatar } from '@/components/ui/Avatar'
import { Logo } from '@/components/ui/Logo'
import { useCredits } from '@/contexts/CreditsContext'
import type { Profile } from '@/types/database'

interface HeaderProps {
  profile: Profile | null
}

interface NavItem {
  href: string
  label: string
  accent: string // couleur du point actif / hover
  icon: React.ReactNode
}

const navIconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/lobby',
    label: 'Lobby',
    accent: '#FF4FD8',
    icon: (
      <svg {...navIconProps}>
        <path d="M6 11h4M8 9v4" />
        <line x1="15" y1="12" x2="15.01" y2="12" />
        <line x1="18" y1="10" x2="18.01" y2="10" />
        <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
      </svg>
    ),
  },
  {
    href: '/mini-games',
    label: 'Mini-Jeux',
    accent: '#9B5CFF',
    icon: (
      <svg {...navIconProps}>
        <rect x="2" y="2" width="20" height="20" rx="3" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
        <circle cx="16" cy="8" r="1.5" fill="currentColor" />
        <circle cx="8" cy="16" r="1.5" fill="currentColor" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/collection',
    label: 'Collection',
    accent: '#3CCBFF',
    icon: (
      <svg {...navIconProps}>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.3 7L12 12l8.7-5" />
        <line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: '/classement',
    label: 'Classement',
    accent: '#00FF88',
    icon: (
      <svg {...navIconProps}>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v6a5 5 0 0 1-10 0z" />
        <path d="M17 5h3a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3" />
        <path d="M7 5H4a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3" />
      </svg>
    ),
  },
  {
    href: '/clans',
    label: 'Clans',
    accent: '#9B5CFF',
    icon: (
      <svg {...navIconProps}>
        <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 19.8 7.6 22.2l.9-5.5-4-3.9L10 7z" />
      </svg>
    ),
  },
  {
    href: '/shop',
    label: 'Boutique',
    accent: '#FF4FD8',
    icon: (
      <svg {...navIconProps}>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
]

const crownIcon = (
  <svg {...navIconProps}>
    <path d="M12 6l3.5 4.5L19 6l-2 10H7L5 6l3.5 4.5L12 6z" />
    <circle cx="12" cy="4" r="1" fill="currentColor" />
    <circle cx="5" cy="5" r="1" fill="currentColor" />
    <circle cx="19" cy="5" r="1" fill="currentColor" />
    <path d="M7 16h10" />
  </svg>
)

const creditsIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const vipBadge = (
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
)

export function Header({ profile }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Fond verre */}
        <div className="absolute inset-0 bg-bg-primary/75 backdrop-blur-xl" />

        {/* Liseré bas animé */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-purple to-transparent animate-border-scan" />
          <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 via-neon-pink/40 to-neon-purple/20" />
        </div>

        {/* Header mobile */}
        <div className="lg:hidden relative px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => mobileMenuOpen ? closeMenu() : setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-gradient-to-r from-neon-purple/15 to-neon-pink/15 border border-neon-purple/30 hover:border-neon-pink/50 transition-colors"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <svg className="w-5 h-5 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 z-10">
            <Logo size="md" animated={true} href="/" />
          </div>

          {profile ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/30">
              <span className="text-neon-purple">{creditsIcon}</span>
              <span className="text-sm stat-numeral text-neon-purple">{credits}</span>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-full border border-neon-purple/40 bg-neon-purple/10 text-sm font-semibold text-neon-purple"
            >
              Connexion
            </Link>
          )}
        </div>

        {/* Header desktop */}
        <div className="hidden lg:flex relative max-w-7xl mx-auto px-6 py-3.5 items-center justify-between gap-4">
          <Logo size="md" animated={true} href="/" />

          <nav className="flex items-center gap-1" aria-label="Navigation principale">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all group ${
                    active
                      ? 'text-white bg-white/[0.06]'
                      : 'text-white/55 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className="w-[18px] h-[18px] transition-colors"
                    style={{ color: active ? item.accent : undefined }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[0.9rem]">{item.label}</span>
                  {/* Soulignement néon actif */}
                  <span
                    className={`absolute -bottom-[3px] left-3.5 right-3.5 h-[2px] rounded-full transition-opacity ${
                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                    }`}
                    style={{ background: item.accent, boxShadow: `0 0 10px ${item.accent}` }}
                  />
                </Link>
              )
            })}

            {/* V.I.P — traitement doré dédié */}
            <Link
              href="/vip"
              aria-current={isActive('/vip') ? 'page' : undefined}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all group ${
                isActive('/vip') ? 'bg-yellow-500/10' : 'hover:bg-yellow-500/[0.06]'
              }`}
            >
              <span className="w-[18px] h-[18px] text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]">
                {crownIcon}
              </span>
              <span className="text-[0.9rem] bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
                V.I.P
              </span>
            </Link>
          </nav>

          {/* Section droite */}
          <div className="flex items-center gap-3">
            {profile ? (
              <>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-neon-purple/10 border border-neon-purple/30 hover:border-neon-purple/50 transition-colors">
                  <span className="text-neon-purple">{creditsIcon}</span>
                  <span className="stat-numeral text-neon-purple">{credits}</span>
                  <span className="text-white/40 text-xs uppercase tracking-wider">crédits</span>
                </div>

                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full hover:bg-white/5 transition-colors group border border-transparent hover:border-white/10"
                >
                  <Avatar username={profile.username} avatarUrl={profile.avatar_url} frame={(profile as { cosmetic_frame?: string }).cosmetic_frame ?? 'frame_default'} size={32} />
                  <span className="font-medium text-sm text-white/80 group-hover:text-white transition-colors">
                    {profile.username}
                  </span>
                  {profile.is_vip && <span title="Membre V.I.P">{vipBadge}</span>}
                </Link>

                <button
                  onClick={handleSignOut}
                  className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:border-danger/50 hover:bg-danger/10 transition-all group"
                  aria-label="Déconnexion"
                >
                  <svg className="w-4 h-4 text-white/50 group-hover:text-danger transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white/70 hover:text-white border border-white/10 hover:border-neon-purple/50 hover:bg-neon-purple/10 transition-all"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="btn-arena px-5 py-2 text-sm"
                >
                  Jouer gratuitement
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Espace sous le header fixe */}
      <div className="h-14 lg:h-[68px]" />

      {/* Menu mobile (portal) */}
      {typeof window !== 'undefined' && mobileMenuOpen && createPortal(
        <div className="lg:hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}>
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

          <div
            className={`${menuClosing ? 'animate-menu-slide-out' : 'animate-menu-slide-in'} overflow-y-auto`}
            style={{
              position: 'fixed',
              top: '3.5rem',
              left: 0,
              bottom: 0,
              width: '17.5rem',
              backgroundColor: '#0B0F1A',
              borderRight: '1px solid rgba(155, 92, 255, 0.35)',
              borderTop: '1px solid rgba(155, 92, 255, 0.2)',
            }}
          >
            {/* En-tête du menu */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="kicker !text-[0.6rem]">Menu</span>
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

            {/* Profil ou CTA connexion */}
            {profile ? (
              <Link
                href="/profile"
                onClick={closeMenu}
                className="block px-4 py-4 border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar username={profile.username} avatarUrl={profile.avatar_url} frame={(profile as { cosmetic_frame?: string }).cosmetic_frame ?? 'frame_default'} size={48} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{profile.username}</span>
                      {profile.is_vip && <span title="Membre V.I.P">{vipBadge}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-neon-purple text-sm">
                      {creditsIcon}
                      <span className="stat-numeral">{credits} crédits</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ) : (
              <div className="px-4 py-4 border-b border-white/10 space-y-2">
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="btn-arena w-full px-4 py-3 text-sm"
                >
                  Jouer gratuitement
                </Link>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="btn-arena-ghost w-full px-4 py-3 text-sm"
                >
                  Connexion
                </Link>
              </div>
            )}

            {/* Liens de navigation */}
            <div className="px-4 py-2 space-y-1">
              <Link
                href="/"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group"
              >
                <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-neon-blue">
                  <svg className="w-4 h-4" {...navIconProps}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span className="font-medium text-white/80 group-hover:text-white transition-colors">Accueil</span>
              </Link>

              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors border group ${
                      active
                        ? 'bg-white/[0.06] border-white/10'
                        : 'border-transparent hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center border"
                      style={{
                        color: item.accent,
                        backgroundColor: `${item.accent}1A`,
                        borderColor: `${item.accent}4D`,
                      }}
                    >
                      <span className="w-4 h-4">{item.icon}</span>
                    </div>
                    <span className={`font-medium transition-colors ${active ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                      {item.label}
                    </span>
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: item.accent, boxShadow: `0 0 8px ${item.accent}` }} />
                    )}
                  </Link>
                )
              })}

              <Link
                href="/vip"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-yellow-500/10 transition-colors border border-transparent hover:border-yellow-500/30 group"
              >
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
                  <span className="w-4 h-4">{crownIcon}</span>
                </div>
                <span className="font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">V.I.P</span>
              </Link>
            </div>

            {/* Déconnexion */}
            {profile && (
              <div className="px-4 pt-4 pb-6">
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
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

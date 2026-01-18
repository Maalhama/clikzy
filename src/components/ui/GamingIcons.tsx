'use client'

import { CSSProperties } from 'react'

interface IconProps {
  className?: string
  style?: CSSProperties
}

// Trophy icon - for wins/victories
export function TrophyIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2" strokeLinecap="round" />
      <path d="M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2" strokeLinecap="round" />
      <path d="M6 3h12v6a6 6 0 01-12 0V3z" />
      <path d="M12 15v4" strokeLinecap="round" />
      <path d="M8 21h8" strokeLinecap="round" />
      <circle cx="12" cy="8" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Target/Crosshair icon - for selection/choosing
export function TargetIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 2v4" strokeLinecap="round" />
      <path d="M12 18v4" strokeLinecap="round" />
      <path d="M2 12h4" strokeLinecap="round" />
      <path d="M18 12h4" strokeLinecap="round" />
    </svg>
  )
}

// Cursor/Click icon - for clicking action
export function CursorClickIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4l7.07 17 2.51-7.39L21 11.07 4 4z" strokeLinejoin="round" />
      <path d="M13 13l6 6" strokeLinecap="round" />
      <circle cx="18" cy="6" r="2" className="animate-ping" fill="currentColor" stroke="none" opacity="0.5" />
      <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Gift/Prize box icon - for prizes
export function GiftIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 12v10H4V12" />
      <path d="M2 7h20v5H2z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  )
}

// Gamepad icon - for gaming
export function GamepadIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <path d="M6 12h4" strokeLinecap="round" />
      <path d="M8 10v4" strokeLinecap="round" />
      <circle cx="17" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Lightning/Bolt icon - for speed/instant
export function LightningIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

// Coins/Money icon - for value/credits
export function CoinsIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="9" r="7" />
      <path d="M9 6v6" strokeLinecap="round" />
      <path d="M6 9h6" strokeLinecap="round" />
      <path d="M15.5 9.5A7 7 0 1115 17" />
    </svg>
  )
}

// Shield/Security icon - for trust
export function ShieldIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Star icon - for ratings/featured
export function StarIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

// Crown icon - for leaderboard/winners
export function CrownIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 17l3-11 5 4 2-8 2 8 5-4 3 11H2z" fill="currentColor" fillOpacity="0.2" />
      <path d="M2 17l3-11 5 4 2-8 2 8 5-4 3 11H2z" />
      <path d="M4 21h16" strokeLinecap="round" />
    </svg>
  )
}

// Timer/Clock icon - for countdowns
export function TimerIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="13" r="9" />
      <path d="M12 9v4l2 2" strokeLinecap="round" />
      <path d="M9 2h6" strokeLinecap="round" />
      <path d="M12 2v2" strokeLinecap="round" />
    </svg>
  )
}

// Fire icon - for hot/trending
export function FireIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-4.97 0-9-3.58-9-8 0-2.52 1.17-4.83 3-6.36V8c0-.55.45-1 1-1s1 .45 1 1v1.26c.8-.53 1.72-.91 2.72-1.12.4-.08.78.21.78.62v.74c0 .29-.19.55-.46.63C8.61 10.75 7 12.72 7 15c0 2.76 2.24 5 5 5s5-2.24 5-5c0-2.28-1.61-4.25-4.04-4.87-.27-.08-.46-.34-.46-.63v-.74c0-.41.38-.7.78-.62 1 .21 1.92.59 2.72 1.12V8c0-.55.45-1 1-1s1 .45 1 1v.64c1.83 1.53 3 3.84 3 6.36 0 4.42-4.03 8-9 8z" />
      <circle cx="12" cy="15" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

// Users icon - for player count
export function UsersIcon({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

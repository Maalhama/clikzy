'use client'

interface SkipLinkProps {
  href?: string
  children?: React.ReactNode
}

export function SkipLink({ href = '#main-content', children = 'Aller au contenu principal' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999999] focus:px-4 focus:py-2 focus:bg-neon-purple focus:text-white focus:rounded-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-white"
    >
      {children}
    </a>
  )
}

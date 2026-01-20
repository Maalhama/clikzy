'use client'

import { memo } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onNext: () => void
  onPrev: () => void
}

export const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onNext,
  onPrev,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Always show first page
    pages.push(1)

    if (currentPage > 3) {
      pages.push('ellipsis')
    }

    // Pages around current
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis')
    }

    // Always show last page
    if (!pages.includes(totalPages)) {
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10">
      {/* Info */}
      <div className="text-white/50 text-sm">
        <span className="text-white font-medium">{startItem}-{endItem}</span> sur{' '}
        <span className="text-white font-medium">{totalItems}</span> produits
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Prev button */}
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg
            transition-all duration-200
            ${
              currentPage === 1
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-bg-secondary/80 text-white hover:bg-neon-purple/20 hover:text-neon-purple border border-white/10 hover:border-neon-purple/50'
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-white/30">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-lg
                  font-medium text-sm transition-all duration-200
                  ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white'
                      : 'bg-bg-secondary/80 text-white/70 hover:text-white border border-white/10 hover:border-white/20'
                  }
                `}
                style={
                  currentPage === page
                    ? {
                        boxShadow: '0 0 15px rgba(155, 92, 255, 0.4)',
                      }
                    : undefined
                }
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next button */}
        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg
            transition-all duration-200
            ${
              currentPage === totalPages
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-bg-secondary/80 text-white hover:bg-neon-purple/20 hover:text-neon-purple border border-white/10 hover:border-neon-purple/50'
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
})

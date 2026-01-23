import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (classnames utility)', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'included', false && 'excluded')
    expect(result).toBe('base included')
  })

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'px-6')
    expect(result).toBe('py-2 px-6')
  })

  it('should handle undefined and null', () => {
    const result = cn('base', undefined, null, 'end')
    expect(result).toBe('base end')
  })

  it('should handle empty strings', () => {
    const result = cn('base', '', 'end')
    expect(result).toBe('base end')
  })
})

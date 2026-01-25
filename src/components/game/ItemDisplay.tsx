'use client'

import Image from 'next/image'
import type { Item } from '@/types/database'

type ItemDisplayProps = {
  item: Item
  className?: string
}

export function ItemDisplay({ item, className = '' }: ItemDisplayProps) {
  return (
    <div className={`overflow-hidden rounded-xl ${className}`}>
      {/* Image container with gradient border */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-purple via-neon-blue to-neon-pink opacity-50 blur-xl group-hover:opacity-75 transition-opacity" />
        <div className="relative aspect-video bg-bg-tertiary flex items-center justify-center p-8 border border-bg-tertiary rounded-xl">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-contain drop-shadow-2xl transition-transform group-hover:scale-105 p-8"
            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 50vw, 45vw"
            priority
            quality={85}
          />
        </div>
      </div>

      {/* Item info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {item.name}
            </h2>
            {item.description && (
              <p className="text-text-secondary mt-2 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          {item.retail_value && (
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-success neon-text-success">
                {item.retail_value.toFixed(0)}€
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

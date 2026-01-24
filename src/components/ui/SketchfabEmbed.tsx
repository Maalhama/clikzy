'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'

interface SketchfabEmbedProps {
  modelUrl: string | null
  fallbackImage: string
  fallbackAlt: string
  className?: string
  autoplay?: boolean
}

function extractSketchfabUid(url: string): string | null {
  // URL format: https://sketchfab.com/3d-models/{slug}-{uid}
  // or: https://sketchfab.com/models/{uid}/embed
  const match = url.match(/([a-f0-9]{32})(?:\/embed)?$/i)
  return match ? match[1] : null
}

export function SketchfabEmbed({
  modelUrl,
  fallbackImage,
  fallbackAlt,
  className = '',
  autoplay = true,
}: SketchfabEmbedProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const embedUrl = useMemo(() => {
    if (!modelUrl) return null
    const uid = extractSketchfabUid(modelUrl)
    if (!uid) return null

    const params = new URLSearchParams({
      autospin: '1',
      autostart: autoplay ? '1' : '0',
      ui_theme: 'dark',
      ui_infos: '0',
      ui_controls: '0',
      ui_stop: '0',
      ui_inspector: '0',
      ui_watermark: '0',
      ui_watermark_link: '0',
      ui_ar: '0',
      ui_help: '0',
      ui_settings: '0',
      ui_vr: '0',
      ui_fullscreen: '0',
      ui_annotations: '0',
      transparent: '1',
    })

    return `https://sketchfab.com/models/${uid}/embed?${params.toString()}`
  }, [modelUrl, autoplay])

  if (!embedUrl || hasError) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={fallbackImage}
          alt={fallbackAlt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary/50">
          <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <iframe
        title="3D Model"
        src={embedUrl}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
    </div>
  )
}

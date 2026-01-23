'use client'

import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei'
import { ProductFallback3D } from './ProductFallback3D'
import * as THREE from 'three'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  modelUrl?: string
  fallbackType: 'phone' | 'console' | 'laptop' | 'headphones' | 'watch' | 'generic'
  fallbackColor: string
  scale?: number
  value: number
}

// 3D Model loader
function ProductModel({ url, scale = 1 }: { url: string; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(url)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.008
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={scale} />
    </group>
  )
}

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="w-10 h-10 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-white/50">Chargement 3D...</span>
      </div>
    </Html>
  )
}

interface ProductShowcase3DProps {
  products?: Product[]
  className?: string
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'iPhone 17 Pro Max',
    modelUrl: '/models/Iphone17promax.glb',
    fallbackType: 'phone',
    fallbackColor: '#1a1a1a',
    scale: 10,
    value: 1479,
  },
  {
    id: '2',
    name: 'PlayStation 5',
    modelUrl: '/models/playstation_5_digital_edition.glb',
    fallbackType: 'console',
    fallbackColor: '#ffffff',
    scale: 0.6,
    value: 549,
  },
  {
    id: '3',
    name: 'MacBook Pro M5',
    modelUrl: '/models/macbook_pro_m3_16_inch_2024.glb',
    fallbackType: 'laptop',
    fallbackColor: '#C0C0C0',
    scale: 2.5,
    value: 2499,
  },
  {
    id: '4',
    name: 'AirPods Pro',
    modelUrl: '/models/airpods_pro_3.glb',
    fallbackType: 'headphones',
    fallbackColor: '#E5E5E5',
    scale: 10,
    value: 279,
  },
  {
    id: '5',
    name: 'Apple Watch Series 11',
    modelUrl: '/models/apple_watch_series_9.glb',
    fallbackType: 'watch',
    fallbackColor: '#FF9500',
    scale: 18,
    value: 449,
  },
]

export function ProductShowcase3D({
  products = DEFAULT_PRODUCTS,
  className = '',
}: ProductShowcase3DProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [modelError] = useState<Record<string, boolean>>({})

  const currentProduct = products[currentIndex]

  const nextProduct = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length)
  }

  const prevProduct = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)
  }

  return (
    <div className={`relative ${className}`}>
      {/* 3D Canvas */}
      <div className="relative h-[400px] md:h-[500px]">
        {/* Glow effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-neon-purple/30 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-neon-blue/20 rounded-full blur-[80px]" />
        </div>

        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={<LoadingSpinner />}>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <spotLight
              position={[10, 10, 10]}
              angle={0.15}
              penumbra={1}
              intensity={1.5}
              castShadow
            />

            {/* Colored accent lights */}
            <pointLight position={[5, 2, 5]} intensity={0.8} color="#9B5CFF" />
            <pointLight position={[-5, 2, -5]} intensity={0.6} color="#3CCBFF" />
            <pointLight position={[0, -3, 3]} intensity={0.4} color="#FF4FD8" />

            {/* Product - use model if available, otherwise fallback */}
            {currentProduct.modelUrl && !modelError[currentProduct.id] ? (
              <ProductModel
                url={currentProduct.modelUrl}
                scale={currentProduct.scale}
              />
            ) : (
              <ProductFallback3D
                type={currentProduct.fallbackType}
                color={currentProduct.fallbackColor}
              />
            )}

            {/* Environment */}
            <Environment preset="city" />

            {/* Shadow */}
            <ContactShadows
              position={[0, -1.8, 0]}
              opacity={0.5}
              scale={8}
              blur={2.5}
              far={4}
            />

            {/* Controls - allow drag rotation */}
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate={false}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 1.8}
            />
          </Suspense>
        </Canvas>

        {/* Navigation arrows */}
        <button
          onClick={prevProduct}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-neon-purple/30 border border-white/20 hover:border-neon-purple/50 rounded-full flex items-center justify-center transition-all z-10 backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextProduct}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-neon-purple/30 border border-white/20 hover:border-neon-purple/50 rounded-full flex items-center justify-center transition-all z-10 backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Drag hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/30 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
          Glisse pour faire tourner
        </div>
      </div>

      {/* Product info */}
      <div className="text-center mt-6">
        <h3 className="text-2xl md:text-3xl font-black mb-2">{currentProduct.name}</h3>
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-4xl font-black text-neon-purple">{currentProduct.value}€</span>
          <span className="text-white/40">a gagner</span>
        </div>
        <Link
          href={`/game/${currentProduct.id}`}
          className="gaming-btn px-8 py-3 text-lg font-bold inline-flex items-center gap-2"
        >
          PARTICIPER
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${index === currentIndex
                ? 'w-8 bg-neon-purple'
                : 'bg-white/20 hover:bg-white/40'
              }
            `}
          />
        ))}
      </div>
    </div>
  )
}

'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'

interface ModelProps {
  url: string
  scale?: number
  rotation?: [number, number, number]
  autoRotate?: boolean
  rotationSpeed?: number
}

function Model({ url, scale = 1, rotation = [0, 0, 0], autoRotate = true, rotationSpeed = 0.005 }: ModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(url)

  useFrame(() => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += rotationSpeed
    }
  })

  return (
    <group ref={groupRef} rotation={rotation}>
      <primitive object={scene} scale={scale} />
    </group>
  )
}

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    </Html>
  )
}

interface Product3DViewerProps {
  modelUrl: string
  scale?: number
  rotation?: [number, number, number]
  autoRotate?: boolean
  rotationSpeed?: number
  enableZoom?: boolean
  enablePan?: boolean
  className?: string
  backgroundColor?: string
}

export function Product3DViewer({
  modelUrl,
  scale = 1,
  rotation = [0, 0, 0],
  autoRotate = true,
  rotationSpeed = 0.005,
  enableZoom = false,
  enablePan = false,
  className = '',
  backgroundColor = 'transparent',
}: Product3DViewerProps) {
  return (
    <div className={`w-full h-full ${className}`} style={{ backgroundColor }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
            castShadow
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          {/* Purple accent light */}
          <pointLight position={[5, 0, 5]} intensity={0.5} color="#9B5CFF" />

          {/* Blue accent light */}
          <pointLight position={[-5, 0, -5]} intensity={0.5} color="#3CCBFF" />

          {/* Model */}
          <Model
            url={modelUrl}
            scale={scale}
            rotation={rotation}
            autoRotate={autoRotate}
            rotationSpeed={rotationSpeed}
          />

          {/* Environment for reflections */}
          <Environment preset="city" />

          {/* Shadow */}
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
          />

          {/* Controls */}
          <OrbitControls
            enableZoom={enableZoom}
            enablePan={enablePan}
            autoRotate={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Preload models for better performance
export function preloadModel(url: string) {
  useGLTF.preload(url)
}

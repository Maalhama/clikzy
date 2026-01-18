'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, Float, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

interface ProductModelProps {
  url: string
  scale?: number
  position?: [number, number, number]
  rotationSpeed?: number
}

function ProductModel({ url, scale = 1, position = [0, 0, 0], rotationSpeed = 0.01 }: ProductModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(url)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <primitive object={scene.clone()} scale={scale} />
    </group>
  )
}

function LoadingBox({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02
      meshRef.current.rotation.x += 0.01
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={color} wireframe />
    </mesh>
  )
}

interface HeroProducts3DProps {
  className?: string
}

export function HeroProducts3D({ className = '' }: HeroProducts3DProps) {
  return (
    <div className={`relative w-full h-full min-h-[500px] ${className}`}>
      {/* Glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[200px] h-[200px] bg-neon-purple/30 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[150px] h-[150px] bg-neon-blue/30 rounded-full blur-[60px]" />
        <div className="absolute top-1/2 right-1/3 w-[100px] h-[100px] bg-neon-pink/20 rounded-full blur-[50px]" />
      </div>

      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={
          <>
            <LoadingBox position={[0, 0, 0]} color="#9B5CFF" />
            <LoadingBox position={[2.5, 1, -1]} color="#3CCBFF" />
            <LoadingBox position={[-2.5, -0.5, -1]} color="#FF4FD8" />
          </>
        }>
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
          <pointLight position={[5, 2, 5]} intensity={1} color="#9B5CFF" />
          <pointLight position={[-5, 2, -5]} intensity={0.8} color="#3CCBFF" />
          <pointLight position={[0, -3, 3]} intensity={0.5} color="#FF4FD8" />

          {/* Main product - iPhone (center, larger) */}
          <Float
            speed={2}
            rotationIntensity={0.3}
            floatIntensity={0.5}
          >
            <ProductModel
              url="/models/Iphone17promax.glb"
              scale={10}
              position={[0, 0, 0]}
              rotationSpeed={0.008}
            />
          </Float>

          {/* PS5 - top right */}
          <Float
            speed={1.5}
            rotationIntensity={0.2}
            floatIntensity={0.4}
          >
            <ProductModel
              url="/models/playstation_5_digital_edition.glb"
              scale={0.6}
              position={[3, 1.5, -2]}
              rotationSpeed={0.006}
            />
          </Float>

          {/* MacBook - bottom left */}
          <Float
            speed={1.8}
            rotationIntensity={0.25}
            floatIntensity={0.35}
          >
            <ProductModel
              url="/models/macbook_pro_m3_16_inch_2024.glb"
              scale={2.5}
              position={[-3, -1, -2]}
              rotationSpeed={0.007}
            />
          </Float>

          {/* AirPods - top left */}
          <Float
            speed={2.2}
            rotationIntensity={0.3}
            floatIntensity={0.45}
          >
            <ProductModel
              url="/models/airpods_pro_3.glb"
              scale={10}
              position={[-2.5, 1.8, -1]}
              rotationSpeed={0.01}
            />
          </Float>

          {/* Apple Watch - bottom right */}
          <Float
            speed={1.6}
            rotationIntensity={0.2}
            floatIntensity={0.3}
          >
            <ProductModel
              url="/models/apple_watch_series_9.glb"
              scale={18}
              position={[2.8, -1.5, -1]}
              rotationSpeed={0.009}
            />
          </Float>

          {/* Environment */}
          <Environment preset="city" />

          {/* Shadow */}
          <ContactShadows
            position={[0, -2.5, 0]}
            opacity={0.3}
            scale={15}
            blur={2}
            far={5}
          />
        </Suspense>
      </Canvas>

      {/* Floating particles overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => {
          const left = ((i * 17 + 7) % 100)
          const top = ((i * 23 + 11) % 100)
          const delay = (i * 0.4) % 5
          const duration = 4 + (i % 3)
          return (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full animate-float-particle"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                backgroundColor: i % 3 === 0 ? '#9B5CFF' : i % 3 === 1 ? '#3CCBFF' : '#FF4FD8',
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// Preload all models
useGLTF.preload('/models/Iphone17promax.glb')
useGLTF.preload('/models/playstation_5_digital_edition.glb')
useGLTF.preload('/models/macbook_pro_m3_16_inch_2024.glb')
useGLTF.preload('/models/airpods_pro_3.glb')
useGLTF.preload('/models/apple_watch_series_9.glb')

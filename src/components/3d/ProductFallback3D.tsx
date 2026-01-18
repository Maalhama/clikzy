'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface ProductFallback3DProps {
  type: 'phone' | 'console' | 'laptop' | 'headphones' | 'watch' | 'generic'
  color?: string
  name?: string
}

// iPhone-like shape
function PhoneShape({ color }: { color: string }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008
    }
  })

  return (
    <group ref={meshRef}>
      {/* Phone body */}
      <RoundedBox args={[1, 2, 0.1]} radius={0.08} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </RoundedBox>
      {/* Screen */}
      <RoundedBox args={[0.85, 1.8, 0.02]} radius={0.05} smoothness={4} position={[0, 0, 0.06]}>
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={0.2}
          anisotropy={0.3}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.1}
          color="#0a0a0a"
        />
      </RoundedBox>
      {/* Camera bump */}
      <RoundedBox args={[0.35, 0.35, 0.05]} radius={0.05} smoothness={4} position={[-0.25, 0.7, -0.07]}>
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </RoundedBox>
    </group>
  )
}

// PS5-like shape
function ConsoleShape({ color }: { color: string }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008
    }
  })

  return (
    <group ref={meshRef}>
      {/* Main body */}
      <RoundedBox args={[1.2, 1.8, 0.4]} radius={0.05} smoothness={4}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </RoundedBox>
      {/* Side panel left */}
      <mesh position={[-0.65, 0, 0]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.1, 1.9, 0.45]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Side panel right */}
      <mesh position={[0.65, 0, 0]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.1, 1.9, 0.45]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Blue accent */}
      <mesh position={[0, -0.3, 0.21]}>
        <boxGeometry args={[0.8, 0.02, 0.02]} />
        <meshStandardMaterial color="#0070D1" emissive="#0070D1" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

// MacBook-like shape
function LaptopShape({ color }: { color: string }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008
    }
  })

  return (
    <group ref={meshRef} rotation={[0.2, 0, 0]}>
      {/* Base */}
      <RoundedBox args={[2, 0.08, 1.4]} radius={0.02} smoothness={4} position={[0, -0.5, 0.3]}>
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </RoundedBox>
      {/* Screen */}
      <RoundedBox args={[2, 1.3, 0.04]} radius={0.02} smoothness={4} position={[0, 0.15, -0.35]} rotation={[-0.3, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </RoundedBox>
      {/* Display */}
      <RoundedBox args={[1.8, 1.1, 0.01]} radius={0.01} smoothness={4} position={[0, 0.15, -0.32]} rotation={[-0.3, 0, 0]}>
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.3}
          chromaticAberration={0.1}
          color="#0a0a0a"
        />
      </RoundedBox>
    </group>
  )
}

// AirPods Max-like shape
function HeadphonesShape({ color }: { color: string }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008
    }
  })

  return (
    <group ref={meshRef}>
      {/* Headband */}
      <mesh>
        <torusGeometry args={[0.6, 0.05, 16, 32, Math.PI]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Left ear cup */}
      <group position={[-0.6, -0.3, 0]}>
        <mesh>
          <cylinderGeometry args={[0.35, 0.35, 0.15, 32]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.6} />
        </mesh>
      </group>
      {/* Right ear cup */}
      <group position={[0.6, -0.3, 0]}>
        <mesh>
          <cylinderGeometry args={[0.35, 0.35, 0.15, 32]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
}

// Apple Watch-like shape
function WatchShape({ color }: { color: string }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008
    }
  })

  return (
    <group ref={meshRef} scale={1.5}>
      {/* Watch body */}
      <RoundedBox args={[0.5, 0.6, 0.15]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </RoundedBox>
      {/* Screen */}
      <RoundedBox args={[0.4, 0.5, 0.02]} radius={0.08} smoothness={4} position={[0, 0, 0.08]}>
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.3}
          color="#0a0a0a"
        />
      </RoundedBox>
      {/* Crown */}
      <mesh position={[0.28, 0.1, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.08, 16]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Band top */}
      <RoundedBox args={[0.45, 0.5, 0.05]} radius={0.02} smoothness={4} position={[0, 0.55, 0]}>
        <meshStandardMaterial color="#333" metalness={0.2} roughness={0.8} />
      </RoundedBox>
      {/* Band bottom */}
      <RoundedBox args={[0.45, 0.5, 0.05]} radius={0.02} smoothness={4} position={[0, -0.55, 0]}>
        <meshStandardMaterial color="#333" metalness={0.2} roughness={0.8} />
      </RoundedBox>
    </group>
  )
}

// Generic product shape
function GenericShape({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.1
    }
  })

  return (
    <RoundedBox ref={meshRef} args={[1.5, 1.5, 0.3]} radius={0.15} smoothness={4}>
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        envMapIntensity={1}
      />
    </RoundedBox>
  )
}

export function ProductFallback3D({ type, color = '#9B5CFF' }: ProductFallback3DProps) {
  switch (type) {
    case 'phone':
      return <PhoneShape color={color} />
    case 'console':
      return <ConsoleShape color={color} />
    case 'laptop':
      return <LaptopShape color={color} />
    case 'headphones':
      return <HeadphonesShape color={color} />
    case 'watch':
      return <WatchShape color={color} />
    default:
      return <GenericShape color={color} />
  }
}

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'

interface Asset3DViewerProps {
  modelUrl?: string
  className?: string
  autoRotate?: boolean
}

/**
 * Simple 3D model component
 */
function SimpleModel() {
  // For now, render a simple box as placeholder
  // In a real app, you would load the actual 3D model
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
  )
}

/**
 * 3D Asset Viewer component for dynamic loading
 * Reduces initial bundle size by lazy loading Three.js
 */
const Asset3DViewer: React.FC<Asset3DViewerProps> = ({ 
  className = "h-96", 
  autoRotate = true 
}) => {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        className="rounded-lg"
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          <SimpleModel />
          
          <OrbitControls 
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            enablePan={false}
            enableZoom={true}
            minDistance={3}
            maxDistance={10}
          />
          
          <Environment preset="city" />
          <ContactShadows 
            position={[0, -2, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2} 
            far={4} 
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Asset3DViewer
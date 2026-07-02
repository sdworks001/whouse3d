import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { WarehouseLayout } from '../../types/warehouse';
import { Floor } from './Floor';
import { Rack3D } from './Rack3D';
import { Forklift3D } from './Forklift3D';

interface WarehouseCanvasProps {
  layout: WarehouseLayout;
  selectedBayId: string | null;
  onSelectBay: (bayId: string) => void;
  onMoveRack: (rackId: string, x: number, z: number) => void;
  cameraView: 'orbit' | 'top' | 'isometric' | 'aisle';
  theme?: 'dark' | 'light';
}

// Sub-component to manage smooth camera transitions and floor click navigation
const CameraHandler: React.FC<{ 
  view: string; 
  clickTarget: THREE.Vector3 | null; 
}> = ({ view, clickTarget }) => {
  const { camera, controls } = useThree();
  const targetPos = useRef<THREE.Vector3>(new THREE.Vector3(25, 30, 45));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 2, 0));
  const isTransitioning = useRef<boolean>(true);

  // Interrupt camera lerping as soon as user starts interacting manually
  useEffect(() => {
    if (!controls) return;
    
    const handleStart = () => {
      isTransitioning.current = false;
    };
    
    (controls as any).addEventListener('start', handleStart);
    return () => {
      (controls as any).removeEventListener('start', handleStart);
    };
  }, [controls]);

  useEffect(() => {
    isTransitioning.current = true;
    switch (view) {
      case 'top':
        targetPos.current.set(0, 65, 0.1); // Slightly off 0 on Z to maintain controls up-vector
        targetLookAt.current.set(0, 0, 0);
        break;
      case 'isometric':
        targetPos.current.set(38, 35, 42);
        targetLookAt.current.set(0, 2, 0);
        break;
      case 'aisle':
        targetPos.current.set(-10, 3, 30);
        targetLookAt.current.set(-10, 2, -20);
        break;
      case 'orbit':
      default:
        targetPos.current.set(30, 25, 40);
        targetLookAt.current.set(0, 2, 0);
        break;
    }
  }, [view]);

  // Handle floor clicks to move target
  useEffect(() => {
    if (clickTarget) {
      isTransitioning.current = true;
      targetLookAt.current.copy(clickTarget);
      
      // Calculate relative camera offset to preserve user's zoom/orbit angle, clamped to safety limits
      const offset = new THREE.Vector3().subVectors(camera.position, targetLookAt.current);
      const len = offset.length();
      const clampedLen = Math.max(10, Math.min(50, len));
      offset.setLength(clampedLen);
      
      targetPos.current.copy(targetLookAt.current).add(offset);
      // Ensure Y height doesn't go below safety bounds
      if (targetPos.current.y < 3) {
        targetPos.current.y = 15;
      }
    }
  }, [clickTarget, camera]);

  useFrame(() => {
    if (!isTransitioning.current) return;

    // Check distance left to target
    const distCam = camera.position.distanceTo(targetPos.current);
    let distTarget = 0;
    if (controls) {
      distTarget = (controls as any).target.distanceTo(targetLookAt.current);
    }

    // Stop transition if we are close enough to let OrbitControls take full control
    if (distCam < 0.05 && distTarget < 0.05) {
      isTransitioning.current = false;
      return;
    }

    // Smoothly lerp camera position
    camera.position.lerp(targetPos.current, 0.05);
    
    // Smoothly lerp controls target
    if (controls) {
      (controls as any).target.lerp(targetLookAt.current, 0.05);
      (controls as any).update();
    }
  });

  return null;
};

export const WarehouseCanvas: React.FC<WarehouseCanvasProps> = ({
  layout,
  selectedBayId,
  onSelectBay,
  onMoveRack,
  cameraView,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0d0f13' : '#f4f6f9';

  // Generate ceiling point lights above aisles for warehouse look
  const lightPositions = layout.aisles.map(aisle => [
    [aisle.x, 15, -layout.floor.length / 3],
    [aisle.x, 15, 0],
    [aisle.x, 15, layout.floor.length / 3]
  ]).flat();

  const [clickTarget, setClickTarget] = useState<THREE.Vector3 | null>(null);

  return (
    <div className="canvas-container">
      <Canvas
        shadows
        camera={{ position: [30, 25, 40], fov: 45 }}
        gl={{ antialias: true, logarithmicDepthBuffer: true }}
      >
        <color attach="background" args={[bgColor]} />
        
        {/* Fog to give digital twin feeling of scale */}
        <fog attach="fog" args={[bgColor, 30, 110]} />

        {/* Dynamic camera handler */}
        <CameraHandler view={cameraView} clickTarget={clickTarget} />

        {/* Ambient & Global Directional Light */}
        <ambientLight intensity={isDark ? 0.4 : 0.65} />
        
        <directionalLight
          position={[20, 45, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={120}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-bias={-0.0001}
        />

        {/* Ceiling High-Bay Lights (aligned with aisles) */}
        {lightPositions.map((pos, idx) => (
          <group key={`bay-light-${idx}`} position={pos as [number, number, number]}>
            {/* Visual fixture */}
            <mesh>
              <cylinderGeometry args={[0.3, 0.4, 0.2, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Actual light source */}
            <pointLight 
              intensity={0.6} 
              distance={30} 
              decay={2} 
              color="#e0f0ff" 
              castShadow
            />
          </group>
        ))}

        {/* Scene Floor */}
        <Floor 
          floor={layout.floor} 
          aisles={layout.aisles} 
          onFloorDoubleClick={setClickTarget} 
          isDark={isDark}
        />

        {/* Racks Group */}
        <group>
          {layout.racks.map((rack) => (
            <Rack3D
              key={rack.id}
              rack={rack}
              selectedBayId={selectedBayId}
              onSelectBay={onSelectBay}
              onMoveRack={onMoveRack}
              floorWidth={layout.floor.width}
              floorLength={layout.floor.length}
            />
          ))}
        </group>

        {/* Active Forklifts */}
        {layout.forklifts.map((forklift) => (
          <Forklift3D
            key={forklift.id}
            forklift={forklift}
            floorLength={layout.floor.length}
          />
        ))}

        {/* Navigation Orbit Controls */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.02} // Stop camera from going below floor level
          minDistance={5}
          maxDistance={90}
        />
      </Canvas>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Forklift } from '../../types/warehouse';

interface Forklift3DProps {
  forklift: Forklift;
  floorLength: number;
}

export const Forklift3D: React.FC<Forklift3DProps> = ({ forklift, floorLength }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Keep local state for position and rotation to animate smoothly in useFrame
  const [waypointIdx, setWaypointIdx] = useState(forklift.currentWaypointIndex || 0);
  const [beaconPulse, setBeaconPulse] = useState(0);
  const [pauseTicks, setPauseTicks] = useState(0);
  const [hasBox, setHasBox] = useState(!!forklift.loadedItem);

  // Speed multiplier
  const speed = forklift.speed;
  const path = forklift.path || [];

  useFrame(() => {
    if (!meshRef.current || path.length === 0) return;

    // Dynamic beacon light pulse
    setBeaconPulse((prev) => (prev + 0.15) % (Math.PI * 2));

    // Handle pause loading/unloading state
    if (pauseTicks > 0) {
      setPauseTicks((prev) => prev - 1);
      return;
    }

    const currentX = meshRef.current.position.x;
    const currentZ = meshRef.current.position.z;

    const [tx, tz] = path[waypointIdx];

    // Distance to waypoint
    const dx = tx - currentX;
    const dz = tz - currentZ;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 0.25) {
      // Move towards target
      const angle = Math.atan2(dx, dz);
      
      // Calculate next position
      const moveX = currentX + Math.sin(angle) * speed;
      const moveZ = currentZ + Math.cos(angle) * speed;

      meshRef.current.position.x = moveX;
      meshRef.current.position.z = moveZ;

      // Rotate towards target (smoothly interpolate rotation)
      const targetRotation = angle;
      // Wrap rotations
      let diff = targetRotation - meshRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      meshRef.current.rotation.y += diff * 0.15;
    } else {
      // Reached waypoint! Check if it is a staging dock (close to far end Z)
      const isDock = tz >= floorLength / 2 - 5;
      const isStart = tz <= -floorLength / 2 + 15;

      if (isDock) {
        setPauseTicks(100); // Pause for loading (approx 1.6s)
        setHasBox(true);    // Load box
      } else if (isStart) {
        setPauseTicks(60);  // Pause for unloading
        setHasBox(false);   // Unload box
      }

      // Increment waypoint index
      setWaypointIdx((prev) => (prev + 1) % path.length);
    }
  });

  return (
    <group ref={meshRef} position={[forklift.x, forklift.y, forklift.z]}>
      {/* --- Forklift Chassis (Body) --- */}
      {/* Main Base */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.2, 0.5, 1.8]} />
        <meshStandardMaterial color="#f5c242" roughness={0.4} metalness={0.5} /> {/* Yellow body */}
      </mesh>

      {/* Counterweight (Back) */}
      <mesh position={[0, 0.6, -0.7]} castShadow>
        <boxGeometry args={[1.2, 0.7, 0.4]} />
        <meshStandardMaterial color="#2e3440" roughness={0.5} />
      </mesh>

      {/* Cabin Roof Frame */}
      <mesh position={[0, 1.1, -0.1]} castShadow>
        <boxGeometry args={[1.0, 0.9, 1.0]} />
        <meshStandardMaterial color="#1a1c23" wireframe />
      </mesh>
      
      {/* Cabin Solid Pillars */}
      {[-0.45, 0.45].map((xOffset) => 
        [-0.45, 0.45].map((zOffset) => (
          <mesh 
            key={`pillar-${xOffset}-${zOffset}`} 
            position={[xOffset, 1.1, zOffset]} 
            castShadow
          >
            <boxGeometry args={[0.08, 0.9, 0.08]} />
            <meshStandardMaterial color="#2e3440" />
          </mesh>
        ))
      )}

      {/* --- Wheels (4 wheels) --- */}
      {/* Front Left */}
      <mesh position={[-0.65, 0.3, 0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.25, 12]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      {/* Front Right */}
      <mesh position={[0.65, 0.3, 0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.25, 12]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      {/* Back Left */}
      <mesh position={[-0.65, 0.25, -0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 12]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      {/* Back Right */}
      <mesh position={[0.65, 0.25, -0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 12]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>

      {/* --- Flashing Beacon Light on Roof --- */}
      <mesh position={[0, 1.6, -0.2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 8]} />
        <meshStandardMaterial 
          color="#ff7b00" 
          emissive="#ff7b00" 
          emissiveIntensity={Math.sin(beaconPulse) * 1.5 + 1.5} 
        />
      </mesh>

      {/* --- Mast & Fork Lift System (Front) --- */}
      {/* Vertical Mast Rails */}
      <group position={[0, 0.9, 0.9]}>
        <mesh position={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 1.4, 0.08]} />
          <meshStandardMaterial color="#d8dee9" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 1.4, 0.08]} />
          <meshStandardMaterial color="#d8dee9" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Fork Carriage (Moves up/down - we keep it mid-height) */}
        <group position={[0, -0.2, 0.1]}>
          {/* Backplate */}
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.4, 0.05]} />
            <meshStandardMaterial color="#4c566a" />
          </mesh>
          
          {/* Left Metal Prong */}
          <mesh position={[-0.2, -0.2, 0.35]} castShadow>
            <boxGeometry args={[0.08, 0.04, 0.7]} />
            <meshStandardMaterial color="#88c0d0" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Right Metal Prong */}
          <mesh position={[0.2, -0.2, 0.35]} castShadow>
            <boxGeometry args={[0.08, 0.04, 0.7]} />
            <meshStandardMaterial color="#88c0d0" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Render loaded Cargo Box if any */}
          {hasBox && (
            <mesh position={[0, 0.2, 0.3]} castShadow>
              <boxGeometry args={[0.65, 0.5, 0.65]} />
              <meshStandardMaterial color="#e5c07b" roughness={0.8} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
};

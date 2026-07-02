import React, { useState } from 'react';
import type { Bay } from '../../types/warehouse';

interface Bay3DProps {
  bay: Bay;
  width: number;
  height: number;
  depth: number;
  position: [number, number, number];
  selectedBayId: string | null;
  onSelectBay: (bayId: string) => void;
}

export const Bay3D: React.FC<Bay3DProps> = ({
  bay,
  width,
  height,
  depth,
  position,
  selectedBayId,
  onSelectBay
}) => {
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedBayId === bay.id;

  // Click handler
  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelectBay(bay.id);
  };

  // Hover handlers
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  // Box dimensions (slightly smaller than the bay itself to leave gaps)
  const boxW = width * 0.85;
  const boxH = height * 0.75;
  const boxD = depth * 0.85;

  return (
    <group position={position}>
      {/* Interactive Trigger & Outline (always rendered, invisible or wireframe depending on status) */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial
          transparent
          opacity={isSelected ? 0.3 : hovered ? 0.15 : 0}
          color={isSelected ? '#0072ff' : '#ffffff'}
          wireframe
        />
      </mesh>

      {/* Selected Indicator Outline */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[width * 1.05, height * 1.05, depth * 1.05]} />
          <meshBasicMaterial 
            color="#00ffff" 
            wireframe 
            transparent 
            opacity={0.8} 
          />
        </mesh>
      )}

      {/* Render based on status */}
      {bay.status === 'occupied' && bay.item && (
        <group>
          {/* Main Cargo Box */}
          <mesh
            castShadow
            receiveShadow
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[boxW, boxH, boxD]} />
            <meshStandardMaterial
              color={bay.item.color}
              roughness={0.7}
              metalness={0.1}
              emissive={hovered ? bay.item.color : '#000000'}
              emissiveIntensity={hovered ? 0.25 : 0}
            />
          </mesh>

          {/* Wooden Pallet base under the box */}
          <mesh position={[0, -boxH / 2 - 0.05, 0]} castShadow>
            <boxGeometry args={[boxW * 1.02, 0.1, boxD * 1.02]} />
            <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
          </mesh>

          {/* Faint inventory label on the box front */}
          <mesh position={[0, 0, boxD / 2 + 0.005]}>
            <planeGeometry args={[boxW * 0.4, boxH * 0.3]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {bay.status === 'reserved' && (
        <mesh
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <boxGeometry args={[boxW, boxH, boxD]} />
          <meshStandardMaterial
            color="#d19a66"
            roughness={0.8}
            transparent
            opacity={0.5}
            wireframe
          />
        </mesh>
      )}

      {bay.status === 'empty' && hovered && (
        <mesh>
          <boxGeometry args={[boxW, boxH, boxD]} />
          <meshBasicMaterial
            color="#a3b8cc"
            transparent
            opacity={0.25}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
};

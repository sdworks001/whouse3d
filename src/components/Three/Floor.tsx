import React from 'react';
import type { Aisle, Floor as FloorType } from '../../types/warehouse';
import * as THREE from 'three';

interface FloorProps {
  floor: FloorType;
  aisles: Aisle[];
  onFloorDoubleClick: (point: THREE.Vector3) => void;
}

export const Floor: React.FC<FloorProps> = ({ floor, aisles, onFloorDoubleClick }) => {
  const { width, length } = floor;

  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    onFloorDoubleClick(e.point);
  };

  return (
    <group>
      {/* Main Floor Slab */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.01, 0]} 
        receiveShadow
        onDoubleClick={handleDoubleClick}
      >
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial 
          color="#1e222b" 
          roughness={0.6} 
          metalness={0.4} 
        />
      </mesh>

      {/* Outer Border / Safety Walls Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[width + 4, length + 4]} />
        <meshBasicMaterial color="#0d0f13" />
      </mesh>

      {/* Safety Warning Stripes along floor edges (yellow/black) */}
      <gridHelper 
        args={[width, Math.round(width / 2), '#3b4252', '#2e3440']} 
        position={[0, 0.001, 0]} 
      />

      {/* Aisles Rendering */}
      {aisles.map((aisle) => (
        <group key={aisle.id} position={[aisle.x, 0.002, aisle.z]}>
          {/* Main Aisle Pathway */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} onDoubleClick={handleDoubleClick}>
            <planeGeometry args={[aisle.width, aisle.length]} />
            <meshStandardMaterial
              color="#2a303c"
              transparent
              opacity={0.7}
              roughness={0.5}
            />
          </mesh>

          {/* Left Aisle Warning Border Line */}
          <mesh position={[-aisle.width / 2, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, aisle.length]} />
            <meshBasicMaterial color="#e5c07b" />
          </mesh>

          {/* Right Aisle Warning Border Line */}
          <mesh position={[aisle.width / 2, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, aisle.length]} />
            <meshBasicMaterial color="#e5c07b" />
          </mesh>
          
          {/* Loading dock zone indicator at the front end of the aisle */}
          <mesh position={[0, 0.001, aisle.length / 2 - 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[aisle.width - 0.4, 3]} />
            <meshStandardMaterial 
              color="#d19a66" 
              transparent 
              opacity={0.3} 
            />
          </mesh>
        </group>
      ))}

      {/* General Loading Zones / Staging Areas */}
      <group position={[0, 0.002, length / 2 - 4]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} onDoubleClick={handleDoubleClick}>
          <planeGeometry args={[width - 10, 6]} />
          <meshStandardMaterial 
            color="#4b5263" 
            transparent 
            opacity={0.2} 
            roughness={0.9} 
          />
        </mesh>
        
        {/* Loading Dock Outlines */}
        {[-15, 0, 15].map((xOffset, i) => (
          <group key={`dock-${i}`} position={[xOffset, 0.001, 1]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[6, 4]} />
              <meshBasicMaterial color="#61afef" wireframe />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

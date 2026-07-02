import React from 'react';
import type { Rack } from '../../types/warehouse';
import { Bay3D } from './Bay3D';

interface Rack3DProps {
  rack: Rack;
  selectedBayId: string | null;
  onSelectBay: (bayId: string) => void;
}

export const Rack3D: React.FC<Rack3DProps> = ({ rack, selectedBayId, onSelectBay }) => {
  const { x, z, y, rotation, width, length, height, levels, baysCount } = rack;

  const bayLength = length / baysCount;
  const bayHeight = 1.5;

  // Steel frame visual parameters
  const postThickness = 0.12;
  const beamThickness = 0.08;
  const steelColor = '#3b4252'; // Industrial slate grey
  const safetyOrange = '#d08770'; // Industrial safety orange

  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]}>
      {/* --- Vertical Steel Posts (4 Corners) --- */}
      {/* Front-Left Post */}
      <mesh position={[-width / 2 + postThickness / 2, height / 2, -length / 2 + postThickness / 2]} castShadow>
        <boxGeometry args={[postThickness, height, postThickness]} />
        <meshStandardMaterial color={safetyOrange} roughness={0.5} metalness={0.8} />
      </mesh>
      {/* Front-Right Post */}
      <mesh position={[width / 2 - postThickness / 2, height / 2, -length / 2 + postThickness / 2]} castShadow>
        <boxGeometry args={[postThickness, height, postThickness]} />
        <meshStandardMaterial color={safetyOrange} roughness={0.5} metalness={0.8} />
      </mesh>
      {/* Back-Left Post */}
      <mesh position={[-width / 2 + postThickness / 2, height / 2, length / 2 - postThickness / 2]} castShadow>
        <boxGeometry args={[postThickness, height, postThickness]} />
        <meshStandardMaterial color={safetyOrange} roughness={0.5} metalness={0.8} />
      </mesh>
      {/* Back-Right Post */}
      <mesh position={[width / 2 - postThickness / 2, height / 2, length / 2 - postThickness / 2]} castShadow>
        <boxGeometry args={[postThickness, height, postThickness]} />
        <meshStandardMaterial color={safetyOrange} roughness={0.5} metalness={0.8} />
      </mesh>

      {/* --- Horizontal Support Beams & Shelves for each level --- */}
      {levels.map((level) => {
        const beamY = level.yOffset - 0.05;

        return (
          <group key={`level-${level.levelIndex}`}>
            {/* Left Horizontal Beam (running along length, Z) */}
            <mesh position={[-width / 2 + postThickness / 2, beamY, 0]} castShadow>
              <boxGeometry args={[beamThickness, beamThickness, length]} />
              <meshStandardMaterial color={steelColor} roughness={0.6} metalness={0.7} />
            </mesh>

            {/* Right Horizontal Beam (running along length, Z) */}
            <mesh position={[width / 2 - postThickness / 2, beamY, 0]} castShadow>
              <boxGeometry args={[beamThickness, beamThickness, length]} />
              <meshStandardMaterial color={steelColor} roughness={0.6} metalness={0.7} />
            </mesh>

            {/* End Cross Connector - Front (running along width, X) */}
            <mesh position={[0, beamY, -length / 2 + postThickness / 2]} castShadow>
              <boxGeometry args={[width - postThickness * 2, beamThickness, beamThickness]} />
              <meshStandardMaterial color={steelColor} roughness={0.6} metalness={0.7} />
            </mesh>

            {/* End Cross Connector - Back (running along width, X) */}
            <mesh position={[0, beamY, length / 2 - postThickness / 2]} castShadow>
              <boxGeometry args={[width - postThickness * 2, beamThickness, beamThickness]} />
              <meshStandardMaterial color={steelColor} roughness={0.6} metalness={0.7} />
            </mesh>

            {/* Flat Shelf Board (Support mesh where pallets sit) */}
            <mesh position={[0, level.yOffset - 0.01, 0]} receiveShadow>
              <boxGeometry args={[width - 0.1, 0.02, length - 0.1]} />
              <meshStandardMaterial color="#4c566a" roughness={0.8} />
            </mesh>

            {/* --- Bays inside this level --- */}
            {level.bays.map((bay) => {
              // Z position of each bay
              const bayZ = -length / 2 + (bay.bayIndex + 0.5) * bayLength;
              const bayPos: [number, number, number] = [
                0,
                level.yOffset + bayHeight / 2,
                bayZ
              ];

              return (
                <Bay3D
                  key={bay.id}
                  bay={bay}
                  width={width - 0.2}
                  height={bayHeight}
                  depth={bayLength - 0.3}
                  position={bayPos}
                  selectedBayId={selectedBayId}
                  onSelectBay={onSelectBay}
                />
              );
            })}
          </group>
        );
      })}

      {/* Rack Identification Label plate on top */}
      <mesh position={[0, height + 0.2, -length / 2 + 0.2]}>
        <boxGeometry args={[1.2, 0.3, 0.05]} />
        <meshStandardMaterial color="#2e3440" />
      </mesh>
    </group>
  );
};

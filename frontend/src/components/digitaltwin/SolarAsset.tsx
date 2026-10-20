import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { Sun } from 'lucide-react';

interface SolarAssetProps {
  solarKw: number;
  capacityKw: number;
  isSelected: boolean;
  isInspectionMode?: boolean;
  onSelect: () => void;
}

export const SolarAsset: React.FC<SolarAssetProps> = ({
  solarKw,
  capacityKw,
  isSelected,
  isInspectionMode = false,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const utilizationPct = capacityKw > 0 ? (solarKw / capacityKw) * 100 : 0;
  const isGenerating = solarKw > 0.1;

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
      return () => {
        document.body.style.cursor = 'auto';
      };
    }
  }, [hovered]);

  // 3 Rows of 4 panels each
  const rows = [-1.5, 0, 1.5];
  const cols = [-1.8, -0.6, 0.6, 1.8];

  return (
    <group
      position={[-8, 0, -3]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Ground boundary / concrete footing pads */}
      <mesh receiveShadow position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.4, 4.6]} />
        <meshStandardMaterial
          color={isSelected ? '#BFD8C5' : hovered ? '#D0E0D4' : '#C5BFB2'}
          roughness={0.9}
        />
      </mesh>

      {/* Solar Panel Racks */}
      {rows.map((rZ, rIdx) =>
        cols.map((cX, cIdx) => (
          <group key={`${rIdx}-${cIdx}`} position={[cX, 0, rZ]}>
            {/* Front support post */}
            <mesh castShadow position={[0, 0.25, 0.35]}>
              <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
              <meshStandardMaterial color="#7E8783" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Rear support post (taller for 26 deg tilt) */}
            <mesh castShadow position={[0, 0.45, -0.35]}>
              <cylinderGeometry args={[0.02, 0.02, 0.9, 6]} />
              <meshStandardMaterial color="#7E8783" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Crossbeam */}
            <mesh position={[0, 0.52, 0]} rotation={[0.42, 0, 0]}>
              <boxGeometry args={[1.08, 0.02, 0.88]} />
              <meshStandardMaterial color="#4A524E" metalness={0.7} roughness={0.4} />
            </mesh>
            {/* PV Module Face */}
            <mesh
              castShadow
              receiveShadow
              position={[0, 0.54, 0]}
              rotation={[0.42, 0, 0]}
            >
              <boxGeometry args={[1.05, 0.02, 0.84]} />
              <meshStandardMaterial
                color={isGenerating ? '#182C4A' : '#141E2B'}
                roughness={0.25}
                metalness={0.65}
                emissive={isGenerating ? '#0E2442' : '#000000'}
                emissiveIntensity={isGenerating ? 0.25 : 0}
              />
            </mesh>
            {/* Panel Grid Lines (Simulated cell divisions) */}
            <mesh position={[0, 0.552, 0]} rotation={[0.42, 0, 0]}>
              <planeGeometry args={[1.03, 0.82]} />
              <meshBasicMaterial
                color="#6488AB"
                wireframe
                transparent
                opacity={isGenerating ? 0.35 : 0.15}
              />
            </mesh>
          </group>
        ))
      )}

      {/* Central String Inverter Cabinet */}
      <group position={[2.8, 0, 0]}>
        <mesh castShadow position={[0, 0.6, 0]}>
          <boxGeometry args={[0.4, 1.2, 0.8]} />
          <meshStandardMaterial color="#FAF9F5" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Status LED */}
        <mesh position={[0.21, 0.85, 0]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshBasicMaterial color={isGenerating ? '#10B981' : '#F59E0B'} />
        </mesh>
      </group>

      {/* Inspection Focus Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.2, 3.4, 48]} />
          <meshBasicMaterial
            color={isSelected ? '#1D3D2D' : '#5D7C6C'}
            transparent
            opacity={isSelected ? 0.9 : 0.6}
          />
        </mesh>
      )}

      {/* Floating 3D Label & Value Tag (hidden during close-up inspection to avoid blocking view) */}
      {!isSelected && !isInspectionMode && (
        <Html position={[0, 1.2, 0]} center distanceFactor={14} zIndexRange={[5, 0]} pointerEvents="none">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={`pointer-events-auto cursor-pointer transition-all duration-200 select-none px-2.5 py-1.5 rounded-lg shadow-md border backdrop-blur-sm flex items-center gap-2 ${
              hovered
                ? 'bg-[#FAF8F5] text-[#171E1A] border-[#1D3D2D] scale-105'
                : 'bg-[#FAF8F5]/92 text-[#171E1A] border-[#DCD5C5]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center ${
                isGenerating ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] font-medium tracking-wide uppercase opacity-75">
                Solar PV
              </span>
              <span className="text-xs font-semibold tabular-nums mt-0.5">
                {solarKw.toFixed(1)} <span className="text-[9px] font-normal">kW</span>
              </span>
            </div>
            {isGenerating && (
              <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 tabular-nums">
                {utilizationPct.toFixed(0)}%
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

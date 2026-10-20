import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { Building2 } from 'lucide-react';

interface FacilityAssetProps {
  demandKw: number;
  unservedKw: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const FacilityAsset: React.FC<FacilityAssetProps> = ({
  demandKw,
  unservedKw,
  isSelected,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const hasUnserved = unservedKw > 0.05;

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
      return () => {
        document.body.style.cursor = 'auto';
      };
    }
  }, [hovered]);

  // Window interior glow intensity scales gently with facility demand
  const glowIntensity = Math.min(1.0, 0.2 + (demandKw / 100) * 0.8);

  return (
    <group
      position={[6, 0, 4]}
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
      {/* Foundation plinth */}
      <mesh receiveShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[5.2, 0.16, 4.4]} />
        <meshStandardMaterial
          color={isSelected ? '#BFD8C5' : hovered ? '#D0E0D4' : '#C5BFB2'}
          roughness={0.9}
        />
      </mesh>

      {/* Main Two-Story Building Mass */}
      <mesh castShadow receiveShadow position={[0, 1.4, 0]}>
        <boxGeometry args={[4.4, 2.5, 3.4]} />
        <meshStandardMaterial color="#EBE7DE" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Modern Cantilevered Entrance Canopy */}
      <mesh castShadow position={[0, 1.1, 1.95]}>
        <boxGeometry args={[2.0, 0.12, 0.9]} />
        <meshStandardMaterial color="#1D3D2D" roughness={0.5} />
      </mesh>

      {/* Ground Floor Glass Curtain Ribbon (Translucent with interior warm light) */}
      <mesh position={[0, 0.65, 1.72]}>
        <planeGeometry args={[3.8, 0.9]} />
        <meshStandardMaterial
          color="#FEF3C7"
          emissive="#F59E0B"
          emissiveIntensity={glowIntensity}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      {/* Second Floor Glass Ribbon */}
      <mesh position={[0, 1.9, 1.72]}>
        <planeGeometry args={[3.8, 0.7]} />
        <meshStandardMaterial
          color="#FEF3C7"
          emissive="#F59E0B"
          emissiveIntensity={glowIntensity * 0.85}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      {/* North Side Windows */}
      <mesh position={[0, 1.9, -1.72]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3.6, 0.7]} />
        <meshStandardMaterial
          color="#FEF3C7"
          emissive="#F59E0B"
          emissiveIntensity={glowIntensity * 0.7}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      {/* Rooftop Parapet and HVAC Chiller Units */}
      <mesh castShadow position={[-0.9, 2.9, -0.6]}>
        <boxGeometry args={[1.2, 0.6, 1.0]} />
        <meshStandardMaterial color="#A39D90" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[1.0, 2.85, 0.5]}>
        <boxGeometry args={[1.0, 0.5, 1.1]} />
        <meshStandardMaterial color="#A39D90" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Selection / Inspection Focus Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.2, 3.4, 40]} />
          <meshBasicMaterial
            color={hasUnserved ? '#EF4444' : isSelected ? '#1D3D2D' : '#5D7C6C'}
            transparent
            opacity={isSelected ? 0.9 : 0.6}
          />
        </mesh>
      )}

      {/* Floating 3D Label & Value Tag (hidden during close-up inspection) */}
      {!isSelected && (
        <Html position={[0, 3.5, 0]} center distanceFactor={14}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={`cursor-pointer transition-all duration-200 select-none px-2.5 py-1.5 rounded-lg shadow-md border backdrop-blur-sm flex items-center gap-2 ${
              hovered
                ? 'bg-[#FAF8F5] text-[#171E1A] border-[#1D3D2D] scale-105'
                : 'bg-[#FAF8F5]/90 text-[#171E1A] border-[#DCD5C5]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center ${
                hasUnserved ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] font-medium tracking-wide uppercase opacity-75">
                Facility Demand
              </span>
              <span className="text-xs font-semibold tabular-nums mt-0.5">
                {demandKw.toFixed(1)} <span className="text-[9px] font-normal">kW</span>
              </span>
            </div>
            {hasUnserved && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 tabular-nums">
                Deficit: {unservedKw.toFixed(1)} kW
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

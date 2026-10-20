import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { Zap, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface SubstationAssetProps {
  gridImportKw: number;
  gridExportKw: number;
  gridPrice: number;
  carbonIntensity: number;
  isSelected: boolean;
  isInspectionMode?: boolean;
  onSelect: () => void;
}

export const SubstationAsset: React.FC<SubstationAssetProps> = ({
  gridImportKw,
  gridExportKw,
  gridPrice,
  carbonIntensity,
  isSelected,
  isInspectionMode = false,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const isImporting = gridImportKw > 0.1;
  const isExporting = gridExportKw > 0.1;

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
      return () => {
        document.body.style.cursor = 'auto';
      };
    }
  }, [hovered]);

  return (
    <group
      position={[0, 0, 0]}
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
      {/* Main Step-Up Power Transformer Tank */}
      <mesh castShadow receiveShadow position={[-0.4, 0.7, 0]}>
        <boxGeometry args={[1.6, 1.2, 1.4]} />
        <meshStandardMaterial color="#6E7D73" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Radiator Cooling Fins on sides */}
      {[-0.6, 0.6].map((z, idx) => (
        <group key={idx} position={[-0.4, 0.7, z]}>
          {[-0.5, -0.25, 0, 0.25, 0.5].map((x, fIdx) => (
            <mesh key={fIdx} position={[x, 0, z > 0 ? 0.15 : -0.15]}>
              <boxGeometry args={[0.04, 0.9, 0.2]} />
              <meshStandardMaterial color="#55635A" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Ceramic High-Voltage Insulator Bushings */}
      {[-0.4, 0, 0.4].map((z, idx) => (
        <group key={idx} position={[-0.4, 1.45, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.05, 0.08, 0.45, 12]} />
            <meshStandardMaterial color="#8B4513" roughness={0.2} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Switchgear and Protection Enclosure */}
      <mesh castShadow receiveShadow position={[0.9, 0.65, 0]}>
        <boxGeometry args={[0.8, 1.3, 1.6]} />
        <meshStandardMaterial color="#DED8CC" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* High-Voltage Transmission Pylon (connecting towards external grid at +X) */}
      <group position={[1.8, 0, 0]}>
        {/* Lattice vertical legs */}
        <mesh castShadow position={[0, 2.4, -0.4]}>
          <cylinderGeometry args={[0.03, 0.05, 4.8, 6]} />
          <meshStandardMaterial color="#4A524E" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh castShadow position={[0, 2.4, 0.4]}>
          <cylinderGeometry args={[0.03, 0.05, 4.8, 6]} />
          <meshStandardMaterial color="#4A524E" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Crossarm */}
        <mesh castShadow position={[0, 4.2, 0]}>
          <boxGeometry args={[0.1, 0.1, 2.0]} />
          <meshStandardMaterial color="#4A524E" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Hanging insulators */}
        {[-0.8, 0.8].map((z, idx) => (
          <mesh key={idx} position={[0, 3.9, z]}>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
            <meshStandardMaterial color="#A0522D" roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* External Grid Boundary Tower (at the edge of the terrain) */}
      <group position={[13, 0, 0]}>
        <mesh receiveShadow position={[0, 0.1, 0]}>
          <boxGeometry args={[1.6, 0.2, 1.6]} />
          <meshStandardMaterial color="#C5BFB2" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 3.8, 0]}>
          <cylinderGeometry args={[0.12, 0.35, 7.6, 6]} />
          <meshStandardMaterial color="#4A524E" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh castShadow position={[0, 6.5, 0]}>
          <boxGeometry args={[0.15, 0.15, 3.2]} />
          <meshStandardMaterial color="#4A524E" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Overhead high-voltage lines between Substation and Grid Boundary Tower */}
      <mesh position={[7.4, 4.2, -0.6]} rotation={[0, 0, 0.18]} raycast={() => null}>
        <cylinderGeometry args={[0.015, 0.015, 11.5, 6]} />
        <meshStandardMaterial color="#333333" metalness={0.9} />
      </mesh>
      <mesh position={[7.4, 4.2, 0.6]} rotation={[0, 0, 0.18]} raycast={() => null}>
        <cylinderGeometry args={[0.015, 0.015, 11.5, 6]} />
        <meshStandardMaterial color="#333333" metalness={0.9} />
      </mesh>

      {/* Selection / Inspection Focus Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 2.4, 36]} />
          <meshBasicMaterial
            color={isSelected ? '#1D3D2D' : '#5D7C6C'}
            transparent
            opacity={isSelected ? 0.9 : 0.6}
          />
        </mesh>
      )}

      {/* Floating 3D Label & Value Tag (hidden during close-up inspection) */}
      {!isSelected && !isInspectionMode && (
        <Html position={[0, 1.8, 0]} center distanceFactor={14} zIndexRange={[5, 0]} pointerEvents="none">
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
                isImporting
                  ? 'bg-rose-100 text-rose-700'
                  : isExporting
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isImporting ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : isExporting ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] font-medium tracking-wide uppercase opacity-75">
                Substation & Grid
              </span>
              <span className="text-xs font-semibold tabular-nums mt-0.5">
                {isImporting
                  ? `Import ${gridImportKw.toFixed(1)} kW`
                  : isExporting
                  ? `Export ${gridExportKw.toFixed(1)} kW`
                  : 'Balanced / Islanded'}
              </span>
            </div>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200 tabular-nums">
              ${gridPrice.toFixed(2)}/kWh
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

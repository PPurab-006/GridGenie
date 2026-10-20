import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Wind } from 'lucide-react';

interface WindAssetProps {
  windKw: number;
  capacityKw: number;
  isSelected: boolean;
  onSelect: () => void;
}

interface TurbineUnitProps {
  position: [number, number, number];
  rotationSpeed: number;
  scale?: number;
}

const TurbineUnit: React.FC<TurbineUnitProps> = ({
  position,
  rotationSpeed,
  scale = 1,
}) => {
  const rotorRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (rotorRef.current && rotationSpeed > 0) {
      rotorRef.current.rotation.z += rotationSpeed * delta;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Foundation curb */}
      <mesh receiveShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.9, 1.1, 0.2, 24]} />
        <meshStandardMaterial color="#C5BFB2" roughness={0.9} />
      </mesh>

      {/* Tapered tubular steel tower */}
      <mesh castShadow receiveShadow position={[0, 3.8, 0]}>
        <cylinderGeometry args={[0.16, 0.38, 7.4, 24]} />
        <meshStandardMaterial color="#EFECE6" metalness={0.4} roughness={0.35} />
      </mesh>

      {/* Nacelle housing */}
      <mesh castShadow position={[0, 7.55, 0.1]}>
        <boxGeometry args={[0.5, 0.45, 1.3]} />
        <meshStandardMaterial color="#E6E2D8" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Rotating Rotor Assembly */}
      <group position={[0, 7.55, 0.8]}>
        {/* Spinner Nose Cone */}
        <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.22, 0.45, 18]} />
          <meshStandardMaterial color="#D8D2C5" metalness={0.5} roughness={0.3} />
        </mesh>

        {/* 3 Aerodynamic Rotor Blades */}
        <group ref={rotorRef}>
          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, idx) => (
            <group key={idx} rotation={[0, 0, angle]}>
              {/* Blade root cylinder */}
              <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.04, 0.06, 0.4, 12]} />
                <meshStandardMaterial color="#DED8CC" metalness={0.3} roughness={0.4} />
              </mesh>
              {/* Airfoil blade body */}
              <mesh castShadow position={[0, 1.9, 0]} rotation={[0, 0.18, 0]}>
                <boxGeometry args={[0.15, 2.8, 0.03]} />
                <meshStandardMaterial color="#FAF9F6" metalness={0.2} roughness={0.25} />
              </mesh>
              {/* Red warning tip bands */}
              <mesh position={[0, 3.1, 0]}>
                <boxGeometry args={[0.11, 0.4, 0.035]} />
                <meshStandardMaterial color="#DC2626" roughness={0.4} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
};

export const WindAsset: React.FC<WindAssetProps> = ({
  windKw,
  capacityKw,
  isSelected,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const utilizationPct = capacityKw > 0 ? (windKw / capacityKw) * 100 : 0;
  const isSpinning = windKw > 0.1;

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
      return () => {
        document.body.style.cursor = 'auto';
      };
    }
  }, [hovered]);

  // Rotation speed scales realistically with output power (0 to ~2.5 rad/s)
  const rotationSpeed = isSpinning
    ? Math.min(2.8, 0.5 + (windKw / Math.max(1, capacityKw)) * 2.2)
    : 0;

  return (
    <group
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
      {/* Primary Wind Turbine */}
      <TurbineUnit position={[7, 0, -8]} rotationSpeed={rotationSpeed} scale={1.0} />

      {/* Secondary Wind Turbine (depth and scale) */}
      <TurbineUnit position={[11, 0, -5]} rotationSpeed={rotationSpeed * 0.94} scale={0.88} />

      {/* Selection / Inspection Focus Ring */}
      {(isSelected || hovered) && (
        <mesh position={[7, 0.05, -8]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.7, 1.9, 36]} />
          <meshBasicMaterial
            color={isSelected ? '#1D3D2D' : '#5D7C6C'}
            transparent
            opacity={isSelected ? 0.9 : 0.6}
          />
        </mesh>
      )}

      {/* Floating 3D Label & Value Tag (hidden during close-up inspection) */}
      {!isSelected && (
        <Html position={[7, 4.5, -8]} center distanceFactor={16}>
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
                isSpinning ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] font-medium tracking-wide uppercase opacity-75">
                Wind Turbines
              </span>
              <span className="text-xs font-semibold tabular-nums mt-0.5">
                {windKw.toFixed(1)} <span className="text-[9px] font-normal">kW</span>
              </span>
            </div>
            {isSpinning && (
              <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 tabular-nums">
                {utilizationPct.toFixed(0)}%
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

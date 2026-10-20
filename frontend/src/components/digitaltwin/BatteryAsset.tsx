import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { BatteryCharging, Battery, BatteryMedium } from 'lucide-react';

interface BatteryAssetProps {
  batterySoc: number; // 0.0 - 1.0
  batteryEnergyKwh: number;
  capacityKwh: number;
  chargeKw: number;
  dischargeKw: number;
  isSelected: boolean;
  isInspectionMode?: boolean;
  onSelect: () => void;
}

export const BatteryAsset: React.FC<BatteryAssetProps> = ({
  batterySoc,
  batteryEnergyKwh,
  capacityKwh,
  chargeKw,
  dischargeKw,
  isSelected,
  isInspectionMode = false,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const isCharging = chargeKw > 0.1;
  const isDischarging = dischargeKw > 0.1;
  const socPct = Math.round(batterySoc * 100);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
      return () => {
        document.body.style.cursor = 'auto';
      };
    }
  }, [hovered]);

  // LED bar height based on SoC (0.2m to 1.2m)
  const barHeight = Math.max(0.1, Math.min(1.2, batterySoc * 1.3));

  // LED status color
  const statusColor = isCharging
    ? '#10B981'
    : isDischarging
    ? '#84CC16'
    : batterySoc < 0.25
    ? '#EF4444'
    : '#1D3D2D';

  return (
    <group
      position={[-6, 0, 5]}
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
      {/* Engineered concrete equipment foundation pad */}
      <mesh receiveShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[4.8, 0.16, 3.4]} />
        <meshStandardMaterial
          color={isSelected ? '#BFD8C5' : hovered ? '#D0E0D4' : '#C5BFB2'}
          roughness={0.9}
        />
      </mesh>

      {/* Primary Battery Enclosure (Container 1) */}
      <group position={[0, 0.16, -0.8]}>
        <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
          <boxGeometry args={[3.8, 1.8, 1.3]} />
          <meshStandardMaterial color="#FAF9F6" metalness={0.4} roughness={0.35} />
        </mesh>
        {/* Dark accent corner pillars */}
        <mesh position={[-1.85, 0.9, 0]}>
          <boxGeometry args={[0.08, 1.82, 1.32]} />
          <meshStandardMaterial color="#2E3832" roughness={0.6} />
        </mesh>
        <mesh position={[1.85, 0.9, 0]}>
          <boxGeometry args={[0.08, 1.82, 1.32]} />
          <meshStandardMaterial color="#2E3832" roughness={0.6} />
        </mesh>
        {/* Rooftop HVAC unit */}
        <mesh castShadow position={[0, 1.95, 0]}>
          <boxGeometry args={[2.2, 0.3, 0.9]} />
          <meshStandardMaterial color="#DED8CC" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Dynamic Front LED SoC Indicator Bar */}
        <mesh position={[-1.4, 0.2 + barHeight / 2, 0.66]}>
          <boxGeometry args={[0.12, barHeight, 0.03]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={isCharging || isDischarging ? 0.8 : 0.3}
          />
        </mesh>
      </group>

      {/* Secondary Battery Enclosure (Container 2) */}
      <group position={[0, 0.16, 0.8]}>
        <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
          <boxGeometry args={[3.8, 1.8, 1.3]} />
          <meshStandardMaterial color="#FAF9F6" metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh position={[-1.85, 0.9, 0]}>
          <boxGeometry args={[0.08, 1.82, 1.32]} />
          <meshStandardMaterial color="#2E3832" roughness={0.6} />
        </mesh>
        <mesh position={[1.85, 0.9, 0]}>
          <boxGeometry args={[0.08, 1.82, 1.32]} />
          <meshStandardMaterial color="#2E3832" roughness={0.6} />
        </mesh>
        {/* Rooftop HVAC unit */}
        <mesh castShadow position={[0, 1.95, 0]}>
          <boxGeometry args={[2.2, 0.3, 0.9]} />
          <meshStandardMaterial color="#DED8CC" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Front LED SoC indicator */}
        <mesh position={[-1.4, 0.2 + barHeight / 2, 0.66]}>
          <boxGeometry args={[0.12, barHeight, 0.03]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={isCharging || isDischarging ? 0.8 : 0.3}
          />
        </mesh>
      </group>

      {/* Bi-directional Inverter & Transformer Skid */}
      <group position={[2.6, 0.16, 0]}>
        <mesh castShadow position={[0, 0.7, 0]}>
          <boxGeometry args={[0.8, 1.4, 1.6]} />
          <meshStandardMaterial color="#5D7C6C" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Warning Hazard Plate */}
        <mesh position={[0.41, 1.0, 0]}>
          <planeGeometry args={[0.25, 0.25]} />
          <meshBasicMaterial color="#F59E0B" />
        </mesh>
      </group>

      {/* Selection / Inspection Focus Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.9, 3.1, 40]} />
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
                isCharging
                  ? 'bg-emerald-100 text-emerald-700'
                  : isDischarging
                  ? 'bg-lime-100 text-lime-700'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {isCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 animate-pulse" />
              ) : isDischarging ? (
                <BatteryMedium className="w-3.5 h-3.5" />
              ) : (
                <Battery className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] font-medium tracking-wide uppercase opacity-75">
                BESS Storage
              </span>
              <span className="text-xs font-semibold tabular-nums mt-0.5">
                {socPct}% <span className="text-[9px] font-normal">({batteryEnergyKwh.toFixed(0)} kWh)</span>
              </span>
            </div>
            <span
              className={`text-[9px] font-medium px-1.5 py-0.5 rounded border tabular-nums ${
                isCharging
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isDischarging
                  ? 'bg-lime-50 text-lime-800 border-lime-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {isCharging
                ? `+${chargeKw.toFixed(1)} kW`
                : isDischarging
                ? `-${dischargeKw.toFixed(1)} kW`
                : 'Idle'}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

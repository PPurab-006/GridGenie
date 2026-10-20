import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AssetId } from '../../types/api';

interface EnergyFlows3DProps {
  solarKw: number;
  windKw: number;
  chargeKw: number;
  dischargeKw: number;
  demandKw: number;
  gridImportKw: number;
  gridExportKw: number;
  selectedAsset?: AssetId | null;
}

interface StreamDef {
  id: string;
  sourceAsset: AssetId;
  targetAsset: AssetId;
  start: [number, number, number];
  control: [number, number, number];
  end: [number, number, number];
  power: number;
  color: string;
  particleCount: number;
}

const FlowStream: React.FC<{
  stream: StreamDef;
  isFocused: boolean;
  isDimmed: boolean;
}> = ({ stream, isFocused, isDimmed }) => {
  const { start, control, end, power, color, particleCount } = stream;
  const isActive = power > 0.1 && !isDimmed;

  // Build quadratic bezier curve with accurate grounded elevations
  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...control),
      new THREE.Vector3(...end)
    );
  }, [start, control, end]);

  // Refined conduit tube geometry (0.018 radius for realistic aesthetic)
  const tubeGeo = useMemo(() => {
    return new THREE.TubeGeometry(curve, 36, 0.018, 6, false);
  }, [curve]);

  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Particle offsets evenly spaced
  const offsets = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => i / particleCount);
  }, [particleCount]);

  // Speed scales gently with power
  const speed = Math.min(0.75, 0.16 + (power / 100) * 0.55);

  useFrame((state) => {
    if (!particlesRef.current || !isActive) return;

    const time = state.clock.getElapsedTime();

    offsets.forEach((offset, idx) => {
      const t = (offset + time * speed) % 1.0;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t);

      dummy.position.copy(point);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);

      // Restrained, elegant particle scale to avoid foreground obstruction
      const baseScale = isFocused ? 0.038 : 0.046;
      const scale = baseScale * (0.85 + 0.35 * Math.sin(t * Math.PI));
      dummy.scale.set(scale, scale * 1.5, scale);

      dummy.updateMatrix();
      particlesRef.current!.setMatrixAt(idx, dummy.matrix);
    });

    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Physical Conduit Line */}
      <mesh geometry={tubeGeo} raycast={() => null}>
        <meshStandardMaterial
          color={isDimmed ? '#B8B3A8' : isActive ? color : '#C0BAB0'}
          emissive={isActive && !isDimmed ? color : '#000000'}
          emissiveIntensity={isActive && !isDimmed ? (isFocused ? 0.5 : 0.35) : 0}
          transparent
          opacity={isDimmed ? 0.08 : isActive ? 0.75 : 0.2}
          roughness={0.4}
        />
      </mesh>

      {/* Animated Glowing Energy Pulses */}
      {isActive && particleCount > 0 && (
        <instancedMesh
          ref={particlesRef}
          args={[undefined, undefined, particleCount]}
          raycast={() => null}
        >
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial color={color} />
        </instancedMesh>
      )}
    </group>
  );
};

export const EnergyFlows3D: React.FC<EnergyFlows3DProps> = ({
  solarKw,
  windKw,
  chargeKw,
  dischargeKw,
  demandKw,
  gridImportKw,
  gridExportKw,
  selectedAsset = null,
}) => {
  // World-space asset coordinates & precise equipment anchor points:
  // Substation distribution bus: [0.0, 0.8, 0.0]
  // Solar inverter skid: [-5.2, 0.6, -3.0]
  // Wind turbine base pad: [7.0, 0.4, -7.5]
  // Battery inverter skid: [-3.4, 0.7, 5.0]
  // Facility service entrance: [3.8, 0.7, 3.5]
  // Substation high-voltage gantry: [1.8, 2.4, 0.0]
  // Utility grid boundary tower: [13.0, 2.6, 0.0]

  const streams: StreamDef[] = useMemo(() => {
    const list: StreamDef[] = [];

    // 1. Solar -> Central Substation Bus
    if (solarKw > 0.1) {
      list.push({
        id: 'solar-to-bus',
        sourceAsset: 'solar',
        targetAsset: 'grid',
        start: [-5.2, 0.6, -3.0],
        control: [-2.6, 0.9, -1.5], // Restrained curve elevation below camera sightlines
        end: [-0.4, 0.8, -0.2],
        power: solarKw,
        color: '#D97706', // Warm Amber
        particleCount: Math.min(8, Math.max(3, Math.round(solarKw / 10))),
      });
    }

    // 2. Wind -> Central Substation Bus
    if (windKw > 0.1) {
      list.push({
        id: 'wind-to-bus',
        sourceAsset: 'wind',
        targetAsset: 'grid',
        start: [7.0, 0.4, -7.5],
        control: [3.5, 1.2, -3.8],
        end: [0.2, 0.8, -0.3],
        power: windKw,
        color: '#0284C7', // Cyan Blue
        particleCount: Math.min(8, Math.max(3, Math.round(windKw / 8))),
      });
    }

    // 3. Central Bus -> Battery (Charging)
    if (chargeKw > 0.1) {
      list.push({
        id: 'bus-to-battery',
        sourceAsset: 'grid',
        targetAsset: 'battery',
        start: [-0.3, 0.8, 0.3],
        control: [-1.8, 1.1, 2.6],
        end: [-3.4, 0.7, 5.0],
        power: chargeKw,
        color: '#059669', // Emerald Charging
        particleCount: Math.min(7, Math.max(3, Math.round(chargeKw / 5))),
      });
    }

    // 4. Battery -> Central Bus (Discharging)
    if (dischargeKw > 0.1) {
      list.push({
        id: 'battery-to-bus',
        sourceAsset: 'battery',
        targetAsset: 'grid',
        start: [-3.4, 0.7, 5.0],
        control: [-1.8, 1.1, 2.6],
        end: [-0.3, 0.8, 0.3],
        power: dischargeKw,
        color: '#65A30D', // Lime Discharging
        particleCount: Math.min(7, Math.max(3, Math.round(dischargeKw / 5))),
      });
    }

    // 5. Central Bus -> Facility Load
    if (demandKw > 0.1) {
      list.push({
        id: 'bus-to-facility',
        sourceAsset: 'grid',
        targetAsset: 'facility',
        start: [0.3, 0.8, 0.3],
        control: [2.0, 1.1, 1.9],
        end: [3.8, 0.7, 3.5],
        power: demandKw,
        color: '#D97706', // Amber Load
        particleCount: Math.min(9, Math.max(4, Math.round(demandKw / 12))),
      });
    }

    // 6. Grid -> Central Bus (Grid Import)
    if (gridImportKw > 0.1) {
      list.push({
        id: 'grid-to-bus',
        sourceAsset: 'grid',
        targetAsset: 'grid',
        start: [13.0, 2.6, 0.0],
        control: [7.4, 2.8, 0.0],
        end: [1.8, 2.4, 0.0],
        power: gridImportKw,
        color: '#DC2626', // Crimson Import
        particleCount: Math.min(8, Math.max(3, Math.round(gridImportKw / 10))),
      });
    }

    // 7. Central Bus -> Grid (Grid Export)
    if (gridExportKw > 0.1) {
      list.push({
        id: 'bus-to-grid',
        sourceAsset: 'grid',
        targetAsset: 'grid',
        start: [1.8, 2.4, 0.0],
        control: [7.4, 2.8, 0.0],
        end: [13.0, 2.6, 0.0],
        power: gridExportKw,
        color: '#059669', // Emerald Export
        particleCount: Math.min(7, Math.max(3, Math.round(gridExportKw / 10))),
      });
    }

    return list;
  }, [solarKw, windKw, chargeKw, dischargeKw, demandKw, gridImportKw, gridExportKw]);

  return (
    <group>
      {streams.map((stream) => {
        // In inspection mode, check if this stream is directly related to the selected asset
        const isRelated =
          !selectedAsset ||
          stream.sourceAsset === selectedAsset ||
          stream.targetAsset === selectedAsset ||
          (selectedAsset === 'grid' && (stream.sourceAsset === 'grid' || stream.targetAsset === 'grid'));

        const isDimmed = Boolean(selectedAsset && !isRelated);
        const isFocused = Boolean(selectedAsset && isRelated);

        return (
          <FlowStream
            key={stream.id}
            stream={stream}
            isFocused={isFocused}
            isDimmed={isDimmed}
          />
        );
      })}
    </group>
  );
};

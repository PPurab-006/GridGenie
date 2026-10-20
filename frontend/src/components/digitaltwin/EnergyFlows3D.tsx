import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnergyFlows3DProps {
  solarKw: number;
  windKw: number;
  chargeKw: number;
  dischargeKw: number;
  demandKw: number;
  gridImportKw: number;
  gridExportKw: number;
}

interface StreamDef {
  id: string;
  start: [number, number, number];
  control: [number, number, number];
  end: [number, number, number];
  power: number;
  color: string;
  particleCount: number;
}

const FlowStream: React.FC<{ stream: StreamDef }> = ({ stream }) => {
  const { start, control, end, power, color, particleCount } = stream;
  const isActive = power > 0.1;

  // Build quadratic bezier curve
  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...control),
      new THREE.Vector3(...end)
    );
  }, [start, control, end]);

  // Pre-generate tube geometry for the electrical line
  const tubeGeo = useMemo(() => {
    return new THREE.TubeGeometry(curve, 32, 0.025, 6, false);
  }, [curve]);

  // Particle positions ref
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Particle offsets (evenly distributed 0..1)
  const offsets = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => i / particleCount);
  }, [particleCount]);

  // Calculate speed: faster for higher power, clamped reasonably
  const speed = Math.min(0.85, 0.15 + (power / 100) * 0.7);

  useFrame((state, delta) => {
    if (!particlesRef.current || !isActive) return;

    const time = state.clock.getElapsedTime();

    offsets.forEach((offset, idx) => {
      // Progress t along curve [0, 1]
      const t = (offset + time * speed) % 1.0;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t);

      dummy.position.copy(point);
      // Align particle with curve tangent
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);

      // Pulse size slightly near middle of arc
      const scale = 0.08 + Math.sin(t * Math.PI) * 0.04;
      dummy.scale.set(scale, scale * 1.8, scale);

      dummy.updateMatrix();
      particlesRef.current!.setMatrixAt(idx, dummy.matrix);
    });

    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Static Conduit Wire */}
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial
          color={isActive ? color : '#9E998E'}
          emissive={isActive ? color : '#000000'}
          emissiveIntensity={isActive ? 0.35 : 0}
          transparent
          opacity={isActive ? 0.65 : 0.15}
          roughness={0.4}
        />
      </mesh>

      {/* Animated Glowing Energy Pulses */}
      {isActive && (
        <instancedMesh
          ref={particlesRef}
          args={[undefined, undefined, particleCount]}
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
}) => {
  // Define all possible physical paths with precise directions
  const streams: StreamDef[] = useMemo(() => {
    const list: StreamDef[] = [];

    // 1. Solar -> Central Substation Bus
    if (solarKw > 0.1) {
      list.push({
        id: 'solar-to-bus',
        start: [-8, 0.8, -3],
        control: [-4, 2.4, -1.5],
        end: [0, 1.3, 0],
        power: solarKw,
        color: '#D97706', // Warm Amber
        particleCount: Math.min(8, Math.max(3, Math.round(solarKw / 10))),
      });
    }

    // 2. Wind -> Central Substation Bus
    if (windKw > 0.1) {
      list.push({
        id: 'wind-to-bus',
        start: [7, 1.2, -8],
        control: [3.5, 3.0, -4],
        end: [0, 1.3, 0],
        power: windKw,
        color: '#0284C7', // Cyan Blue
        particleCount: Math.min(8, Math.max(3, Math.round(windKw / 8))),
      });
    }

    // 3. Central Bus -> Battery (Charging)
    if (chargeKw > 0.1) {
      list.push({
        id: 'bus-to-battery',
        start: [0, 1.3, 0],
        control: [-3, 2.2, 2.5],
        end: [-6, 1.0, 5],
        power: chargeKw,
        color: '#059669', // Emerald Charging
        particleCount: Math.min(7, Math.max(3, Math.round(chargeKw / 4))),
      });
    }

    // 4. Battery -> Central Bus (Discharging)
    if (dischargeKw > 0.1) {
      list.push({
        id: 'battery-to-bus',
        start: [-6, 1.0, 5],
        control: [-3, 2.2, 2.5],
        end: [0, 1.3, 0],
        power: dischargeKw,
        color: '#65A30D', // Lime Discharging
        particleCount: Math.min(7, Math.max(3, Math.round(dischargeKw / 4))),
      });
    }

    // 5. Central Bus -> Facility Load
    if (demandKw > 0.1) {
      list.push({
        id: 'bus-to-facility',
        start: [0, 1.3, 0],
        control: [3, 2.3, 2],
        end: [6, 1.2, 4],
        power: demandKw,
        color: '#D97706', // Amber Load
        particleCount: Math.min(9, Math.max(4, Math.round(demandKw / 12))),
      });
    }

    // 6. Grid -> Central Bus (Grid Import)
    if (gridImportKw > 0.1) {
      list.push({
        id: 'grid-to-bus',
        start: [13, 2.8, 0],
        control: [6.5, 3.2, 0],
        end: [0, 1.3, 0],
        power: gridImportKw,
        color: '#DC2626', // Crimson Import
        particleCount: Math.min(8, Math.max(3, Math.round(gridImportKw / 10))),
      });
    }

    // 7. Central Bus -> Grid (Grid Export)
    if (gridExportKw > 0.1) {
      list.push({
        id: 'bus-to-grid',
        start: [0, 1.3, 0],
        control: [6.5, 3.2, 0],
        end: [13, 2.8, 0],
        power: gridExportKw,
        color: '#059669', // Emerald Export
        particleCount: Math.min(7, Math.max(3, Math.round(gridExportKw / 10))),
      });
    }

    return list;
  }, [solarKw, windKw, chargeKw, dischargeKw, demandKw, gridImportKw, gridExportKw]);

  return (
    <group>
      {streams.map((stream) => (
        <FlowStream key={stream.id} stream={stream} />
      ))}
    </group>
  );
};

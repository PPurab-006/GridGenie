import React, { useMemo } from 'react';
import * as THREE from 'three';

export const Terrain: React.FC = () => {
  // Generate random tree positions around the periphery
  const trees = useMemo(() => {
    const list: { pos: [number, number, number]; scale: number; color: string }[] = [];
    const colors = ['#28533D', '#346B4F', '#486355', '#5D7C6C', '#1D3D2D'];
    const count = 38;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.sin(i * 3.7) * 0.2);
      const dist = 14.5 + (Math.sin(i * 5.1) * 2.5);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Keep clearance around main asset zones
      if (
        (Math.abs(x - 0) < 4 && Math.abs(z - 0) < 4) ||
        (Math.abs(x - -8) < 4 && Math.abs(z - -3) < 4) ||
        (Math.abs(x - 7) < 3 && Math.abs(z - -8) < 3) ||
        (Math.abs(x - -6) < 3 && Math.abs(z - 5) < 3) ||
        (Math.abs(x - 6) < 4 && Math.abs(z - 4) < 4) ||
        (Math.abs(x - 13) < 4 && Math.abs(z - 0) < 3)
      ) {
        continue;
      }

      list.push({
        pos: [x, 0, z],
        scale: 0.75 + (Math.sin(i * 2.3) + 1) * 0.35,
        color: colors[i % colors.length],
      });
    }
    return list;
  }, []);

  return (
    <group>
      {/* Main architectural podium */}
      <mesh receiveShadow position={[0, -0.3, 0]}>
        <cylinderGeometry args={[19, 19.5, 0.6, 64]} />
        <meshStandardMaterial
          color="#EFECE4"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Podium bevel / foundation curb */}
      <mesh receiveShadow position={[0, -0.65, 0]}>
        <cylinderGeometry args={[19.6, 20.2, 0.4, 64]} />
        <meshStandardMaterial
          color="#D8D4C8"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Inner meadow grass lawn */}
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[18.5, 64]} />
        <meshStandardMaterial
          color="#D4DFD7"
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>

      {/* Central Substation gravel pad */}
      <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.6, 32]} />
        <meshStandardMaterial
          color="#C9C5B8"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Pathway: Solar -> Substation */}
      <mesh receiveShadow position={[-4, 0.015, -1.5]} rotation={[-Math.PI / 2, 0, 0.36]}>
        <planeGeometry args={[1.2, 8.8]} />
        <meshStandardMaterial color="#DBD6C9" roughness={0.9} />
      </mesh>

      {/* Pathway: Wind -> Substation */}
      <mesh receiveShadow position={[3.5, 0.015, -4]} rotation={[-Math.PI / 2, 0, -0.85]}>
        <planeGeometry args={[1.2, 9.2]} />
        <meshStandardMaterial color="#DBD6C9" roughness={0.9} />
      </mesh>

      {/* Pathway: Battery -> Substation */}
      <mesh receiveShadow position={[-3, 0.015, 2.5]} rotation={[-Math.PI / 2, 0, -0.7]}>
        <planeGeometry args={[1.2, 7.8]} />
        <meshStandardMaterial color="#DBD6C9" roughness={0.9} />
      </mesh>

      {/* Pathway: Facility -> Substation */}
      <mesh receiveShadow position={[3, 0.015, 2]} rotation={[-Math.PI / 2, 0, 0.58]}>
        <planeGeometry args={[1.4, 7.5]} />
        <meshStandardMaterial color="#DBD6C9" roughness={0.9} />
      </mesh>

      {/* Pathway: Substation -> Grid Connection */}
      <mesh receiveShadow position={[6.5, 0.015, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[1.4, 11]} />
        <meshStandardMaterial color="#DBD6C9" roughness={0.9} />
      </mesh>

      {/* Contextual Low-Poly Architectural Trees */}
      {trees.map((t, idx) => (
        <group key={idx} position={t.pos} scale={[t.scale, t.scale, t.scale]}>
          {/* Trunk */}
          <mesh castShadow position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 1.0, 6]} />
            <meshStandardMaterial color="#6B5947" roughness={0.9} />
          </mesh>
          {/* Foliage lower cone */}
          <mesh castShadow position={[0, 1.4, 0]}>
            <coneGeometry args={[0.7, 1.4, 7]} />
            <meshStandardMaterial color={t.color} roughness={0.8} />
          </mesh>
          {/* Foliage upper cone */}
          <mesh castShadow position={[0, 2.1, 0]}>
            <coneGeometry args={[0.5, 1.2, 7]} />
            <meshStandardMaterial color={t.color} roughness={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

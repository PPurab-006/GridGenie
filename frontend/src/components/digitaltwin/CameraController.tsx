import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AssetId } from '../../types/api';

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  duration: number; // in seconds
}

// Signature camera framing presets for overview and each asset inspection
export const CAMERA_PRESETS: Record<'overview' | AssetId, CameraPreset> = {
  // 1. Angled Aerial Overview: Complete microgrid visible with recognizable miniature landscape aesthetic
  overview: {
    position: [16, 15, 18],
    target: [0, 1.2, 0],
    duration: 1.2,
  },

  // 2. Wind Turbine: Drone camera descending toward tower base, looking UP at hub & spinning blades
  // Primary turbine base: [7, 0, -8], hub height: 7.55m. Low-angle upward composition.
  wind: {
    position: [10.8, 2.2, -3.4], // Descended near ground, 6m distance offset to SE
    target: [7.0, 6.6, -8.0],    // Looking UP toward the hub and rotating blades against the sky
    duration: 1.4,
  },

  // 3. Solar Array: Oblique close perspective revealing tilted photovoltaic modules, frame struts & inverter
  // Array center: [-8, 0, -3]
  solar: {
    position: [-4.6, 2.4, 0.6],  // Low oblique vantage point looking across tilted racks
    target: [-8.0, 0.7, -3.0],   // Focused on central panel row
    duration: 1.2,
  },

  // 4. Battery Storage: Close view of container enclosures, HVAC cooling pods & dynamic front LED SoC bar
  // Battery center: [-6, 0, 5]
  battery: {
    position: [-2.4, 2.2, 8.6],  // Elevated ground-level view facing the container frontage
    target: [-6.0, 1.0, 5.0],    // Focused on front LED bar and container access
    duration: 1.2,
  },

  // 5. Commercial Facility: Reveal modern architecture, illuminated ribbon windows, and energy relation
  // Facility center: [6, 0, 4]
  facility: {
    position: [11.8, 3.2, 8.8],  // Oblique architectural elevation
    target: [6.0, 1.5, 4.0],     // Focused on facade & entrance canopy
    duration: 1.3,
  },

  // 6. Substation & Grid: Reveal transformers, bushings, transmission pylon & overhead lines
  // Substation center: [0, 0, 0], pylon at [1.8, 0, 0]
  grid: {
    position: [3.8, 2.8, 4.2],   // Viewing substation transformers with transmission line heading to grid
    target: [0.6, 1.2, 0.0],
    duration: 1.2,
  },
};

interface CameraControllerProps {
  selectedAsset: AssetId | null;
  controlsRef: React.RefObject<any>;
  onTransitionComplete?: () => void;
}

// Quintic smoothstep easing: zero 1st and 2nd derivatives at endpoints for silky smooth camera flight
function quinticEase(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export const CameraController: React.FC<CameraControllerProps> = ({
  selectedAsset,
  controlsRef,
  onTransitionComplete,
}) => {
  const { camera } = useThree();

  // Active animation state
  const animRef = useRef<{
    active: boolean;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    duration: number;
    startTime: number;
  }>({
    active: false,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    duration: 1.2,
    startTime: 0,
  });

  // Trigger smooth transition whenever selectedAsset changes
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const presetKey = selectedAsset || 'overview';
    const preset = CAMERA_PRESETS[presetKey];

    // Safely capture current camera position and current controls target as start
    animRef.current.startPos.copy(camera.position);
    animRef.current.startTarget.copy(controls.target);

    // Destination
    animRef.current.endPos.set(...preset.position);
    animRef.current.endTarget.set(...preset.target);

    animRef.current.duration = preset.duration;
    animRef.current.startTime = performance.now();
    animRef.current.active = true;
  }, [selectedAsset, camera, controlsRef]);

  // Hook into render loop for fluid frame-by-frame interpolation
  useFrame(() => {
    if (!animRef.current.active) return;
    const controls = controlsRef.current;
    if (!controls) return;

    const now = performance.now();
    const elapsed = (now - animRef.current.startTime) / 1000;
    const progress = Math.min(1.0, elapsed / animRef.current.duration);

    const ease = quinticEase(progress);

    // Interpolate camera position and OrbitControls target simultaneously
    camera.position.lerpVectors(
      animRef.current.startPos,
      animRef.current.endPos,
      ease
    );

    controls.target.lerpVectors(
      animRef.current.startTarget,
      animRef.current.endTarget,
      ease
    );

    controls.update();

    if (progress >= 1.0) {
      animRef.current.active = false;
      onTransitionComplete?.();
    }
  });

  return null;
};

import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TimeStepDispatch, AssetId, MicrogridConfig } from '../../types/api';
import { Terrain } from './Terrain';
import { SolarAsset } from './SolarAsset';
import { WindAsset } from './WindAsset';
import { BatteryAsset } from './BatteryAsset';
import { FacilityAsset } from './FacilityAsset';
import { SubstationAsset } from './SubstationAsset';
import { EnergyFlows3D } from './EnergyFlows3D';
import { FallbackDigitalTwin } from './FallbackDigitalTwin';
import { CameraController } from './CameraController';
import { CinematicInspectionOverlay } from './CinematicInspectionOverlay';
import { RotateCcw, ZoomIn, ZoomOut, Layers } from 'lucide-react';

interface MicrogridSceneProps {
  step: TimeStepDispatch;
  config: MicrogridConfig;
  selectedAsset: AssetId | null;
  onSelectAsset: (asset: AssetId | null) => void;
  viewMode?: '3d' | '2d';
  onToggleViewMode?: () => void;
}

// Dynamic Sky and Sun lighting driven strictly by simulation hour and solar power
const DynamicLighting: React.FC<{ hour: number; solarKw: number }> = ({ hour, solarKw }) => {
  // Daylight strictly between 06:00 and 18:00 (19:00 - 05:00 is nocturnal night)
  const isDaytime = hour >= 6 && hour <= 18;
  const sunProgress = isDaytime ? (hour - 6) / 12 : 0;
  const sunAngle = sunProgress * Math.PI;

  // Sun 3D position arc across the sky
  const sunX = Math.cos(sunAngle) * 22;
  const sunY = isDaytime ? Math.sin(sunAngle) * 18 + 4 : -2;
  const sunZ = 12;

  // Sun color shifts from warm golden dawn/dusk to bright daylight
  const sunColor = isDaytime
    ? hour <= 7 || hour >= 17
      ? '#F59E0B' // Golden hour
      : '#FFFDF5' // Warm daylight
    : '#1E293B'; // Moonless night sky

  const ambientIntensity = isDaytime ? 0.75 + Math.min(0.35, (solarKw / 80) * 0.35) : 0.3;
  const sunIntensity = isDaytime ? 1.4 + Math.min(0.7, (solarKw / 80) * 0.7) : 0.05;

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={isDaytime ? '#F7F5EF' : '#94A3B8'} />
      {isDaytime && (
        <directionalLight
          position={[sunX, sunY, sunZ]}
          intensity={sunIntensity}
          color={sunColor}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1}
          shadow-camera-far={45}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
          shadow-bias={-0.0005}
        />
      )}
      {/* Soft fill light from opposite quadrant */}
      <directionalLight
        position={[-15, 10, -12]}
        intensity={isDaytime ? 0.35 : 0.15}
        color={isDaytime ? '#E2E8F0' : '#475569'}
      />
    </>
  );
};

export const MicrogridScene: React.FC<MicrogridSceneProps> = ({
  step,
  config,
  selectedAsset,
  onSelectAsset,
  viewMode = '3d',
  onToggleViewMode,
}) => {
  const [webglError, setWebglError] = useState(false);
  const controlsRef = useRef<any>(null);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglError(true);
    } catch {
      setWebglError(true);
    }
  }, []);

  // Camera reset
  const handleResetCamera = () => {
    if (selectedAsset) {
      onSelectAsset(null);
    } else if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 1.2, 0);
    }
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(1.2);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyOut(1.2);
      controlsRef.current.update();
    }
  };

  if (webglError || viewMode === '2d') {
    return (
      <div className="relative w-full h-[500px] sm:h-[560px] lg:h-[620px] rounded-2xl overflow-hidden border border-[#D5E0D7] bg-[#FAF8F5] shadow-sm isolate z-0">
        {/* Inspection HUD Overlay (active in both 2D and 3D modes) */}
        {selectedAsset && (
          <CinematicInspectionOverlay
            assetId={selectedAsset}
            step={step}
            config={config}
            onBackToOverview={() => onSelectAsset(null)}
          />
        )}
        <FallbackDigitalTwin
          step={step}
          config={config}
          selectedAsset={selectedAsset}
          onSelectAsset={(a) => onSelectAsset(a === selectedAsset ? null : a)}
        />
        {onToggleViewMode && (
          <button
            onClick={onToggleViewMode}
            className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#D5E0D7] text-xs font-medium text-[#171E1A] shadow-sm hover:bg-[#F0EDE4] flex items-center gap-1.5 transition-colors pointer-events-auto"
          >
            <Layers className="w-3.5 h-3.5 text-[#5D7C6C]" />
            Switch to 3D View
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] sm:h-[560px] lg:h-[620px] rounded-2xl overflow-hidden border border-[#D5E0D7] bg-[#F3F0E6] shadow-sm isolate z-0">
      {/* 1. Cinematic Inspection HUD Overlay (Docked in upper-left quadrant beside subject) */}
      {selectedAsset && (
        <CinematicInspectionOverlay
          assetId={selectedAsset}
          step={step}
          config={config}
          onBackToOverview={() => onSelectAsset(null)}
        />
      )}

      {/* 2. Top-Right 3D Controls HUD */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-[#FAF8F5] p-1.5 rounded-xl border border-[#D5E0D7] shadow-md pointer-events-auto"
      >
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg hover:bg-[#EAE6DB] text-[#4A5B52] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg hover:bg-[#EAE6DB] text-[#4A5B52] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCamera}
          className="p-1.5 rounded-lg hover:bg-[#EAE6DB] text-[#4A5B52] transition-colors"
          title={selectedAsset ? "Return to Aerial Overview" : "Reset Camera View"}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        {onToggleViewMode && (
          <>
            <div className="w-[1px] h-4 bg-[#D5E0D7] mx-0.5" />
            <button
              onClick={onToggleViewMode}
              className="px-2 py-1 rounded-lg hover:bg-[#EAE6DB] text-xs font-medium text-[#171E1A] flex items-center gap-1 transition-colors"
              title="Toggle 2D Schematic Mode"
            >
              <Layers className="w-3.5 h-3.5 text-[#5D7C6C]" />
              2D
            </button>
          </>
        )}
      </div>

      {/* 3. Bottom-Left Camera Guidance Prompt (Overview mode only) */}
      {!selectedAsset && (
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none select-none text-[11px] text-[#5D7C6C] bg-[#FAF8F5] px-3 py-1.5 rounded-lg border border-[#D5E0D7] shadow-md">
          Click any 3D asset for cinematic inspection &bull; Drag to orbit &bull; Scroll to zoom
        </div>
      )}

      {/* 4. Main WebGL Canvas */}
      <Canvas
        shadows
        camera={{ position: [16, 15, 18], fov: 40, near: 0.5, far: 85 }}
        onClick={() => {
          if (selectedAsset) onSelectAsset(null);
        }}
      >
        <Suspense fallback={null}>
          <DynamicLighting hour={step.hour} solarKw={step.solar_kw} />

          {/* Smooth Cinematic Camera Transition Controller */}
          <CameraController
            selectedAsset={selectedAsset}
            controlsRef={controlsRef}
          />

          <OrbitControls
            ref={controlsRef}
            target={[0, 1.2, 0]}
            enableDamping
            dampingFactor={0.06}
            minDistance={4}
            maxDistance={48}
            minPolarAngle={0.08}
            maxPolarAngle={Math.PI / 2.05} // Prevent camera flipping below terrain
          />

          {/* Architectural Terrain & Landscaping */}
          <Terrain />

          {/* Asset 1: Solar Array */}
          <SolarAsset
            solarKw={step.solar_kw}
            capacityKw={config.solar_capacity_kw}
            isSelected={selectedAsset === 'solar'}
            isInspectionMode={selectedAsset !== null}
            onSelect={() => onSelectAsset(selectedAsset === 'solar' ? null : 'solar')}
          />

          {/* Asset 2: Wind Turbines */}
          <WindAsset
            windKw={step.wind_kw}
            capacityKw={config.wind_capacity_kw}
            isSelected={selectedAsset === 'wind'}
            isInspectionMode={selectedAsset !== null}
            onSelect={() => onSelectAsset(selectedAsset === 'wind' ? null : 'wind')}
          />

          {/* Asset 3: Battery Storage (BESS) */}
          <BatteryAsset
            batterySoc={step.battery_soc}
            batteryEnergyKwh={step.battery_energy_kwh}
            capacityKwh={config.battery.capacity_kwh}
            chargeKw={step.battery_charge_kw}
            dischargeKw={step.battery_discharge_kw}
            isSelected={selectedAsset === 'battery'}
            isInspectionMode={selectedAsset !== null}
            onSelect={() => onSelectAsset(selectedAsset === 'battery' ? null : 'battery')}
          />

          {/* Asset 4: Commercial/Industrial Facility (Load Demand) */}
          <FacilityAsset
            demandKw={step.demand_kw}
            unservedKw={step.unserved_demand_kw}
            isSelected={selectedAsset === 'facility'}
            isInspectionMode={selectedAsset !== null}
            onSelect={() => onSelectAsset(selectedAsset === 'facility' ? null : 'facility')}
          />

          {/* Asset 5: Substation & Grid Connection */}
          <SubstationAsset
            gridImportKw={step.grid_import_kw}
            gridExportKw={step.grid_export_kw}
            gridPrice={step.grid_price}
            carbonIntensity={step.grid_carbon_intensity}
            isSelected={selectedAsset === 'grid'}
            isInspectionMode={selectedAsset !== null}
            onSelect={() => onSelectAsset(selectedAsset === 'grid' ? null : 'grid')}
          />

          {/* Live 3D Energy Flows */}
          <EnergyFlows3D
            solarKw={step.solar_kw}
            windKw={step.wind_kw}
            chargeKw={step.battery_charge_kw}
            dischargeKw={step.battery_discharge_kw}
            demandKw={step.demand_kw}
            gridImportKw={step.grid_import_kw}
            gridExportKw={step.grid_export_kw}
            selectedAsset={selectedAsset}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

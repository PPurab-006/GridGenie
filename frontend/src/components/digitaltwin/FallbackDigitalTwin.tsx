import React, { useState, useRef, useEffect } from 'react';
import { TimeStepDispatch, AssetId, MicrogridConfig } from '../../types/api';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sun,
  Wind,
  Battery,
  Building2,
  Zap,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Sliders,
} from 'lucide-react';

interface FallbackDigitalTwinProps {
  step: TimeStepDispatch;
  config: MicrogridConfig;
  selectedAsset: AssetId | null;
  onSelectAsset: (asset: AssetId) => void;
}

export const FallbackDigitalTwin: React.FC<FallbackDigitalTwinProps> = ({
  step,
  config,
  selectedAsset,
  onSelectAsset,
}) => {
  // Pan and Zoom viewport state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Live power flows
  const isCharging = step.battery_charge_kw > 0.1;
  const isDischarging = step.battery_discharge_kw > 0.1;
  const isImporting = step.grid_import_kw > 0.1;
  const isExporting = step.grid_export_kw > 0.1;
  const isSolarGen = step.solar_kw > 0.1;
  const isWindGen = step.wind_kw > 0.1;
  const isFacilityLoad = step.demand_kw > 0.1;

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(2.2, prev + 0.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.65, prev - 0.2));
  const handleFitToView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on canvas background, not on buttons or node interactions
    if ((e.target as HTMLElement).closest('button, [data-interactive="true"]')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch pan handlers for mobile screens
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if ((e.target as HTMLElement).closest('button, [data-interactive="true"]')) return;
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Stroke width calculator based on power magnitude
  const getStrokeWidth = (kw: number) => {
    if (kw <= 0.1) return 2.5;
    return Math.min(6, 2.5 + (kw / 80) * 3.5);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`w-full h-full min-h-[480px] bg-[#FAF8F5] relative select-none overflow-hidden ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* 1. HUD Navigation & Pan/Zoom Controls Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-[#FAF8F5]/94 backdrop-blur-md px-2 py-1.5 rounded-xl border border-[#D5E0D7] shadow-sm pointer-events-auto"
      >
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg hover:bg-[#EAE6DB] text-[#4A5B52] transition-colors"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg hover:bg-[#EAE6DB] text-[#4A5B52] transition-colors"
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-[#D5E0D7] mx-0.5" />
        <button
          onClick={handleFitToView}
          className="p-1.5 rounded-lg hover:bg-[#EAE6DB] text-[#4A5B52] transition-colors"
          title="Fit to View"
          aria-label="Fit to View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 rounded-lg hover:bg-[#EAE6DB] text-[#4A5B52] transition-colors"
          title="Reset Framing"
          aria-label="Reset Framing"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-mono font-medium text-[#788A80] px-1.5">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* 2. Bottom Schematic Guidance Prompt */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none select-none text-[11px] text-[#5D7C6C] bg-[#FAF8F5]/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#D5E0D7] shadow-sm hidden sm:block">
        Click any node to inspect &bull; Drag background to pan &bull; Live directional energy flow
      </div>

      {/* 3. Main Vector SVG Schematic Diagram */}
      <svg
        viewBox="0 0 920 540"
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle drop shadow for equipment cards */}
          <filter id="schematicCardShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1D3D2D" floodOpacity="0.08" />
          </filter>
          <filter id="activeCardShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1D3D2D" floodOpacity="0.18" />
          </filter>

          {/* Architectural engineering millimeter grid */}
          <pattern id="archGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#EAE5D9" strokeWidth="0.75" />
          </pattern>
        </defs>

        {/* Background Grid Pattern */}
        <rect width="920" height="540" fill="url(#archGrid)" />

        {/* ======================================================== */}
        {/* PHYSICAL POWER CONNECTIONS & DIRECTIONAL FLOW BUSBARS    */}
        {/* ======================================================== */}

        {/* 1. Solar Array Connection: [240, 160] -> [340, 160] -> [340, 270] -> Bus [380, 270] */}
        <path
          d="M 240 160 L 340 160 L 340 270 L 380 270"
          fill="none"
          stroke={isSolarGen ? '#D97706' : '#D1CABE'}
          strokeWidth={getStrokeWidth(step.solar_kw)}
          strokeDasharray={isSolarGen ? '7 7' : undefined}
          className={isSolarGen ? 'flow-active-forward' : ''}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {isSolarGen && (
          <g transform="translate(290, 150)">
            <rect x="-24" y="-10" width="48" height="20" rx="4" fill="#FAF8F5" stroke="#D97706" strokeWidth="1" />
            <text x="0" y="3" textAnchor="middle" fill="#D97706" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">
              +{step.solar_kw.toFixed(1)}k
            </text>
          </g>
        )}

        {/* 2. Wind Turbine Connection: [680, 160] -> [580, 160] -> [580, 270] -> Bus [540, 270] */}
        <path
          d="M 680 160 L 580 160 L 580 270 L 540 270"
          fill="none"
          stroke={isWindGen ? '#0284C7' : '#D1CABE'}
          strokeWidth={getStrokeWidth(step.wind_kw)}
          strokeDasharray={isWindGen ? '7 7' : undefined}
          className={isWindGen ? 'flow-active-forward' : ''}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {isWindGen && (
          <g transform="translate(630, 150)">
            <rect x="-24" y="-10" width="48" height="20" rx="4" fill="#FAF8F5" stroke="#0284C7" strokeWidth="1" />
            <text x="0" y="3" textAnchor="middle" fill="#0284C7" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">
              +{step.wind_kw.toFixed(1)}k
            </text>
          </g>
        )}

        {/* 3. Substation / Utility Grid Connection: [460, 140] straight down to Bus [460, 255] */}
        <path
          d="M 460 140 L 460 255"
          fill="none"
          stroke={isImporting ? '#DC2626' : isExporting ? '#059669' : '#D1CABE'}
          strokeWidth={getStrokeWidth(isImporting ? step.grid_import_kw : step.grid_export_kw)}
          strokeDasharray={isImporting || isExporting ? '7 7' : undefined}
          className={isImporting ? 'flow-active-forward' : isExporting ? 'flow-active-reverse' : ''}
          strokeLinecap="round"
        />
        {(isImporting || isExporting) && (
          <g transform="translate(460, 195)">
            <rect
              x="-30"
              y="-10"
              width="60"
              height="20"
              rx="4"
              fill="#FAF8F5"
              stroke={isImporting ? '#DC2626' : '#059669'}
              strokeWidth="1"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isImporting ? '#DC2626' : '#059669'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              {isImporting ? `IMP ${step.grid_import_kw.toFixed(0)}k` : `EXP ${step.grid_export_kw.toFixed(0)}k`}
            </text>
          </g>
        )}

        {/* 4. Battery Storage Connection: [240, 390] -> [350, 390] -> [350, 285] -> Bus [390, 285] */}
        <path
          d="M 240 390 L 350 390 L 350 285 L 390 285"
          fill="none"
          stroke={isCharging ? '#059669' : isDischarging ? '#65A30D' : '#D1CABE'}
          strokeWidth={getStrokeWidth(isCharging ? step.battery_charge_kw : step.battery_discharge_kw)}
          strokeDasharray={isCharging || isDischarging ? '7 7' : undefined}
          className={isCharging ? 'flow-active-reverse' : isDischarging ? 'flow-active-forward' : ''}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {(isCharging || isDischarging) && (
          <g transform="translate(295, 380)">
            <rect
              x="-26"
              y="-10"
              width="52"
              height="20"
              rx="4"
              fill="#FAF8F5"
              stroke={isCharging ? '#059669' : '#65A30D'}
              strokeWidth="1"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isCharging ? '#059669' : '#65A30D'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              {isCharging ? `+${step.battery_charge_kw.toFixed(1)}k` : `-${step.battery_discharge_kw.toFixed(1)}k`}
            </text>
          </g>
        )}

        {/* 5. Facility Demand Connection: Bus [530, 285] -> [570, 285] -> [570, 390] -> Facility [680, 390] */}
        <path
          d="M 530 285 L 570 285 L 570 390 L 680 390"
          fill="none"
          stroke={isFacilityLoad ? '#D97706' : '#D1CABE'}
          strokeWidth={getStrokeWidth(step.demand_kw)}
          strokeDasharray={isFacilityLoad ? '7 7' : undefined}
          className={isFacilityLoad ? 'flow-active-forward' : ''}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {isFacilityLoad && (
          <g transform="translate(625, 380)">
            <rect x="-24" y="-10" width="48" height="20" rx="4" fill="#FAF8F5" stroke="#D97706" strokeWidth="1" />
            <text x="0" y="3" textAnchor="middle" fill="#D97706" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">
              {step.demand_kw.toFixed(1)}k
            </text>
          </g>
        )}

        {/* ======================================================== */}
        {/* CENTRAL ELECTRICAL DISTRIBUTION BUSBAR (MAIN FEEDER)      */}
        {/* ======================================================== */}
        <g transform="translate(460, 270)">
          {/* Main Busbar Trunk */}
          <rect
            x="-85"
            y="-18"
            width="170"
            height="36"
            rx="8"
            fill="#FAF8F5"
            stroke="#1D3D2D"
            strokeWidth="2.5"
            filter="url(#schematicCardShadow)"
          />
          {/* Heavy copper bar indicator */}
          <rect x="-75" y="-5" width="150" height="10" rx="3" fill="#1D3D2D" />

          {/* Bus connection terminals / lugs */}
          <circle cx="-60" cy="0" r="3.5" fill="#FAF8F5" />
          <circle cx="-20" cy="0" r="3.5" fill="#FAF8F5" />
          <circle cx="20" cy="0" r="3.5" fill="#FAF8F5" />
          <circle cx="60" cy="0" r="3.5" fill="#FAF8F5" />

          {/* Substation title */}
          <text
            x="0"
            y="-24"
            textAnchor="middle"
            fill="#1D3D2D"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="0.08em"
          >
            480V 3Φ AC BUSBAR
          </text>
          <text
            x="0"
            y="28"
            textAnchor="middle"
            fill="#5D7C6C"
            fontSize="9"
            fontFamily="JetBrains Mono"
          >
            Net: {(step.solar_kw + step.wind_kw + step.battery_discharge_kw + step.grid_import_kw).toFixed(1)} kW In
          </text>
        </g>

        {/* ======================================================== */}
        {/* 1. SOLAR PHOTOVOLTAIC ARRAY NODE                         */}
        {/* ======================================================== */}
        <g
          data-interactive="true"
          transform="translate(130, 105)"
          className="cursor-pointer group"
          onClick={() => onSelectAsset('solar')}
        >
          {/* Selection indicator ring */}
          {selectedAsset === 'solar' && (
            <rect
              x="-6"
              y="-6"
              width="212"
              height="102"
              rx="14"
              fill="none"
              stroke="#1D3D2D"
              strokeWidth="3"
              strokeDasharray="4 4"
            />
          )}
          {/* Equipment Container Card */}
          <rect
            x="0"
            y="0"
            width="200"
            height="90"
            rx="12"
            fill="#FAF8F5"
            stroke={selectedAsset === 'solar' ? '#1D3D2D' : '#D5E0D7'}
            strokeWidth={selectedAsset === 'solar' ? '2.5' : '1.5'}
            filter={selectedAsset === 'solar' ? 'url(#activeCardShadow)' : 'url(#schematicCardShadow)'}
            className="transition-colors group-hover:border-[#1D3D2D]"
          />
          {/* Icon Badge */}
          <rect x="14" y="14" width="38" height="38" rx="8" fill="#FEF3C7" stroke="#FDE68A" />
          <Sun className="w-5 h-5 text-amber-700" x="23" y="23" />

          {/* Name & Subtitle */}
          <text x="60" y="28" fill="#171E1A" fontSize="12" fontWeight="bold">
            Solar PV Array
          </text>
          <text x="60" y="44" fill="#788A80" fontSize="10">
            Cap: {config.solar_capacity_kw} kW
          </text>

          {/* Live Metric */}
          <text x="14" y="74" fill="#171E1A" fontSize="15" fontWeight="bold" fontFamily="JetBrains Mono">
            {step.solar_kw.toFixed(1)} <tspan fontSize="10" fontWeight="normal" fill="#5D7C6C">kW</tspan>
          </text>

          {/* Status Badge */}
          <rect
            x="110"
            y="60"
            width="76"
            height="18"
            rx="4"
            fill={isSolarGen ? '#FEF3C7' : '#F3F4F6'}
            stroke={isSolarGen ? '#FCD34D' : '#E5E7EB'}
          />
          <text
            x="148"
            y="72"
            textAnchor="middle"
            fill={isSolarGen ? '#92400E' : '#6B7280'}
            fontSize="8.5"
            fontWeight="bold"
          >
            {isSolarGen ? 'GENERATING' : 'DORMANT'}
          </text>

          {/* Terminal Connection Port Dot */}
          <circle cx="110" cy="90" r="4" fill="#D97706" stroke="#FAF8F5" strokeWidth="1.5" />
        </g>

        {/* ======================================================== */}
        {/* 2. WIND TURBINE INSTALLATION NODE                        */}
        {/* ======================================================== */}
        <g
          data-interactive="true"
          transform="translate(590, 105)"
          className="cursor-pointer group"
          onClick={() => onSelectAsset('wind')}
        >
          {selectedAsset === 'wind' && (
            <rect
              x="-6"
              y="-6"
              width="212"
              height="102"
              rx="14"
              fill="none"
              stroke="#1D3D2D"
              strokeWidth="3"
              strokeDasharray="4 4"
            />
          )}
          <rect
            x="0"
            y="0"
            width="200"
            height="90"
            rx="12"
            fill="#FAF8F5"
            stroke={selectedAsset === 'wind' ? '#1D3D2D' : '#D5E0D7'}
            strokeWidth={selectedAsset === 'wind' ? '2.5' : '1.5'}
            filter={selectedAsset === 'wind' ? 'url(#activeCardShadow)' : 'url(#schematicCardShadow)'}
            className="transition-colors group-hover:border-[#1D3D2D]"
          />
          <rect x="14" y="14" width="38" height="38" rx="8" fill="#E0F2FE" stroke="#BAE6FD" />
          <Wind className="w-5 h-5 text-cyan-700" x="23" y="23" />

          <text x="60" y="28" fill="#171E1A" fontSize="12" fontWeight="bold">
            Wind Turbines
          </text>
          <text x="60" y="44" fill="#788A80" fontSize="10">
            Cap: {config.wind_capacity_kw} kW
          </text>

          <text x="14" y="74" fill="#171E1A" fontSize="15" fontWeight="bold" fontFamily="JetBrains Mono">
            {step.wind_kw.toFixed(1)} <tspan fontSize="10" fontWeight="normal" fill="#5D7C6C">kW</tspan>
          </text>

          <rect
            x="110"
            y="60"
            width="76"
            height="18"
            rx="4"
            fill={isWindGen ? '#E0F2FE' : '#F3F4F6'}
            stroke={isWindGen ? '#7DD3FC' : '#E5E7EB'}
          />
          <text
            x="148"
            y="72"
            textAnchor="middle"
            fill={isWindGen ? '#0369A1' : '#6B7280'}
            fontSize="8.5"
            fontWeight="bold"
          >
            {isWindGen ? 'SPINNING' : 'CALM'}
          </text>

          {/* Terminal Connection Port Dot */}
          <circle cx="90" cy="90" r="4" fill="#0284C7" stroke="#FAF8F5" strokeWidth="1.5" />
        </g>

        {/* ======================================================== */}
        {/* 3. SUBSTATION / UTILITY GRID NODE                        */}
        {/* ======================================================== */}
        <g
          data-interactive="true"
          transform="translate(360, 45)"
          className="cursor-pointer group"
          onClick={() => onSelectAsset('grid')}
        >
          {selectedAsset === 'grid' && (
            <rect
              x="-6"
              y="-6"
              width="212"
              height="102"
              rx="14"
              fill="none"
              stroke="#1D3D2D"
              strokeWidth="3"
              strokeDasharray="4 4"
            />
          )}
          <rect
            x="0"
            y="0"
            width="200"
            height="90"
            rx="12"
            fill="#FAF8F5"
            stroke={selectedAsset === 'grid' ? '#1D3D2D' : '#D5E0D7'}
            strokeWidth={selectedAsset === 'grid' ? '2.5' : '1.5'}
            filter={selectedAsset === 'grid' ? 'url(#activeCardShadow)' : 'url(#schematicCardShadow)'}
            className="transition-colors group-hover:border-[#1D3D2D]"
          />
          <rect x="14" y="14" width="38" height="38" rx="8" fill="#FEE2E2" stroke="#FECACA" />
          <Zap className="w-5 h-5 text-rose-700" x="23" y="23" />

          <text x="60" y="28" fill="#171E1A" fontSize="12" fontWeight="bold">
            Substation & Grid
          </text>
          <text x="60" y="44" fill="#788A80" fontSize="10">
            Price: ${step.grid_price.toFixed(3)}/kWh
          </text>

          <text x="14" y="74" fill="#171E1A" fontSize="14" fontWeight="bold" fontFamily="JetBrains Mono">
            {isImporting
              ? `+${step.grid_import_kw.toFixed(1)} kW`
              : isExporting
              ? `-${step.grid_export_kw.toFixed(1)} kW`
              : '0.0 kW'}
          </text>

          <rect
            x="110"
            y="60"
            width="76"
            height="18"
            rx="4"
            fill={isImporting ? '#FEE2E2' : isExporting ? '#D1FAE5' : '#F3F4F6'}
            stroke={isImporting ? '#FCA5A5' : isExporting ? '#A7F3D0' : '#E5E7EB'}
          />
          <text
            x="148"
            y="72"
            textAnchor="middle"
            fill={isImporting ? '#B91C1C' : isExporting ? '#047857' : '#6B7280'}
            fontSize="8.5"
            fontWeight="bold"
          >
            {isImporting ? 'IMPORTING' : isExporting ? 'EXPORTING' : 'ISLANDED'}
          </text>

          {/* Terminal Connection Port Dot */}
          <circle cx="100" cy="90" r="4" fill={isImporting ? '#DC2626' : '#059669'} stroke="#FAF8F5" strokeWidth="1.5" />
        </g>

        {/* ======================================================== */}
        {/* 4. BATTERY ENERGY STORAGE (BESS) NODE                    */}
        {/* ======================================================== */}
        <g
          data-interactive="true"
          transform="translate(130, 345)"
          className="cursor-pointer group"
          onClick={() => onSelectAsset('battery')}
        >
          {selectedAsset === 'battery' && (
            <rect
              x="-6"
              y="-6"
              width="212"
              height="102"
              rx="14"
              fill="none"
              stroke="#1D3D2D"
              strokeWidth="3"
              strokeDasharray="4 4"
            />
          )}
          <rect
            x="0"
            y="0"
            width="200"
            height="90"
            rx="12"
            fill="#FAF8F5"
            stroke={selectedAsset === 'battery' ? '#1D3D2D' : '#D5E0D7'}
            strokeWidth={selectedAsset === 'battery' ? '2.5' : '1.5'}
            filter={selectedAsset === 'battery' ? 'url(#activeCardShadow)' : 'url(#schematicCardShadow)'}
            className="transition-colors group-hover:border-[#1D3D2D]"
          />
          <rect x="14" y="14" width="38" height="38" rx="8" fill="#D1FAE5" stroke="#A7F3D0" />
          <Battery className="w-5 h-5 text-emerald-700" x="23" y="23" />

          <text x="60" y="28" fill="#171E1A" fontSize="12" fontWeight="bold">
            Battery Storage
          </text>
          <text x="60" y="44" fill="#788A80" fontSize="10">
            Cap: {config.battery.capacity_kwh} kWh
          </text>

          {/* SoC visual gauge meter */}
          <rect x="14" y="62" width="70" height="7" rx="3.5" fill="#E5E7EB" />
          <rect
            x="14"
            y="62"
            width={Math.min(70, Math.max(4, step.battery_soc * 70))}
            height="7"
            rx="3.5"
            fill="#059669"
          />

          <text x="14" y="82" fill="#171E1A" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono">
            {Math.round(step.battery_soc * 100)}% <tspan fontSize="9" fontWeight="normal" fill="#788A80">({step.battery_energy_kwh.toFixed(0)} kWh)</tspan>
          </text>

          <rect
            x="110"
            y="60"
            width="76"
            height="18"
            rx="4"
            fill={isCharging ? '#D1FAE5' : isDischarging ? '#ECFCCB' : '#F3F4F6'}
            stroke={isCharging ? '#A7F3D0' : isDischarging ? '#D9F99D' : '#E5E7EB'}
          />
          <text
            x="148"
            y="72"
            textAnchor="middle"
            fill={isCharging ? '#047857' : isDischarging ? '#4D7C0F' : '#6B7280'}
            fontSize="8.5"
            fontWeight="bold"
          >
            {isCharging ? 'CHARGING' : isDischarging ? 'DISCHARGING' : 'STANDBY'}
          </text>

          {/* Terminal Connection Port Dot */}
          <circle cx="110" cy="45" r="4" fill="#059669" stroke="#FAF8F5" strokeWidth="1.5" />
        </g>

        {/* ======================================================== */}
        {/* 5. COMMERCIAL / INDUSTRIAL FACILITY NODE                 */}
        {/* ======================================================== */}
        <g
          data-interactive="true"
          transform="translate(590, 345)"
          className="cursor-pointer group"
          onClick={() => onSelectAsset('facility')}
        >
          {selectedAsset === 'facility' && (
            <rect
              x="-6"
              y="-6"
              width="212"
              height="102"
              rx="14"
              fill="none"
              stroke="#1D3D2D"
              strokeWidth="3"
              strokeDasharray="4 4"
            />
          )}
          <rect
            x="0"
            y="0"
            width="200"
            height="90"
            rx="12"
            fill="#FAF8F5"
            stroke={selectedAsset === 'facility' ? '#1D3D2D' : '#D5E0D7'}
            strokeWidth={selectedAsset === 'facility' ? '2.5' : '1.5'}
            filter={selectedAsset === 'facility' ? 'url(#activeCardShadow)' : 'url(#schematicCardShadow)'}
            className="transition-colors group-hover:border-[#1D3D2D]"
          />
          <rect x="14" y="14" width="38" height="38" rx="8" fill="#FEF3C7" stroke="#FDE68A" />
          <Building2 className="w-5 h-5 text-amber-700" x="23" y="23" />

          <text x="60" y="28" fill="#171E1A" fontSize="12" fontWeight="bold">
            Facility Demand
          </text>
          <text x="60" y="44" fill="#788A80" fontSize="10">
            Active Load
          </text>

          <text x="14" y="74" fill="#171E1A" fontSize="15" fontWeight="bold" fontFamily="JetBrains Mono">
            {step.demand_kw.toFixed(1)} <tspan fontSize="10" fontWeight="normal" fill="#5D7C6C">kW</tspan>
          </text>

          <rect
            x="110"
            y="60"
            width="76"
            height="18"
            rx="4"
            fill={step.unserved_demand_kw > 0.1 ? '#FEE2E2' : '#D1FAE5'}
            stroke={step.unserved_demand_kw > 0.1 ? '#FECACA' : '#A7F3D0'}
          />
          <text
            x="148"
            y="72"
            textAnchor="middle"
            fill={step.unserved_demand_kw > 0.1 ? '#B91C1C' : '#047857'}
            fontSize="8.5"
            fontWeight="bold"
          >
            {step.unserved_demand_kw > 0.1 ? `DEFICIT ${step.unserved_demand_kw.toFixed(0)}k` : '100% MET'}
          </text>

          {/* Terminal Connection Port Dot */}
          <circle cx="90" cy="45" r="4" fill="#D97706" stroke="#FAF8F5" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
};

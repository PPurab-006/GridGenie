import React from 'react';
import { TimeStepDispatch, AssetId, MicrogridConfig } from '../../types/api';
import { Sun, Wind, Battery, Building2, Zap, ArrowDown, ArrowUp } from 'lucide-react';

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
  const isCharging = step.battery_charge_kw > 0.1;
  const isDischarging = step.battery_discharge_kw > 0.1;
  const isImporting = step.grid_import_kw > 0.1;
  const isExporting = step.grid_export_kw > 0.1;

  return (
    <div className="w-full h-full min-h-[460px] flex items-center justify-center p-6 bg-[#FAF8F5] relative select-none">
      <svg
        viewBox="0 0 800 480"
        className="w-full h-full max-h-[520px] max-w-[860px]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1D3D2D" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Electrical Bus Lines */}
        {/* Solar -> Bus */}
        <line
          x1="180"
          y1="130"
          x2="400"
          y2="240"
          stroke={step.solar_kw > 0.1 ? '#D97706' : '#D1CABE'}
          strokeWidth="3"
          strokeDasharray={step.solar_kw > 0.1 ? '6 6' : undefined}
          className={step.solar_kw > 0.1 ? 'flow-active-forward' : ''}
        />

        {/* Wind -> Bus */}
        <line
          x1="620"
          y1="130"
          x2="400"
          y2="240"
          stroke={step.wind_kw > 0.1 ? '#0284C7' : '#D1CABE'}
          strokeWidth="3"
          strokeDasharray={step.wind_kw > 0.1 ? '6 6' : undefined}
          className={step.wind_kw > 0.1 ? 'flow-active-forward' : ''}
        />

        {/* Battery <-> Bus */}
        <line
          x1="180"
          y1="360"
          x2="400"
          y2="240"
          stroke={isCharging ? '#059669' : isDischarging ? '#65A30D' : '#D1CABE'}
          strokeWidth="3"
          strokeDasharray={isCharging || isDischarging ? '6 6' : undefined}
          className={isCharging ? 'flow-active-reverse' : isDischarging ? 'flow-active-forward' : ''}
        />

        {/* Bus -> Facility */}
        <line
          x1="400"
          y1="240"
          x2="620"
          y2="360"
          stroke={step.demand_kw > 0.1 ? '#D97706' : '#D1CABE'}
          strokeWidth="3.5"
          strokeDasharray={step.demand_kw > 0.1 ? '6 6' : undefined}
          className={step.demand_kw > 0.1 ? 'flow-active-forward' : ''}
        />

        {/* Grid <-> Bus */}
        <line
          x1="400"
          y1="70"
          x2="400"
          y2="240"
          stroke={isImporting ? '#DC2626' : isExporting ? '#059669' : '#D1CABE'}
          strokeWidth="3"
          strokeDasharray={isImporting || isExporting ? '6 6' : undefined}
          className={isImporting ? 'flow-active-forward' : isExporting ? 'flow-active-reverse' : ''}
        />

        {/* Central Electrical Bus Node */}
        <circle cx="400" cy="240" r="28" fill="#FAF8F5" stroke="#1D3D2D" strokeWidth="3" filter="url(#softShadow)" />
        <circle cx="400" cy="240" r="10" fill="#1D3D2D" />
        <text x="400" y="285" textAnchor="middle" fill="#4A5B52" fontSize="11" fontWeight="600" letterSpacing="0.05em">
          CENTRAL BUS
        </text>

        {/* 1. Solar Asset Node */}
        <g
          transform="translate(180, 130)"
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => onSelectAsset('solar')}
        >
          <circle
            r="44"
            fill="#FAF8F5"
            stroke={selectedAsset === 'solar' ? '#1D3D2D' : '#D1CABE'}
            strokeWidth={selectedAsset === 'solar' ? '3' : '1.5'}
            filter="url(#softShadow)"
          />
          <foreignObject x="-30" y="-32" width="60" height="60">
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Sun className="w-6 h-6 text-amber-700" />
              <span className="text-[10px] font-bold text-[#171E1A] mt-1">SOLAR</span>
              <span className="text-[9px] text-[#5D7C6C] font-mono">{step.solar_kw.toFixed(1)} kW</span>
            </div>
          </foreignObject>
        </g>

        {/* 2. Wind Asset Node */}
        <g
          transform="translate(620, 130)"
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => onSelectAsset('wind')}
        >
          <circle
            r="44"
            fill="#FAF8F5"
            stroke={selectedAsset === 'wind' ? '#1D3D2D' : '#D1CABE'}
            strokeWidth={selectedAsset === 'wind' ? '3' : '1.5'}
            filter="url(#softShadow)"
          />
          <foreignObject x="-30" y="-32" width="60" height="60">
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Wind className="w-6 h-6 text-cyan-700" />
              <span className="text-[10px] font-bold text-[#171E1A] mt-1">WIND</span>
              <span className="text-[9px] text-[#5D7C6C] font-mono">{step.wind_kw.toFixed(1)} kW</span>
            </div>
          </foreignObject>
        </g>

        {/* 3. Battery Asset Node */}
        <g
          transform="translate(180, 360)"
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => onSelectAsset('battery')}
        >
          <circle
            r="44"
            fill="#FAF8F5"
            stroke={selectedAsset === 'battery' ? '#1D3D2D' : '#D1CABE'}
            strokeWidth={selectedAsset === 'battery' ? '3' : '1.5'}
            filter="url(#softShadow)"
          />
          <foreignObject x="-30" y="-32" width="60" height="60">
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Battery className="w-6 h-6 text-emerald-700" />
              <span className="text-[10px] font-bold text-[#171E1A] mt-1">BATTERY</span>
              <span className="text-[9px] text-[#5D7C6C] font-mono">{Math.round(step.battery_soc * 100)}%</span>
            </div>
          </foreignObject>
        </g>

        {/* 4. Facility Asset Node */}
        <g
          transform="translate(620, 360)"
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => onSelectAsset('facility')}
        >
          <circle
            r="44"
            fill="#FAF8F5"
            stroke={selectedAsset === 'facility' ? '#1D3D2D' : '#D1CABE'}
            strokeWidth={selectedAsset === 'facility' ? '3' : '1.5'}
            filter="url(#softShadow)"
          />
          <foreignObject x="-30" y="-32" width="60" height="60">
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Building2 className="w-6 h-6 text-amber-700" />
              <span className="text-[10px] font-bold text-[#171E1A] mt-1">DEMAND</span>
              <span className="text-[9px] text-[#5D7C6C] font-mono">{step.demand_kw.toFixed(1)} kW</span>
            </div>
          </foreignObject>
        </g>

        {/* 5. Grid Asset Node */}
        <g
          transform="translate(400, 65)"
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => onSelectAsset('grid')}
        >
          <circle
            r="38"
            fill="#FAF8F5"
            stroke={selectedAsset === 'grid' ? '#1D3D2D' : '#D1CABE'}
            strokeWidth={selectedAsset === 'grid' ? '3' : '1.5'}
            filter="url(#softShadow)"
          />
          <foreignObject x="-26" y="-28" width="52" height="52">
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Zap className="w-5 h-5 text-rose-700" />
              <span className="text-[10px] font-bold text-[#171E1A] mt-0.5">GRID</span>
              <span className="text-[8px] text-[#5D7C6C] font-mono">
                {isImporting ? `+${step.grid_import_kw.toFixed(0)} kW` : '0 kW'}
              </span>
            </div>
          </foreignObject>
        </g>
      </svg>
    </div>
  );
};

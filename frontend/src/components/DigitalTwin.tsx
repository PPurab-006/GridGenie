import React from 'react';
import { Sun, Wind, Battery, Building2, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { TimeStepDispatch } from '../types/api';

interface DigitalTwinProps {
  step: TimeStepDispatch;
  batteryCapacity: number;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({ step, batteryCapacity }) => {
  const {
    solar_kw,
    wind_kw,
    battery_charge_kw,
    battery_discharge_kw,
    battery_soc,
    battery_energy_kwh,
    grid_import_kw,
    grid_export_kw,
    demand_kw,
    grid_price,
    grid_carbon_intensity,
    explanation,
  } = step;

  const isBatteryCharging = battery_charge_kw > 0.1;
  const isBatteryDischarging = battery_discharge_kw > 0.1;
  const isGridImporting = grid_import_kw > 0.1;
  const isGridExporting = grid_export_kw > 0.1;
  const isSolarGenerating = solar_kw > 0.1;
  const isWindGenerating = wind_kw > 0.1;

  return (
    <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5 mb-6 tech-grid-bg relative overflow-hidden">
      {/* Header telemetry badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#1A263D] gap-2">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#00E599] animate-ping" />
            Microgrid Single-Line Diagram (Digital Twin)
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Simulated 480V 3Φ Microgrid Bus &bull; Dynamic Power Flow Telemetry @ Hour {step.timestamp}
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 bg-[#141D30] border border-[#1A263D] rounded text-[#94A3B8]">
            Price: <strong className="text-white">${grid_price.toFixed(2)}/kWh</strong>
          </span>
          <span className="px-2.5 py-1 bg-[#141D30] border border-[#1A263D] rounded text-[#94A3B8]">
            Carbon: <strong className="text-white">{grid_carbon_intensity.toFixed(2)} kg/kWh</strong>
          </span>
        </div>
      </div>

      {/* Interactive Microgrid SVG Topology */}
      <div className="w-full relative flex items-center justify-center py-2">
        <svg viewBox="0 0 900 420" className="w-full max-w-4xl h-auto select-none">
          <defs>
            {/* Markers for flow directions */}
            <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#00E599" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#FBBF24" />
            </marker>
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#00D8F6" />
            </marker>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#A78BFA" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
            </marker>
          </defs>

          {/* Central Busbar */}
          <rect x="220" y="200" width="460" height="14" rx="4" fill="#1E293B" stroke="#00E599" strokeWidth="2" />
          <text x="450" y="210" textAnchor="middle" fill="#00E599" fontSize="9" fontWeight="bold" letterSpacing="2" fontFamily="JetBrains Mono">
            CENTRAL AC MICROGRID BUS [480V]
          </text>

          {/* 1. Solar PV (Top Left: 180, 50) */}
          {/* Wire: (180, 110) -> (300, 200) */}
          <path
            d="M 200 110 L 200 160 L 320 160 L 320 200"
            fill="none"
            stroke={isSolarGenerating ? '#FBBF24' : '#1E293B'}
            strokeWidth={isSolarGenerating ? 2.5 : 1.5}
            strokeDasharray={isSolarGenerating ? '6,6' : 'none'}
            className={isSolarGenerating ? 'flow-active-forward' : ''}
          />

          {/* 2. Wind Turbine (Top Right: 700, 50) */}
          {/* Wire: (700, 110) -> (580, 200) */}
          <path
            d="M 700 110 L 700 160 L 580 160 L 580 200"
            fill="none"
            stroke={isWindGenerating ? '#00D8F6' : '#1E293B'}
            strokeWidth={isWindGenerating ? 2.5 : 1.5}
            strokeDasharray={isWindGenerating ? '6,6' : 'none'}
            className={isWindGenerating ? 'flow-active-forward' : ''}
          />

          {/* 3. Utility Grid (Bottom Left: 150, 310) */}
          {/* Wire: (180, 310) -> (300, 214) */}
          <path
            d="M 200 310 L 200 250 L 320 250 L 320 214"
            fill="none"
            stroke={isGridImporting || isGridExporting ? '#38BDF8' : '#1E293B'}
            strokeWidth={isGridImporting || isGridExporting ? 2.5 : 1.5}
            strokeDasharray={isGridImporting || isGridExporting ? '6,6' : 'none'}
            className={isGridImporting ? 'flow-active-forward' : isGridExporting ? 'flow-active-reverse' : ''}
          />

          {/* 4. Battery Storage (Bottom Center: 450, 310) */}
          {/* Wire: (450, 310) -> (450, 214) */}
          <path
            d="M 450 310 L 450 214"
            fill="none"
            stroke={isBatteryCharging || isBatteryDischarging ? '#00E599' : '#1E293B'}
            strokeWidth={isBatteryCharging || isBatteryDischarging ? 2.5 : 1.5}
            strokeDasharray={isBatteryCharging || isBatteryDischarging ? '6,6' : 'none'}
            className={isBatteryDischarging ? 'flow-active-forward' : isBatteryCharging ? 'flow-active-reverse' : ''}
          />

          {/* 5. Facility Load (Bottom Right: 750, 310) */}
          {/* Wire: (580, 214) -> (700, 310) */}
          <path
            d="M 580 214 L 580 250 L 700 250 L 700 310"
            fill="none"
            stroke="#A78BFA"
            strokeWidth="2.5"
            strokeDasharray="6,6"
            className="flow-active-forward"
          />

          {/* Flow Value Badges on Wires */}
          {/* Solar Flow Badge */}
          {isSolarGenerating && (
            <g transform="translate(230, 145)">
              <rect x="0" y="0" width="60" height="18" rx="3" fill="#0A0F1D" stroke="#FBBF24" strokeWidth="1" />
              <text x="30" y="13" textAnchor="middle" fill="#FBBF24" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                +{solar_kw.toFixed(1)} kW
              </text>
            </g>
          )}

          {/* Wind Flow Badge */}
          {isWindGenerating && (
            <g transform="translate(610, 145)">
              <rect x="0" y="0" width="60" height="18" rx="3" fill="#0A0F1D" stroke="#00D8F6" strokeWidth="1" />
              <text x="30" y="13" textAnchor="middle" fill="#00D8F6" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                +{wind_kw.toFixed(1)} kW
              </text>
            </g>
          )}

          {/* Grid Flow Badge */}
          {(isGridImporting || isGridExporting) && (
            <g transform="translate(230, 260)">
              <rect x="0" y="0" width="70" height="18" rx="3" fill="#0A0F1D" stroke="#38BDF8" strokeWidth="1" />
              <text x="35" y="13" textAnchor="middle" fill="#38BDF8" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                {isGridImporting ? `↓ ${grid_import_kw.toFixed(1)} kW` : `↑ ${grid_export_kw.toFixed(1)} kW`}
              </text>
            </g>
          )}

          {/* Battery Flow Badge */}
          {(isBatteryCharging || isBatteryDischarging) && (
            <g transform="translate(460, 255)">
              <rect x="0" y="0" width="75" height="18" rx="3" fill="#0A0F1D" stroke="#00E599" strokeWidth="1" />
              <text x="37" y="13" textAnchor="middle" fill="#00E599" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                {isBatteryDischarging ? `↑ ${battery_discharge_kw.toFixed(1)} kW` : `↓ ${battery_charge_kw.toFixed(1)} kW`}
              </text>
            </g>
          )}

          {/* Load Flow Badge */}
          <g transform="translate(610, 260)">
            <rect x="0" y="0" width="65" height="18" rx="3" fill="#0A0F1D" stroke="#A78BFA" strokeWidth="1" />
            <text x="32" y="13" textAnchor="middle" fill="#A78BFA" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
              → {demand_kw.toFixed(1)} kW
            </text>
          </g>
        </svg>

        {/* DOM Asset Cards overlaying SVG coordinate anchors */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2">
          {/* Top Row: Solar & Wind */}
          <div className="flex justify-between items-start px-4">
            {/* Solar PV Card */}
            <div className="pointer-events-auto bg-[#0A0F1D]/90 border border-[#FBBF24]/30 rounded-lg p-3 w-44 shadow-lg backdrop-blur">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Sun className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Solar PV Array</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {solar_kw.toFixed(1)} <span className="text-xs text-[#94A3B8]">kW</span>
              </div>
              <div className="text-[10px] font-mono text-[#94A3B8] mt-1 flex justify-between">
                <span>Cap: 80 kW</span>
                <span>{solar_kw > 0 ? `${((solar_kw / 80) * 100).toFixed(0)}% CF` : 'Night'}</span>
              </div>
            </div>

            {/* Wind Turbine Card */}
            <div className="pointer-events-auto bg-[#0A0F1D]/90 border border-[#00D8F6]/30 rounded-lg p-3 w-44 shadow-lg backdrop-blur">
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <Wind className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Wind Turbines</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {wind_kw.toFixed(1)} <span className="text-xs text-[#94A3B8]">kW</span>
              </div>
              <div className="text-[10px] font-mono text-[#94A3B8] mt-1 flex justify-between">
                <span>Cap: 50 kW</span>
                <span>{((wind_kw / 50) * 100).toFixed(0)}% CF</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Utility Grid, BESS, and Load */}
          <div className="flex justify-between items-end px-4 mt-8">
            {/* Utility Grid */}
            <div className="pointer-events-auto bg-[#0A0F1D]/90 border border-[#38BDF8]/30 rounded-lg p-3 w-48 shadow-lg backdrop-blur">
              <div className="flex items-center gap-2 text-sky-400 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Grid Interconnect</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {grid_import_kw > 0
                  ? `${grid_import_kw.toFixed(1)} kW`
                  : grid_export_kw > 0
                  ? `-${grid_export_kw.toFixed(1)} kW`
                  : '0.0 kW'}
              </div>
              <div className="text-[10px] font-mono text-[#94A3B8] mt-1 flex justify-between">
                <span>{isGridImporting ? 'IMPORTING' : isGridExporting ? 'EXPORTING' : 'IDLE'}</span>
                <span>${grid_price.toFixed(2)}/kWh</span>
              </div>
            </div>

            {/* Battery Energy Storage System (BESS) */}
            <div className="pointer-events-auto bg-[#0A0F1D]/90 border border-[#00E599]/30 rounded-lg p-3 w-52 shadow-lg backdrop-blur">
              <div className="flex items-center justify-between text-[#00E599] mb-1">
                <div className="flex items-center gap-1.5">
                  <Battery className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">BESS Storage</span>
                </div>
                <span className="text-[11px] font-mono font-bold">{(battery_soc * 100).toFixed(0)}%</span>
              </div>
              {/* Battery SoC Progress Bar */}
              <div className="w-full bg-[#1A263D] h-2 rounded-full overflow-hidden my-1.5">
                <div
                  className="bg-[#00E599] h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, battery_soc * 100))}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-white flex justify-between">
                <span>{battery_energy_kwh.toFixed(1)} / {batteryCapacity} kWh</span>
                <span className={isBatteryDischarging ? 'text-amber-400 font-bold' : isBatteryCharging ? 'text-[#00E599] font-bold' : 'text-[#64748B]'}>
                  {isBatteryDischarging
                    ? `Disch: ${battery_discharge_kw.toFixed(1)} kW`
                    : isBatteryCharging
                    ? `Charge: ${battery_charge_kw.toFixed(1)} kW`
                    : 'Standby'}
                </span>
              </div>
            </div>

            {/* Facility Demand */}
            <div className="pointer-events-auto bg-[#0A0F1D]/90 border border-[#A78BFA]/30 rounded-lg p-3 w-48 shadow-lg backdrop-blur">
              <div className="flex items-center gap-2 text-purple-400 mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Facility Load</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {demand_kw.toFixed(1)} <span className="text-xs text-[#94A3B8]">kW</span>
              </div>
              <div className="text-[10px] font-mono text-[#94A3B8] mt-1 flex justify-between">
                <span>Unserved: {step.unserved_demand_kw > 0.01 ? `${step.unserved_demand_kw.toFixed(1)} kW` : '0 kW'}</span>
                <span>Active Demand</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision rationale footer */}
      <div className="mt-4 pt-3 border-t border-[#1A263D] flex items-start gap-2 bg-[#0A0F1D]/60 p-3 rounded-lg">
        <span className="text-[11px] font-mono uppercase text-[#00E599] font-bold shrink-0 mt-0.5">
          Optimizer Rationale [{step.timestamp}]:
        </span>
        <p className="text-xs text-[#CBD5E1] font-mono leading-relaxed">
          {explanation}
        </p>
      </div>
    </div>
  );
};

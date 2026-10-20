import React from 'react';
import { TimeStepDispatch, ComparisonResult } from '../types/api';
import { Clock, Eye, AlertTriangle, ArrowRight } from 'lucide-react';

interface DispatchInspectorProps {
  comparison: ComparisonResult;
  selectedHour: number;
  onSelectHour: (hour: number) => void;
}

export const DispatchInspector: React.FC<DispatchInspectorProps> = ({
  comparison,
  selectedHour,
  onSelectHour,
}) => {
  const optSteps = comparison.optimized.steps;
  const baseSteps = comparison.baseline.steps;
  const currentOpt = optSteps[selectedHour] || optSteps[0];
  const currentBase = baseSteps[selectedHour] || baseSteps[0];

  return (
    <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#1A263D] gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#00E599]" />
            Hourly Dispatch Inspector & Decision Audit Log
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Select any hour to inspect engineering telemetry, physical state, and dispatch logic
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#94A3B8]">Inspecting Hour:</span>
          <span className="text-xs font-mono font-bold text-[#00E599] bg-[#00E599]/10 border border-[#00E599]/30 px-2 py-0.5 rounded">
            {currentOpt.timestamp}
          </span>
        </div>
      </div>

      {/* Selected Hour Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
        <div className="bg-[#141D30] border border-[#1A263D] p-2.5 rounded-lg">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Demand</span>
          <span className="text-sm font-bold font-mono text-purple-300">{currentOpt.demand_kw.toFixed(1)} kW</span>
        </div>
        <div className="bg-[#141D30] border border-[#1A263D] p-2.5 rounded-lg">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Solar / Wind</span>
          <span className="text-sm font-bold font-mono text-amber-300">
            {currentOpt.solar_kw.toFixed(1)} / {currentOpt.wind_kw.toFixed(1)} kW
          </span>
        </div>
        <div className="bg-[#141D30] border border-[#1A263D] p-2.5 rounded-lg">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Battery Flow</span>
          <span className={`text-sm font-bold font-mono ${
            currentOpt.battery_discharge_kw > 0 ? 'text-amber-400' : currentOpt.battery_charge_kw > 0 ? 'text-[#00E599]' : 'text-[#64748B]'
          }`}>
            {currentOpt.battery_discharge_kw > 0
              ? `Disch ${currentOpt.battery_discharge_kw.toFixed(1)} kW`
              : currentOpt.battery_charge_kw > 0
              ? `Chg ${currentOpt.battery_charge_kw.toFixed(1)} kW`
              : 'Idle'}
          </span>
        </div>
        <div className="bg-[#141D30] border border-[#1A263D] p-2.5 rounded-lg">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Battery SoC</span>
          <span className="text-sm font-bold font-mono text-[#00E599]">
            {(currentOpt.battery_soc * 100).toFixed(0)}% ({currentOpt.battery_energy_kwh.toFixed(1)} kWh)
          </span>
        </div>
        <div className="bg-[#141D30] border border-[#1A263D] p-2.5 rounded-lg">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Grid Import/Export</span>
          <span className={`text-sm font-bold font-mono ${currentOpt.grid_import_kw > 0 ? 'text-sky-300' : currentOpt.grid_export_kw > 0 ? 'text-emerald-400' : 'text-[#64748B]'}`}>
            {currentOpt.grid_import_kw > 0
              ? `Imp ${currentOpt.grid_import_kw.toFixed(1)} kW`
              : currentOpt.grid_export_kw > 0
              ? `Exp ${currentOpt.grid_export_kw.toFixed(1)} kW`
              : '0.0 kW'}
          </span>
        </div>
        <div className="bg-[#141D30] border border-[#1A263D] p-2.5 rounded-lg">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Electricity Price</span>
          <span className="text-sm font-bold font-mono text-white">${currentOpt.grid_price.toFixed(2)}/kWh</span>
        </div>
        <div className="bg-[#141D30] border border-[#1A263D] p-2.5 rounded-lg">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Carbon Intensity</span>
          <span className="text-sm font-bold font-mono text-[#00D8F6]">{currentOpt.grid_carbon_intensity.toFixed(2)} kg/kWh</span>
        </div>
        <div className="bg-[#141D30] border border-[#1A263D] p-2.5 rounded-lg">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Hour Cost / CO₂</span>
          <span className="text-sm font-bold font-mono text-white">
            ${currentOpt.cost_step.toFixed(2)} / {currentOpt.emissions_step.toFixed(1)} kg
          </span>
        </div>
      </div>

      {/* Narrative Decision Reason */}
      <div className="p-3 bg-[#141D30] border border-[#1A263D] rounded-lg mb-4 flex items-start gap-3">
        <div className="p-1 rounded bg-[#00E599]/10 text-[#00E599] shrink-0 mt-0.5">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-mono font-bold text-white block mb-0.5">
            Optimal Control Decision Rationale @ {currentOpt.timestamp}:
          </span>
          <p className="text-xs font-mono text-[#CBD5E1] leading-relaxed">
            {currentOpt.explanation}
          </p>
        </div>
      </div>

      {/* 24-Hour Scrollable Audit Table */}
      <div className="overflow-x-auto max-h-64 border border-[#1A263D] rounded-lg">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#141D30] text-[#94A3B8] sticky top-0 z-10">
            <tr>
              <th className="py-2 px-3">Hour</th>
              <th className="py-2 px-3">Demand</th>
              <th className="py-2 px-3">Solar/Wind</th>
              <th className="py-2 px-3">Opt Chg/Disch</th>
              <th className="py-2 px-3">Opt SoC</th>
              <th className="py-2 px-3">Opt Import</th>
              <th className="py-2 px-3">Base Import</th>
              <th className="py-2 px-3">Tariff</th>
              <th className="py-2 px-3">Hour Cost</th>
              <th className="py-2 px-3">Action Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A263D] text-[#CBD5E1]">
            {optSteps.map((s, idx) => {
              const bStep = baseSteps[idx];
              const isSelected = s.hour === selectedHour;
              return (
                <tr
                  key={s.hour}
                  onClick={() => onSelectHour(s.hour)}
                  className={`cursor-pointer transition hover:bg-[#1A263D]/60 ${
                    isSelected ? 'bg-[#00E599]/10 border-l-2 border-[#00E599] font-medium text-white' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-bold text-white">{s.timestamp}</td>
                  <td className="py-2 px-3 text-purple-300">{s.demand_kw.toFixed(1)}</td>
                  <td className="py-2 px-3 text-amber-300">{s.solar_kw.toFixed(1)} / {s.wind_kw.toFixed(1)}</td>
                  <td className="py-2 px-3">
                    {s.battery_discharge_kw > 0 ? (
                      <span className="text-amber-400">-{s.battery_discharge_kw.toFixed(1)}</span>
                    ) : s.battery_charge_kw > 0 ? (
                      <span className="text-[#00E599]">+{s.battery_charge_kw.toFixed(1)}</span>
                    ) : (
                      <span className="text-[#64748B]">0.0</span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-semibold text-[#00E599]">{(s.battery_soc * 100).toFixed(0)}%</td>
                  <td className="py-2 px-3 text-sky-300 font-bold">{s.grid_import_kw.toFixed(1)}</td>
                  <td className="py-2 px-3 text-red-300">{bStep.grid_import_kw.toFixed(1)}</td>
                  <td className="py-2 px-3">${s.grid_price.toFixed(2)}</td>
                  <td className="py-2 px-3">${s.cost_step.toFixed(2)}</td>
                  <td className="py-2 px-3 text-[11px] text-[#94A3B8] truncate max-w-xs">{s.explanation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

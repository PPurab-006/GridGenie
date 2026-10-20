import React from 'react';
import { DollarSign, Cloud, Sun, BatteryCharging, Zap, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ComparisonResult, TimeStepDispatch } from '../types/api';

interface OverviewCardsProps {
  comparison: ComparisonResult;
  currentStep: TimeStepDispatch;
  baselineStep: TimeStepDispatch;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  comparison,
  currentStep,
  baselineStep,
}) => {
  const { optimized, baseline, savings_cost_abs, savings_cost_pct, emissions_reduction_abs, emissions_reduction_pct, peak_shaving_kw, peak_shaving_pct } = comparison;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {/* 1. Operating Cost */}
      <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-4 flex flex-col justify-between hover:border-[#2A3B5C] transition">
        <div className="flex items-center justify-between text-[#94A3B8] mb-2">
          <span className="text-xs font-mono uppercase tracking-wider">24h Net OpCost</span>
          <div className="p-1.5 rounded-md bg-[#00E599]/10 text-[#00E599]">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
              ${optimized.kpis.total_cost.toFixed(2)}
            </span>
            <span className="text-xs text-[#64748B] line-through tabular-nums">
              ${baseline.kpis.total_cost.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className={`flex items-center font-mono font-semibold px-1.5 py-0.5 rounded ${
              savings_cost_abs >= 0
                ? 'bg-[#00E599]/15 text-[#00E599]'
                : 'bg-red-500/15 text-red-400'
            }`}>
              {savings_cost_abs >= 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              {savings_cost_pct >= 0 ? `-${savings_cost_pct}%` : `+${Math.abs(savings_cost_pct)}%`}
            </span>
            <span className="text-[11px] text-[#94A3B8] tabular-nums">
              Save ${savings_cost_abs.toFixed(2)} vs base
            </span>
          </div>
        </div>
      </div>

      {/* 2. Carbon Emissions */}
      <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-4 flex flex-col justify-between hover:border-[#2A3B5C] transition">
        <div className="flex items-center justify-between text-[#94A3B8] mb-2">
          <span className="text-xs font-mono uppercase tracking-wider">24h Carbon Impact</span>
          <div className="p-1.5 rounded-md bg-[#00D8F6]/10 text-[#00D8F6]">
            <Cloud className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
              {optimized.kpis.total_emissions.toFixed(1)}
            </span>
            <span className="text-xs text-[#94A3B8]">kg CO₂</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className={`flex items-center font-mono font-semibold px-1.5 py-0.5 rounded ${
              emissions_reduction_abs >= 0
                ? 'bg-[#00D8F6]/15 text-[#00D8F6]'
                : 'bg-[#64748B]/20 text-[#94A3B8]'
            }`}>
              {emissions_reduction_pct >= 0 ? `-${emissions_reduction_pct}%` : `+${Math.abs(emissions_reduction_pct)}%`}
            </span>
            <span className="text-[11px] text-[#94A3B8] tabular-nums">
              {emissions_reduction_abs >= 0 ? `Reduced ${emissions_reduction_abs.toFixed(1)} kg` : 'Emissions neutral'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Renewable Utilization */}
      <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-4 flex flex-col justify-between hover:border-[#2A3B5C] transition">
        <div className="flex items-center justify-between text-[#94A3B8] mb-2">
          <span className="text-xs font-mono uppercase tracking-wider">Renewable Fraction</span>
          <div className="p-1.5 rounded-md bg-amber-400/10 text-amber-400">
            <Sun className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
              {optimized.kpis.renewable_utilization_pct.toFixed(1)}%
            </span>
            <span className="text-xs text-[#94A3B8]">utilized</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-[#94A3B8] font-mono">
            <span>Gen: {optimized.kpis.total_renewable_gen_kwh.toFixed(0)} kWh</span>
            <span className={optimized.kpis.renewable_curtailment_kwh > 0 ? 'text-amber-400' : 'text-[#64748B]'}>
              Curt: {optimized.kpis.renewable_curtailment_kwh.toFixed(1)} kWh
            </span>
          </div>
        </div>
      </div>

      {/* 4. Battery Telemetry */}
      <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-4 flex flex-col justify-between hover:border-[#2A3B5C] transition">
        <div className="flex items-center justify-between text-[#94A3B8] mb-2">
          <span className="text-xs font-mono uppercase tracking-wider">Active Battery SoC</span>
          <div className="p-1.5 rounded-md bg-emerald-400/10 text-emerald-400">
            <BatteryCharging className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
              {(currentStep.battery_soc * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-[#94A3B8] tabular-nums">
              ({currentStep.battery_energy_kwh.toFixed(1)} kWh)
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-[#94A3B8] font-mono">
            <span>24h Throughput: {optimized.kpis.battery_throughput_kwh.toFixed(0)} kWh</span>
            <span className="text-[#00E599]">{optimized.kpis.equivalent_battery_cycles.toFixed(2)} cycles</span>
          </div>
        </div>
      </div>

      {/* 5. Peak Grid Demand */}
      <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-4 flex flex-col justify-between hover:border-[#2A3B5C] transition">
        <div className="flex items-center justify-between text-[#94A3B8] mb-2">
          <span className="text-xs font-mono uppercase tracking-wider">Peak Grid Import</span>
          <div className="p-1.5 rounded-md bg-purple-400/10 text-purple-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
              {optimized.kpis.peak_grid_import_kw.toFixed(1)}
            </span>
            <span className="text-xs text-[#94A3B8]">kW</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#94A3B8] font-mono">
            <span>Base: {baseline.kpis.peak_grid_import_kw.toFixed(1)} kW</span>
            {peak_shaving_kw > 0.1 && (
              <span className="text-[#00E599] font-semibold">
                (-{peak_shaving_kw.toFixed(1)} kW)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

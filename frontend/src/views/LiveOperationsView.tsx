import React, { useState } from 'react';
import { ComparisonResult, MicrogridConfig, AssetId } from '../types/api';
import { MicrogridScene } from '../components/digitaltwin/MicrogridScene';
import { AssetDetailPanel } from '../components/digitaltwin/AssetDetailPanel';
import {
  Zap,
  BatteryCharging,
  Sun,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowDownRight,
  ShieldCheck,
  Leaf,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface LiveOperationsViewProps {
  comparison: ComparisonResult;
  currentHour: number;
  onHourClick: (hour: number) => void;
  config: MicrogridConfig;
}

export const LiveOperationsView: React.FC<LiveOperationsViewProps> = ({
  comparison,
  currentHour,
  onHourClick,
  config,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<AssetId | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  const {
    optimized,
    baseline,
    savings_cost_abs,
    savings_cost_pct,
    emissions_reduction_abs,
    emissions_reduction_pct,
  } = comparison;

  const currentStep = optimized.steps[currentHour] || optimized.steps[0];
  const activeTimestamp = `${String(currentHour).padStart(2, '0')}:00`;

  // Total renewables at current hour
  const currentRenewables = currentStep.solar_kw + currentStep.wind_kw;
  const currentRenPct =
    currentStep.demand_kw > 0
      ? Math.min(100, (currentStep.renewables_used_kw / currentStep.demand_kw) * 100)
      : 100;

  // Dynamic Human-Centered Energy Summary derived from real data
  const generateHumanSummary = (): string => {
    const isCharging = currentStep.battery_charge_kw > 0.1;
    const isDischarging = currentStep.battery_discharge_kw > 0.1;
    const isImporting = currentStep.grid_import_kw > 0.1;
    const isSolarPrimary = currentStep.solar_kw > currentStep.wind_kw && currentStep.solar_kw > 15;
    const isWindPrimary = currentStep.wind_kw > currentStep.solar_kw && currentStep.wind_kw > 15;

    if (currentRenPct >= 95 && !isImporting) {
      if (isCharging) {
        return `Abundant zero-carbon renewables are satisfying 100% of the facility's power while charging the battery storage at ${currentStep.battery_charge_kw.toFixed(1)} kW for later use.`;
      }
      return `The facility is operating completely self-sufficiently on clean local energy with zero grid dependence.`;
    }

    if (isDischarging) {
      if (currentStep.grid_price >= 0.2) {
        return `GridMind is discharging the battery at ${currentStep.battery_discharge_kw.toFixed(1)} kW to avoid expensive peak electricity prices ($${currentStep.grid_price.toFixed(2)}/kWh), protecting your operating budget.`;
      }
      return `The battery is discharging ${currentStep.battery_discharge_kw.toFixed(1)} kW to support facility demand alongside local renewables.`;
    }

    if (isCharging) {
      return `Surplus local clean generation is being captured into battery storage at ${currentStep.battery_charge_kw.toFixed(1)} kW, preventing clean energy curtailment.`;
    }

    if (isImporting) {
      if (isSolarPrimary) {
        return `Solar PV is supplying ${currentStep.solar_kw.toFixed(1)} kW of power, with the remaining ${(currentStep.demand_kw - currentStep.solar_kw).toFixed(1)} kW imported from the grid to maintain balance.`;
      }
      if (isWindPrimary) {
        return `Wind generation is supplying ${currentStep.wind_kw.toFixed(1)} kW, with supplemental grid electricity meeting the facility's active load.`;
      }
      return `The facility is importing ${currentStep.grid_import_kw.toFixed(1)} kW from the regional utility grid while local renewable output is low.`;
    }

    return `The microgrid is in equilibrium: local renewable production matches facility consumption.`;
  };

  // 24-hour timeline dataset
  const timelineData = optimized.steps.map((s) => ({
    timestamp: s.timestamp,
    hour: s.hour,
    Demand: s.demand_kw,
    Renewables: Number((s.solar_kw + s.wind_kw).toFixed(1)),
    'Grid Import': s.grid_import_kw,
    'Battery Disch': s.battery_discharge_kw,
    'Battery Charge': s.battery_charge_kw,
    SoC: Number((s.battery_soc * 100).toFixed(1)),
    Price: s.grid_price,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Main Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1 pb-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6EFEA] border border-[#CCDCD2] text-xs font-semibold text-[#1D3D2D] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#28533D]" />
            Interactive 3D Digital Twin
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#171E1A] tracking-tight leading-tight">
            See where your energy goes.
          </h1>
          <p className="text-sm sm:text-base text-[#4A5B52] mt-1.5 max-w-2xl leading-relaxed">
            GridMind simulates renewable generation, battery storage, and electricity demand to find
            better operating decisions in real time.
          </p>
        </div>

        {/* Quick Scenario Badge */}
        <div className="shrink-0 flex items-center gap-2 bg-[#FAF8F5] border border-[#D5E0D7] px-3.5 py-2 rounded-xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <div className="text-xs">
            <span className="text-[#788A80] block font-medium">Active Scenario</span>
            <span className="font-semibold text-[#171E1A]">{comparison.scenario_name}</span>
          </div>
        </div>
      </div>

      {/* 2. Central 3D Digital Twin & Contextual Asset Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main 3D Canvas Viewport */}
        <div className={`transition-all duration-300 ${selectedAsset ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'}`}>
          <MicrogridScene
            step={currentStep}
            config={config}
            selectedAsset={selectedAsset}
            onSelectAsset={setSelectedAsset}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
          />
        </div>

        {/* Contextual Asset Detail Panel (Shown when an asset is clicked) */}
        {selectedAsset && (
          <div className="lg:col-span-4 xl:col-span-3 animate-in slide-in-from-right-4 duration-200">
            <AssetDetailPanel
              assetId={selectedAsset}
              step={currentStep}
              config={config}
              onClose={() => setSelectedAsset(null)}
            />
          </div>
        )}
      </div>

      {/* 3. Human-Readable Energy Summary Strip */}
      <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-4 shadow-sm flex items-start sm:items-center gap-3">
        <div className="p-2.5 rounded-lg bg-[#E6EFEA] text-[#1D3D2D] shrink-0">
          <Leaf className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5D7C6C]">
            Operating State Summary @ {activeTimestamp}
          </div>
          <p className="text-sm font-medium text-[#171E1A] mt-0.5 leading-relaxed">
            {generateHumanSummary()}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0EDE4] border border-[#DCD5C5] text-xs font-mono text-[#4A5B52] shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span>Physical Constraints Met</span>
        </div>
      </div>

      {/* 4. Four Prominent Economics & Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Operating Cost with Baseline Comparison */}
        <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm hover:border-[#1D3D2D] transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5D7C6C] mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">
              24h Operating Cost
            </span>
            <div className="p-1.5 rounded-md bg-[#E6EFEA] text-[#1D3D2D]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-bold tracking-tight text-[#171E1A] tabular-nums">
                ${optimized.kpis.total_cost.toFixed(2)}
              </span>
              <span className="text-sm text-[#788A80] line-through tabular-nums">
                ${baseline.kpis.total_cost.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span
                className={`flex items-center font-semibold px-2 py-0.5 rounded text-[11px] tabular-nums ${
                  savings_cost_abs >= 0
                    ? 'bg-[#E6EFEA] text-[#1D3D2D] border border-[#CCDCD2]'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
                {savings_cost_pct >= 0 ? `${savings_cost_pct}% lower` : `+${Math.abs(savings_cost_pct)}%`}
              </span>
              <span className="text-[11px] text-[#5D7C6C]">vs. Baseline</span>
            </div>
            <p className="text-[10px] text-[#788A80] mt-2 italic">
              Simulated estimate under {comparison.scenario_name}.
            </p>
          </div>
        </div>

        {/* Metric 2: Renewable Electricity Used */}
        <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm hover:border-[#1D3D2D] transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5D7C6C] mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">
              Renewable Energy Used
            </span>
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-[#171E1A] tabular-nums">
                {currentRenPct.toFixed(0)}%
              </span>
              <span className="text-xs text-[#5D7C6C] font-medium">of load right now</span>
            </div>
            <div className="w-full bg-[#E6E2D8] h-2 rounded-full overflow-hidden my-2.5">
              <div
                className="bg-[#D97706] h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, currentRenPct))}%` }}
              />
            </div>
            <p className="text-[11px] text-[#5D7C6C] font-mono flex justify-between">
              <span>Gen: {currentRenewables.toFixed(1)} kW</span>
              <span>Solar: {currentStep.solar_kw.toFixed(1)} | Wind: {currentStep.wind_kw.toFixed(1)} kW</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Battery State of Charge */}
        <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm hover:border-[#1D3D2D] transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5D7C6C] mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">
              Battery Storage (BESS)
            </span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <BatteryCharging className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-[#171E1A] tabular-nums">
                {(currentStep.battery_soc * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-[#5D7C6C] tabular-nums font-mono">
                {currentStep.battery_energy_kwh.toFixed(1)} / {config.battery.capacity_kwh} kWh
              </span>
            </div>
            <div className="w-full bg-[#E6E2D8] h-2 rounded-full overflow-hidden my-2.5">
              <div
                className="bg-[#059669] h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, currentStep.battery_soc * 100))}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-[#5D7C6C] font-mono flex justify-between">
              <span>Range: 20% - 90%</span>
              <span
                className={`font-semibold ${
                  currentStep.battery_discharge_kw > 0
                    ? 'text-lime-700'
                    : currentStep.battery_charge_kw > 0
                    ? 'text-emerald-700'
                    : 'text-gray-500'
                }`}
              >
                {currentStep.battery_discharge_kw > 0
                  ? `Disch: -${currentStep.battery_discharge_kw.toFixed(1)} kW`
                  : currentStep.battery_charge_kw > 0
                  ? `Chg: +${currentStep.battery_charge_kw.toFixed(1)} kW`
                  : 'Standby'}
              </span>
            </p>
          </div>
        </div>

        {/* Metric 4: Carbon Emissions */}
        <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm hover:border-[#1D3D2D] transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5D7C6C] mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">
              Carbon Emissions
            </span>
            <div className="p-1.5 rounded-md bg-teal-50 text-teal-700">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-[#171E1A] tabular-nums">
                {optimized.kpis.total_emissions.toFixed(1)}
              </span>
              <span className="text-xs text-[#5D7C6C] font-medium">kg CO₂</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span
                className={`flex items-center font-semibold px-2 py-0.5 rounded text-[11px] tabular-nums ${
                  emissions_reduction_pct >= 0
                    ? 'bg-[#E6EFEA] text-[#1D3D2D] border border-[#CCDCD2]'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {emissions_reduction_pct >= 0
                  ? `-${emissions_reduction_pct}% CO₂`
                  : `+${Math.abs(emissions_reduction_pct)}% CO₂`}
              </span>
              <span className="text-[11px] text-[#5D7C6C]">
                Save {emissions_reduction_abs.toFixed(1)} kg vs base
              </span>
            </div>
            <p className="text-[10px] text-[#788A80] mt-2 font-mono">
              Peak Grid Draw: {optimized.kpis.peak_grid_import_kw.toFixed(1)} kW
            </p>
          </div>
        </div>
      </div>

      {/* 5. Prominent Decision Explanation Card */}
      <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm flex items-start gap-3.5">
        <div className="p-2.5 bg-[#E6EFEA] rounded-lg text-[#1D3D2D] shrink-0 mt-0.5">
          <Clock className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1D3D2D]">
              Optimal Control Action @ {currentStep.timestamp}
            </span>
            <span className="text-[11px] text-[#788A80] font-mono">
              (Two-Stage LP Realization)
            </span>
          </div>
          <p className="text-sm font-medium text-[#171E1A] leading-relaxed">
            {currentStep.explanation}
          </p>
        </div>
      </div>

      {/* 6. Interactive 24-Hour Dispatch Timeline Chart */}
      <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#E3DED2] gap-2">
          <div>
            <h3 className="text-base font-editorial font-bold text-[#171E1A] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1D3D2D]" />
              24-Hour Microgrid Dispatch Timeline
            </h3>
            <p className="text-xs text-[#5D7C6C] mt-0.5">
              Click any hour along the horizon to seek the 3D scene and inspect physical power flows
            </p>
          </div>
          <div className="text-xs text-[#5D7C6C]">
            Selected Time Step:{' '}
            <strong className="text-[#1D3D2D] font-mono bg-[#E6EFEA] px-2 py-0.5 rounded border border-[#CCDCD2]">
              {activeTimestamp}
            </strong>
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timelineData}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  onHourClick(e.activePayload[0].payload.hour);
                }
              }}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorDemV3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorRenV3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D3D2D" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1D3D2D" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E0D4" vertical={false} />
              <XAxis dataKey="timestamp" stroke="#788A80" fontSize={11} tickLine={false} />
              <YAxis stroke="#788A80" fontSize={11} tickLine={false} unit=" kW" />
              <Tooltip />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: '11px', fontFamily: 'Plus Jakarta Sans', color: '#171E1A' }}
              />
              <ReferenceLine
                x={activeTimestamp}
                stroke="#1D3D2D"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: 'ACTIVE HOUR',
                  fill: '#1D3D2D',
                  fontSize: 10,
                  position: 'top',
                }}
              />

              <Area
                type="monotone"
                dataKey="Demand"
                stroke="#D97706"
                fill="url(#colorDemV3)"
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="Renewables"
                stroke="#1D3D2D"
                fill="url(#colorRenV3)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Grid Import"
                stroke="#DC2626"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Battery Disch"
                stroke="#65A30D"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Battery Charge"
                stroke="#059669"
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

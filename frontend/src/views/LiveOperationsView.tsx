import React from 'react';
import { ComparisonResult, BatteryConfig } from '../types/api';
import { DigitalTwin } from '../components/DigitalTwin';
import {
  Zap,
  BatteryCharging,
  Sun,
  DollarSign,
  Info,
  Clock,
  ArrowDownRight,
  TrendingUp,
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
  batteryConfig: BatteryConfig;
}

export const LiveOperationsView: React.FC<LiveOperationsViewProps> = ({
  comparison,
  currentHour,
  onHourClick,
  batteryConfig,
}) => {
  const { optimized, baseline, savings_cost_abs, savings_cost_pct, emissions_reduction_abs, emissions_reduction_pct } = comparison;
  const currentStep = optimized.steps[currentHour] || optimized.steps[0];
  const activeTimestamp = `${String(currentHour).padStart(2, '0')}:00`;

  // Total renewables at current hour
  const currentRenewables = currentStep.solar_kw + currentStep.wind_kw;
  const currentRenPct = currentStep.demand_kw > 0
    ? Math.min(100, (currentStep.renewables_used_kw / currentStep.demand_kw) * 100)
    : 100;

  // 24-hour timeline dataset
  const timelineData = optimized.steps.map((s) => ({
    timestamp: s.timestamp,
    hour: s.hour,
    Demand: s.demand_kw,
    Renewables: s.solar_kw + s.wind_kw,
    'Grid Import': s.grid_import_kw,
    'Battery Disch': s.battery_discharge_kw,
    'Battery Charge': s.battery_charge_kw,
    SoC: Number((s.battery_soc * 100).toFixed(1)),
    Price: s.grid_price,
  }));

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Operational Summary: Exactly 4 Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Current Grid Import */}
        <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-4 flex flex-col justify-between hover:border-[#2A3B5C] transition">
          <div className="flex items-center justify-between text-[#94A3B8] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Grid Exchange</span>
            <div className="p-1.5 rounded-md bg-sky-400/10 text-sky-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
                {currentStep.grid_import_kw > 0.05
                  ? `${currentStep.grid_import_kw.toFixed(1)} kW`
                  : currentStep.grid_export_kw > 0.05
                  ? `-${currentStep.grid_export_kw.toFixed(1)} kW`
                  : '0.0 kW'}
              </span>
              <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${
                currentStep.grid_import_kw > 0.05
                  ? 'bg-sky-400/15 text-sky-300'
                  : currentStep.grid_export_kw > 0.05
                  ? 'bg-[#00E599]/15 text-[#00E599]'
                  : 'bg-[#141D30] text-[#64748B]'
              }`}>
                {currentStep.grid_import_kw > 0.05 ? 'Importing' : currentStep.grid_export_kw > 0.05 ? 'Exporting' : 'Idle'}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1.5 font-mono">
              Tariff: <strong className="text-white">${currentStep.grid_price.toFixed(2)}/kWh</strong> &bull; Carbon: {currentStep.grid_carbon_intensity.toFixed(2)} kg/kWh
            </p>
          </div>
        </div>

        {/* Metric 2: Battery State of Charge */}
        <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-4 flex flex-col justify-between hover:border-[#2A3B5C] transition">
          <div className="flex items-center justify-between text-[#94A3B8] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Battery State of Charge</span>
            <div className="p-1.5 rounded-md bg-[#00E599]/10 text-[#00E599]">
              <BatteryCharging className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
                {(currentStep.battery_soc * 100).toFixed(0)}%
              </span>
              <span className="text-xs font-mono text-[#CBD5E1]">
                {currentStep.battery_energy_kwh.toFixed(1)} / {batteryConfig.capacity_kwh} kWh
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[#1A263D] h-1.5 rounded-full overflow-hidden my-2">
              <div
                className="bg-[#00E599] h-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, currentStep.battery_soc * 100))}%` }}
              />
            </div>
            <p className="text-[11px] text-[#94A3B8] font-mono flex justify-between">
              <span>Limit: 15% - 95%</span>
              <span className={currentStep.battery_discharge_kw > 0 ? 'text-amber-400 font-semibold' : currentStep.battery_charge_kw > 0 ? 'text-[#00E599] font-semibold' : 'text-[#64748B]'}>
                {currentStep.battery_discharge_kw > 0
                  ? `Disch: ${currentStep.battery_discharge_kw.toFixed(1)} kW`
                  : currentStep.battery_charge_kw > 0
                  ? `Chg: ${currentStep.battery_charge_kw.toFixed(1)} kW`
                  : 'Standby'}
              </span>
            </p>
          </div>
        </div>

        {/* Metric 3: Renewable Contribution */}
        <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-4 flex flex-col justify-between hover:border-[#2A3B5C] transition">
          <div className="flex items-center justify-between text-[#94A3B8] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Renewable Contribution</span>
            <div className="p-1.5 rounded-md bg-amber-400/10 text-amber-400">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
                {currentRenPct.toFixed(0)}%
              </span>
              <span className="text-xs text-[#94A3B8]">of load</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1.5 font-mono flex justify-between">
              <span>Gen: {currentRenewables.toFixed(1)} kW</span>
              <span>Solar: {currentStep.solar_kw.toFixed(1)} | Wind: {currentStep.wind_kw.toFixed(1)}</span>
            </p>
          </div>
        </div>

        {/* Metric 4: Projected Operating Cost */}
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
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <span className={`flex items-center font-mono font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                savings_cost_abs >= 0 ? 'bg-[#00E599]/15 text-[#00E599]' : 'bg-red-500/15 text-red-400'
              }`}>
                <ArrowDownRight className="w-3 h-3" />
                {savings_cost_pct >= 0 ? `-${savings_cost_pct}%` : `+${Math.abs(savings_cost_pct)}%`}
              </span>
              <span className="text-[11px] text-[#94A3B8] font-mono">
                Save ${savings_cost_abs.toFixed(2)} vs base
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Context Strip */}
      <div className="px-4 py-2 bg-[#0F1626]/60 border border-[#1A263D] rounded-lg flex flex-wrap items-center justify-between text-xs font-mono text-[#94A3B8]">
        <div className="flex items-center gap-4">
          <span>Carbon: <strong className="text-white">{optimized.kpis.total_emissions.toFixed(1)} kg CO₂</strong> {emissions_reduction_pct > 0 && <span className="text-[#00D8F6]">(-{emissions_reduction_pct}%)</span>}</span>
          <span>&bull;</span>
          <span>Peak Grid Draw: <strong className="text-white">{optimized.kpis.peak_grid_import_kw.toFixed(1)} kW</strong></span>
          <span>&bull;</span>
          <span>Reliability: <strong className="text-emerald-400">100% Served</strong></span>
        </div>
        <div className="text-[11px] text-[#64748B]">
          Scenario: <strong className="text-[#CBD5E1]">{comparison.scenario_name}</strong>
        </div>
      </div>

      {/* 2. Main Energy-Flow Visualization (Digital Twin Centerpiece) */}
      <DigitalTwin step={currentStep} batteryCapacity={batteryConfig.capacity_kwh} />

      {/* 3. Prominent Decision Explanation */}
      <div className="bg-[#0F1626] border border-[#00E599]/30 rounded-xl p-4 shadow-lg flex items-start gap-3">
        <div className="p-2 bg-[#00E599]/10 rounded-lg text-[#00E599] shrink-0 mt-0.5">
          <Clock className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#00E599]">
              Optimal Control Action @ {currentStep.timestamp}
            </span>
            <span className="text-[11px] font-mono text-[#64748B]">
              (Two-Stage LP Realization)
            </span>
          </div>
          <p className="text-sm font-mono text-white leading-relaxed">
            {currentStep.explanation}
          </p>
        </div>
      </div>

      {/* 4. Unified 24-Hour Dispatch Timeline Chart */}
      <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#1A263D] gap-2">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00E599]" />
              24-Hour Microgrid Dispatch Timeline
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Click any hour along the horizon to inspect its physical power flows & decision state
            </p>
          </div>
          <div className="text-xs font-mono text-[#94A3B8]">
            Current Hour: <strong className="text-[#00E599]">{activeTimestamp}</strong>
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
                <linearGradient id="colorDem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorRen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E599" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00E599" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A263D" vertical={false} />
              <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" />
              <Tooltip />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
              <ReferenceLine x={activeTimestamp} stroke="#00E599" strokeWidth={2} strokeDasharray="3 3" label={{ value: 'ACTIVE', fill: '#00E599', fontSize: 10, position: 'top' }} />

              <Area type="monotone" dataKey="Demand" stroke="#A78BFA" fill="url(#colorDem)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="Renewables" stroke="#00E599" fill="url(#colorRen)" strokeWidth={2} />
              <Line type="monotone" dataKey="Grid Import" stroke="#38BDF8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Battery Disch" stroke="#F59E0B" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

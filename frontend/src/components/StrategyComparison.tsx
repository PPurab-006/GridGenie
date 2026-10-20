import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ComparisonResult } from '../types/api';
import { Scale, CheckCircle2, AlertCircle, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface StrategyComparisonProps {
  comparison: ComparisonResult;
  currentHour: number;
}

export const StrategyComparison: React.FC<StrategyComparisonProps> = ({
  comparison,
  currentHour,
}) => {
  const { baseline, optimized, savings_cost_abs, savings_cost_pct, emissions_reduction_abs, emissions_reduction_pct, peak_shaving_kw, peak_shaving_pct } = comparison;

  // Construct comparison dataset for 24-hour grid imports
  const comparisonData = optimized.steps.map((optStep, i) => {
    const baseStep = baseline.steps[i];
    return {
      timestamp: optStep.timestamp,
      hour: optStep.hour,
      'Baseline Import': baseStep.grid_import_kw,
      'Optimizer Import': optStep.grid_import_kw,
      'Grid Tariff ($/kWh)': optStep.grid_price,
    };
  });

  const activeTimestamp = `${String(currentHour).padStart(2, '0')}:00`;

  return (
    <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#1A263D] gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#00E599]" />
            Strategy Evaluation: Baseline Heuristic vs. GridMind LP Optimizer
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Rigorous evaluation against identical load, solar, wind, battery, and pricing profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 bg-[#141D30] border border-[#1A263D] rounded text-[#CBD5E1]">
            Scenario: <strong className="text-white">{comparison.scenario_name}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Scientific KPI Metrics Table (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1A263D] text-[#94A3B8]">
                  <th className="pb-2 font-medium">Metric</th>
                  <th className="pb-2 font-medium">Baseline</th>
                  <th className="pb-2 font-medium">GridMind</th>
                  <th className="pb-2 font-medium text-right">Delta / Benefit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A263D]/60 text-white">
                <tr>
                  <td className="py-2.5 text-[#94A3B8]">Total OpCost ($)</td>
                  <td className="py-2.5">${baseline.kpis.total_cost.toFixed(2)}</td>
                  <td className="py-2.5 font-bold text-[#00E599]">${optimized.kpis.total_cost.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-bold text-[#00E599]">
                    {savings_cost_abs >= 0 ? `-$${savings_cost_abs.toFixed(2)} (-${savings_cost_pct}%)` : `+$${Math.abs(savings_cost_abs).toFixed(2)}`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-[#94A3B8]">Emissions (kg CO₂)</td>
                  <td className="py-2.5">{baseline.kpis.total_emissions.toFixed(1)}</td>
                  <td className="py-2.5 font-bold text-[#00D8F6]">{optimized.kpis.total_emissions.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-bold text-[#00D8F6]">
                    {emissions_reduction_abs >= 0 ? `-${emissions_reduction_abs.toFixed(1)} kg (-${emissions_reduction_pct}%)` : `+${Math.abs(emissions_reduction_abs).toFixed(1)} kg`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-[#94A3B8]">Grid Imported (kWh)</td>
                  <td className="py-2.5">{baseline.kpis.total_grid_imported_kwh.toFixed(1)}</td>
                  <td className="py-2.5">{optimized.kpis.total_grid_imported_kwh.toFixed(1)}</td>
                  <td className="py-2.5 text-right text-[#94A3B8]">
                    {(optimized.kpis.total_grid_imported_kwh - baseline.kpis.total_grid_imported_kwh).toFixed(1)} kWh
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-[#94A3B8]">Peak Grid Draw (kW)</td>
                  <td className="py-2.5">{baseline.kpis.peak_grid_import_kw.toFixed(1)}</td>
                  <td className="py-2.5">{optimized.kpis.peak_grid_import_kw.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-bold">
                    {peak_shaving_kw > 0 ? (
                      <span className="text-[#00E599]">-{peak_shaving_kw.toFixed(1)} kW</span>
                    ) : (
                      <span className="text-[#94A3B8]">{peak_shaving_kw.toFixed(1)} kW</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-[#94A3B8]">Curtailment (kWh)</td>
                  <td className="py-2.5">{baseline.kpis.renewable_curtailment_kwh.toFixed(1)}</td>
                  <td className="py-2.5">{optimized.kpis.renewable_curtailment_kwh.toFixed(1)}</td>
                  <td className="py-2.5 text-right text-[#94A3B8]">
                    {comparison.curtailment_reduction_kwh.toFixed(1)} kWh saved
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-[#94A3B8]">Battery Cycles</td>
                  <td className="py-2.5">{baseline.kpis.equivalent_battery_cycles.toFixed(2)}</td>
                  <td className="py-2.5">{optimized.kpis.equivalent_battery_cycles.toFixed(2)}</td>
                  <td className="py-2.5 text-right text-[#94A3B8]">
                    {(optimized.kpis.equivalent_battery_cycles - baseline.kpis.equivalent_battery_cycles).toFixed(2)} cycles
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-[#94A3B8]">Unserved Energy (kWh)</td>
                  <td className="py-2.5">{baseline.kpis.unserved_energy_kwh.toFixed(1)}</td>
                  <td className="py-2.5 font-bold text-white">{optimized.kpis.unserved_energy_kwh.toFixed(1)}</td>
                  <td className="py-2.5 text-right text-emerald-400 font-bold">
                    {optimized.kpis.unserved_energy_kwh === 0 ? '100% Reliable' : `${optimized.kpis.unserved_energy_pct}% unserved`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-3 p-2.5 bg-[#141D30] border border-[#1A263D] rounded text-[11px] text-[#94A3B8] leading-relaxed">
            <strong className="text-white">Scientific Dispatch Insight:</strong> The baseline strategy dispatches battery storage naively as soon as any deficit occurs. GridMind's look-ahead LP optimizer pre-charges storage during clean off-peak pricing and reserves capacity to displace expensive utility peakers during peak hours.
          </div>
        </div>

        {/* Right: Time-Series Import Comparison Chart (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-[#94A3B8]">
              Grid Import Shift Analysis (Peak Shaving & Arbitrage)
            </span>
            <span className="text-[11px] font-mono text-[#64748B]">
              Primary: Import kW &bull; Secondary: Price $/kWh
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A263D" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" />
                <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} tickLine={false} unit=" $" />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                <ReferenceLine yAxisId="left" x={activeTimestamp} stroke="#00E599" strokeWidth={2} strokeDasharray="3 3" />

                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Baseline Import"
                  stroke="#F87171"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Optimizer Import"
                  stroke="#00D8F6"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="stepAfter"
                  dataKey="Grid Tariff ($/kWh)"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  dot={false}
                  opacity={0.6}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

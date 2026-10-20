import React, { useState, useEffect } from 'react';
import { ComparisonResult, ScenarioId, ScenarioSummary } from '../types/api';
import { fetchBenchmarks } from '../api/client';
import {
  Scale,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  FileSpreadsheet,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PerformanceLabViewProps {
  comparison: ComparisonResult;
  selectedScenario: ScenarioId;
  scenarios: ScenarioSummary[];
  onScenarioChange: (id: ScenarioId) => void;
  currentSeed: number;
}

export const PerformanceLabView: React.FC<PerformanceLabViewProps> = ({
  comparison,
  selectedScenario,
  scenarios,
  onScenarioChange,
  currentSeed,
}) => {
  const [benchmarks, setBenchmarks] = useState<ComparisonResult[] | null>(null);
  const [loadingBenchmarks, setLoadingBenchmarks] = useState<boolean>(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);

  const { baseline, optimized, savings_cost_abs, savings_cost_pct, emissions_reduction_abs, emissions_reduction_pct, peak_shaving_kw } = comparison;

  const loadBenchmarks = async () => {
    setLoadingBenchmarks(true);
    setBenchmarkError(null);
    try {
      const data = await fetchBenchmarks(currentSeed);
      setBenchmarks(data.scenarios);
    } catch (err: any) {
      setBenchmarkError(err.message || 'Failed to load benchmarks');
    } finally {
      setLoadingBenchmarks(false);
    }
  };

  useEffect(() => {
    loadBenchmarks();
  }, [currentSeed]);

  // Comparison dataset for 24h Grid Import
  const comparisonData = optimized.steps.map((optStep, i) => {
    const baseStep = baseline.steps[i];
    return {
      timestamp: optStep.timestamp,
      'Baseline Import (kW)': baseStep.grid_import_kw,
      'Optimizer Import (kW)': optStep.grid_import_kw,
      'Tariff ($/kWh)': optStep.grid_price,
    };
  });

  const exportCSV = () => {
    if (!benchmarks) return;
    const headers = [
      'Scenario ID',
      'Scenario Name',
      'Baseline Cost ($)',
      'Optimizer Cost ($)',
      'Cost Savings ($)',
      'Cost Savings (%)',
      'Baseline Emissions (kg)',
      'Optimizer Emissions (kg)',
      'Emissions Reduction (kg)',
      'Emissions Reduction (%)',
      'Baseline Peak (kW)',
      'Optimizer Peak (kW)',
      'Baseline Curtailment (kWh)',
      'Optimizer Curtailment (kWh)',
      'Reliability (Unserved kWh)',
    ];

    const rows = benchmarks.map((sc) => [
      sc.scenario_id,
      `"${sc.scenario_name}"`,
      sc.baseline.kpis.total_cost.toFixed(2),
      sc.optimized.kpis.total_cost.toFixed(2),
      sc.savings_cost_abs.toFixed(2),
      sc.savings_cost_pct.toFixed(1),
      sc.baseline.kpis.total_emissions.toFixed(2),
      sc.optimized.kpis.total_emissions.toFixed(2),
      sc.emissions_reduction_abs.toFixed(2),
      sc.emissions_reduction_pct.toFixed(1),
      sc.baseline.kpis.peak_grid_import_kw.toFixed(1),
      sc.optimized.kpis.peak_grid_import_kw.toFixed(1),
      sc.baseline.kpis.renewable_curtailment_kwh.toFixed(2),
      sc.optimized.kpis.renewable_curtailment_kwh.toFixed(2),
      sc.optimized.kpis.unserved_energy_kwh.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridmind_performance_benchmarks_seed${currentSeed}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Scenario Selector Bar */}
      <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#00E599]" />
            Strategy Comparison & Multi-Scenario Laboratory
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Rigorous evaluation of Baseline Heuristic vs. Look-Ahead LP Optimizer on identical realized profiles
          </p>
        </div>

        {/* Scenario Pill Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-mono text-[#64748B] mr-1">Scenario:</span>
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => onScenarioChange(sc.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                selectedScenario === sc.id
                  ? 'bg-[#00E599] text-[#080C14] font-bold shadow'
                  : 'bg-[#141D30] text-[#94A3B8] border border-[#1A263D] hover:text-white'
              }`}
            >
              {sc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Comparison Metrics Table (5 cols) */}
        <div className="lg:col-span-5 bg-[#0F1626] border border-[#1A263D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              Active Scenario: {comparison.scenario_name}
            </h3>
            <p className="text-xs text-[#94A3B8] mb-4">
              Realized metrics computed across identical 24-hour weather and demand inputs
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1A263D] text-[#94A3B8]">
                    <th className="pb-2 font-medium">Metric</th>
                    <th className="pb-2 font-medium">Baseline</th>
                    <th className="pb-2 font-medium">GridMind</th>
                    <th className="pb-2 font-medium text-right">Advantage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A263D]/60 text-white">
                  <tr>
                    <td className="py-2.5 text-[#94A3B8]">Net OpCost</td>
                    <td className="py-2.5">${baseline.kpis.total_cost.toFixed(2)}</td>
                    <td className="py-2.5 font-bold text-[#00E599]">${optimized.kpis.total_cost.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold text-[#00E599]">
                      {savings_cost_abs >= 0 ? `-$${savings_cost_abs.toFixed(2)} (-${savings_cost_pct}%)` : `+$${Math.abs(savings_cost_abs).toFixed(2)}`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#94A3B8]">Emissions</td>
                    <td className="py-2.5">{baseline.kpis.total_emissions.toFixed(1)} kg</td>
                    <td className="py-2.5 font-bold text-[#00D8F6]">{optimized.kpis.total_emissions.toFixed(1)} kg</td>
                    <td className="py-2.5 text-right font-bold text-[#00D8F6]">
                      {emissions_reduction_abs >= 0 ? `-${emissions_reduction_abs.toFixed(1)} kg (-${emissions_reduction_pct}%)` : `+${Math.abs(emissions_reduction_abs).toFixed(1)} kg`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#94A3B8]">Grid Imported</td>
                    <td className="py-2.5">{baseline.kpis.total_grid_imported_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5">{optimized.kpis.total_grid_imported_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5 text-right text-[#94A3B8]">
                      {(optimized.kpis.total_grid_imported_kwh - baseline.kpis.total_grid_imported_kwh).toFixed(1)} kWh
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#94A3B8]">Peak Grid Draw</td>
                    <td className="py-2.5">{baseline.kpis.peak_grid_import_kw.toFixed(1)} kW</td>
                    <td className="py-2.5">{optimized.kpis.peak_grid_import_kw.toFixed(1)} kW</td>
                    <td className="py-2.5 text-right font-bold">
                      {peak_shaving_kw > 0 ? (
                        <span className="text-[#00E599]">-{peak_shaving_kw.toFixed(1)} kW</span>
                      ) : (
                        <span className="text-[#94A3B8]">{peak_shaving_kw.toFixed(1)} kW</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#94A3B8]">Curtailment</td>
                    <td className="py-2.5">{baseline.kpis.renewable_curtailment_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5">{optimized.kpis.renewable_curtailment_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5 text-right text-[#94A3B8]">
                      {comparison.curtailment_reduction_kwh.toFixed(1)} kWh saved
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#94A3B8]">Battery Cycles</td>
                    <td className="py-2.5">{baseline.kpis.equivalent_battery_cycles.toFixed(2)}</td>
                    <td className="py-2.5">{optimized.kpis.equivalent_battery_cycles.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-[#94A3B8]">
                      {(optimized.kpis.equivalent_battery_cycles - baseline.kpis.equivalent_battery_cycles).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#94A3B8]">Unserved Energy</td>
                    <td className="py-2.5">{baseline.kpis.unserved_energy_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5">{optimized.kpis.unserved_energy_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5 text-right text-emerald-400 font-bold">
                      {optimized.kpis.unserved_energy_kwh === 0 ? '100% Reliable' : `${optimized.kpis.unserved_energy_pct}% unserved`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#141D30] border border-[#1A263D] rounded-lg text-xs text-[#94A3B8] font-mono leading-relaxed">
            <strong className="text-white">Scientific Dispatch Insight:</strong> The baseline strategy dispatches storage greedily as soon as any morning load appears. GridMind's look-ahead optimizer pre-charges storage during cheap off-peak hours and preserves capacity to displace expensive utility peakers during peak hours.
          </div>
        </div>

        {/* Right: Time-Series Grid Import Shift Chart (7 cols) */}
        <div className="lg:col-span-7 bg-[#0F1626] border border-[#1A263D] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#1A263D]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-sky-400" />
                Grid Import Profile & Tariff Arbitrage
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Shows how GridMind shifts power import out of the peak pricing window
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">Primary: kW &bull; Secondary: Tariff</span>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A263D" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" />
                <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} tickLine={false} unit=" $" />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />

                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Baseline Import (kW)"
                  stroke="#F87171"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Optimizer Import (kW)"
                  stroke="#00D8F6"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="stepAfter"
                  dataKey="Tariff ($/kWh)"
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

      {/* Multi-Scenario Benchmark Table */}
      <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#1A263D] gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#00E599]" />
              Four-Scenario Cross-Benchmark Matrix
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Standardized scientific evaluation across normal and adverse stress scenarios
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadBenchmarks}
              disabled={loadingBenchmarks}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141D30] border border-[#1A263D] hover:border-[#2A3B5C] text-xs font-mono text-[#CBD5E1] rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBenchmarks ? 'animate-spin' : ''}`} />
              Re-run Matrix
            </button>
            <button
              onClick={exportCSV}
              disabled={!benchmarks || loadingBenchmarks}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00E599] hover:bg-[#00D08A] text-[#080C14] font-bold text-xs font-mono rounded-lg transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV Report
            </button>
          </div>
        </div>

        {loadingBenchmarks && (
          <div className="py-12 flex flex-col items-center justify-center text-[#94A3B8] font-mono text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-[#00E599] mb-2" />
            <span>Solving multi-scenario optimization models...</span>
          </div>
        )}

        {benchmarkError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-mono">
            {benchmarkError}
          </div>
        )}

        {!loadingBenchmarks && benchmarks && (
          <div className="overflow-x-auto border border-[#1A263D] rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#141D30] text-[#94A3B8]">
                <tr>
                  <th className="py-2.5 px-3">Scenario</th>
                  <th className="py-2.5 px-3">Base Cost</th>
                  <th className="py-2.5 px-3">Opt Cost</th>
                  <th className="py-2.5 px-3">Cost Savings</th>
                  <th className="py-2.5 px-3">Base CO₂</th>
                  <th className="py-2.5 px-3">Opt CO₂</th>
                  <th className="py-2.5 px-3">CO₂ Reduction</th>
                  <th className="py-2.5 px-3">Peak Draw</th>
                  <th className="py-2.5 px-3">Reliability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A263D] text-[#CBD5E1]">
                {benchmarks.map((sc) => (
                  <tr key={sc.scenario_id} className="hover:bg-[#1A263D]/40 transition">
                    <td className="py-3 px-3">
                      <span className="font-bold text-white block">{sc.scenario_name}</span>
                      <span className="text-[10px] text-[#64748B]">{sc.scenario_id}</span>
                    </td>
                    <td className="py-3 px-3">${sc.baseline.kpis.total_cost.toFixed(2)}</td>
                    <td className="py-3 px-3 font-bold text-[#00E599]">
                      ${sc.optimized.kpis.total_cost.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#00E599]">
                      -${sc.savings_cost_abs.toFixed(2)} (-{sc.savings_cost_pct}%)
                    </td>
                    <td className="py-3 px-3">{sc.baseline.kpis.total_emissions.toFixed(1)} kg</td>
                    <td className="py-3 px-3 font-bold text-[#00D8F6]">
                      {sc.optimized.kpis.total_emissions.toFixed(1)} kg
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#00D8F6]">
                      -{sc.emissions_reduction_abs.toFixed(1)} kg (-{sc.emissions_reduction_pct}%)
                    </td>
                    <td className="py-3 px-3 text-white">
                      {sc.optimized.kpis.peak_grid_import_kw.toFixed(1)} kW
                    </td>
                    <td className="py-3 px-3">
                      {sc.optimized.kpis.unserved_energy_kwh === 0 ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> 100% Served
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {sc.optimized.kpis.unserved_energy_kwh.toFixed(1)} kWh
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

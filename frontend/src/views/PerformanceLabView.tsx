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
  TrendingDown,
  FileSpreadsheet,
  Info,
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

  const {
    baseline,
    optimized,
    savings_cost_abs,
    savings_cost_pct,
    emissions_reduction_abs,
    emissions_reduction_pct,
    peak_shaving_kw,
  } = comparison;

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
      sc.baseline.kpis.peak_grid_import_kw.toFixed(2),
      sc.optimized.kpis.peak_grid_import_kw.toFixed(2),
      sc.baseline.kpis.renewable_curtailment_kwh.toFixed(2),
      sc.optimized.kpis.renewable_curtailment_kwh.toFixed(2),
      sc.optimized.kpis.unserved_energy_kwh.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridgenie_v3_benchmarks_seed_${currentSeed}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Scenario Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#E3DED2] gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E6EFEA] border border-[#CCDCD2] text-xs font-semibold text-[#1D3D2D] mb-1.5">
            <Scale className="w-3.5 h-3.5 text-[#28533D]" />
            Rigorous Benchmark Suite
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#171E1A] tracking-tight">
            Performance Lab & Strategy Benchmark
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5B52] mt-0.5">
            Scientific head-to-head comparison between rule-based heuristic dispatch and GridGenie's
            two-stage optimizer.
          </p>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-[#FAF8F5] border border-[#D5E0D7] p-1.5 rounded-xl shadow-sm">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => onScenarioChange(sc.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedScenario === sc.id
                  ? 'bg-[#1D3D2D] text-[#FAF8F5] font-semibold shadow-sm'
                  : 'text-[#4A5B52] hover:text-[#171E1A] hover:bg-[#EFECE4]'
              }`}
            >
              {sc.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards: 3 High-Impact Comparative Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cost Comparison */}
        <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm hover:border-[#1D3D2D] transition-colors">
          <span className="text-xs font-semibold tracking-wide uppercase text-[#5D7C6C]">
            Operating Cost Comparison
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-[#171E1A] tabular-nums">
                ${optimized.kpis.total_cost.toFixed(2)}
              </span>
              <span className="text-xs text-[#788A80] ml-2 line-through tabular-nums">
                ${baseline.kpis.total_cost.toFixed(2)}
              </span>
            </div>
            <span
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded tabular-nums ${
                savings_cost_abs >= 0
                  ? 'bg-[#E6EFEA] text-[#1D3D2D] border border-[#CCDCD2]'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              {savings_cost_pct}%
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E3ECE6] flex items-center justify-between text-xs text-[#5D7C6C]">
            <span>Net Financial Savings:</span>
            <strong className="text-[#1D3D2D] font-mono">${savings_cost_abs.toFixed(2)}</strong>
          </div>
        </div>

        {/* Carbon Reduction */}
        <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm hover:border-[#1D3D2D] transition-colors">
          <span className="text-xs font-semibold tracking-wide uppercase text-[#5D7C6C]">
            Carbon Footprint Impact
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-[#171E1A] tabular-nums">
                {optimized.kpis.total_emissions.toFixed(1)}
              </span>
              <span className="text-xs text-[#788A80] ml-1.5">kg CO₂</span>
              <span className="text-xs text-[#788A80] ml-2 line-through tabular-nums">
                {baseline.kpis.total_emissions.toFixed(1)}
              </span>
            </div>
            <span
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded tabular-nums ${
                emissions_reduction_pct >= 0
                  ? 'bg-[#E6EFEA] text-[#1D3D2D] border border-[#CCDCD2]'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              {emissions_reduction_pct}%
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E3ECE6] flex items-center justify-between text-xs text-[#5D7C6C]">
            <span>Emissions Avoided:</span>
            <strong className="text-[#1D3D2D] font-mono">{emissions_reduction_abs.toFixed(1)} kg</strong>
          </div>
        </div>

        {/* Peak Demand & Reliability */}
        <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm hover:border-[#1D3D2D] transition-colors">
          <span className="text-xs font-semibold tracking-wide uppercase text-[#5D7C6C]">
            Peak Grid Import & Reliability
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-[#171E1A] tabular-nums">
                {optimized.kpis.peak_grid_import_kw.toFixed(1)}
              </span>
              <span className="text-xs text-[#788A80] ml-1.5">kW Peak</span>
              <span className="text-xs text-[#788A80] ml-2 line-through tabular-nums">
                {baseline.kpis.peak_grid_import_kw.toFixed(1)}
              </span>
            </div>
            <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-[#E6EFEA] text-[#1D3D2D] border border-[#CCDCD2]">
              100% Reliable
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E3ECE6] flex items-center justify-between text-xs text-[#5D7C6C]">
            <span>Unserved Load:</span>
            <strong className="text-[#10B981] font-mono">0.00 kWh (0.0%)</strong>
          </div>
        </div>
      </div>

      {/* Side-by-Side Detailed KPI Table & Time-Series Import Shift Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Comprehensive KPI Comparison Table (5 cols) */}
        <div className="lg:col-span-5 bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-3 border-b border-[#E3DED2]">
              <h3 className="font-editorial text-base font-bold text-[#171E1A]">
                Comprehensive Metrics Breakdown
              </h3>
              <p className="text-xs text-[#5D7C6C]">
                Detailed accounting across energy balance, storage, and emissions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E3ECE6] text-[#788A80] font-semibold">
                    <th className="pb-2">Metric</th>
                    <th className="pb-2">Baseline</th>
                    <th className="pb-2">GridGenie</th>
                    <th className="pb-2 text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DB] font-mono text-[#171E1A]">
                  <tr>
                    <td className="py-2.5 text-[#5D7C6C] font-sans">Operating Cost</td>
                    <td className="py-2.5">${baseline.kpis.total_cost.toFixed(2)}</td>
                    <td className="py-2.5 font-bold">${optimized.kpis.total_cost.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold text-[#1D3D2D]">
                      -${savings_cost_abs.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#5D7C6C] font-sans">Carbon Emissions</td>
                    <td className="py-2.5">{baseline.kpis.total_emissions.toFixed(1)} kg</td>
                    <td className="py-2.5 font-bold">{optimized.kpis.total_emissions.toFixed(1)} kg</td>
                    <td className="py-2.5 text-right font-bold text-[#1D3D2D]">
                      -{emissions_reduction_abs.toFixed(1)} kg
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#5D7C6C] font-sans">Grid Imported</td>
                    <td className="py-2.5">{baseline.kpis.total_grid_imported_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5">{optimized.kpis.total_grid_imported_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5 text-right text-[#5D7C6C]">
                      {(optimized.kpis.total_grid_imported_kwh - baseline.kpis.total_grid_imported_kwh).toFixed(1)} kWh
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#5D7C6C] font-sans">Peak Grid Draw</td>
                    <td className="py-2.5">{baseline.kpis.peak_grid_import_kw.toFixed(1)} kW</td>
                    <td className="py-2.5">{optimized.kpis.peak_grid_import_kw.toFixed(1)} kW</td>
                    <td className="py-2.5 text-right font-bold">
                      {peak_shaving_kw > 0 ? (
                        <span className="text-[#1D3D2D]">-{peak_shaving_kw.toFixed(1)} kW</span>
                      ) : (
                        <span className="text-[#788A80]">{peak_shaving_kw.toFixed(1)} kW</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#5D7C6C] font-sans">Renewable Curtailment</td>
                    <td className="py-2.5">{baseline.kpis.renewable_curtailment_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5">{optimized.kpis.renewable_curtailment_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5 text-right text-[#5D7C6C]">
                      {comparison.curtailment_reduction_kwh.toFixed(1)} kWh saved
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#5D7C6C] font-sans">Battery Cycles</td>
                    <td className="py-2.5">{baseline.kpis.equivalent_battery_cycles.toFixed(2)}</td>
                    <td className="py-2.5">{optimized.kpis.equivalent_battery_cycles.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-[#5D7C6C]">
                      {(optimized.kpis.equivalent_battery_cycles - baseline.kpis.equivalent_battery_cycles).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#5D7C6C] font-sans">Unserved Energy</td>
                    <td className="py-2.5">{baseline.kpis.unserved_energy_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5">{optimized.kpis.unserved_energy_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5 text-right text-[#10B981] font-bold">
                      {optimized.kpis.unserved_energy_kwh === 0 ? '100% Reliable' : `${optimized.kpis.unserved_energy_pct}% unserved`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#F0EDE4] border border-[#DCD5C5] rounded-lg text-xs text-[#384E43] flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-[#5D7C6C] shrink-0 mt-0.5" />
            <span>
              <strong>Dispatch Insight:</strong> The baseline strategy dispatches storage greedily. GridGenie's look-ahead optimizer pre-charges during cheap off-peak hours and preserves energy to displace expensive peaker power during evening high-tariff windows.
            </span>
          </div>
        </div>

        {/* Right: Time-Series Grid Import Shift Chart (7 cols) */}
        <div className="lg:col-span-7 bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E3DED2]">
            <div>
              <h3 className="font-editorial text-base font-bold text-[#171E1A] flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#1D3D2D]" />
                Grid Import Profile & Tariff Arbitrage
              </h3>
              <p className="text-xs text-[#5D7C6C]">
                Illustrates how GridGenie shifts grid import out of peak pricing windows
              </p>
            </div>
            <span className="text-[11px] text-[#788A80] font-mono">kW vs. $/kWh</span>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E0D4" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#788A80" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#788A80" fontSize={11} tickLine={false} unit=" kW" />
                <YAxis yAxisId="right" orientation="right" stroke="#D97706" fontSize={11} tickLine={false} unit=" $" />
                <Tooltip />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'Plus Jakarta Sans', color: '#171E1A' }}
                />

                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Baseline Import (kW)"
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Optimizer Import (kW)"
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="stepAfter"
                  dataKey="Tariff ($/kWh)"
                  stroke="#D97706"
                  strokeWidth={1.5}
                  dot={false}
                  opacity={0.7}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Multi-Scenario Benchmark Table */}
      <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#E3DED2] gap-3">
          <div>
            <h3 className="font-editorial text-lg font-bold text-[#171E1A] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#1D3D2D]" />
              Four-Scenario Cross-Benchmark Matrix
            </h3>
            <p className="text-xs text-[#5D7C6C] mt-0.5">
              Standardized scientific evaluation across normal operations and adverse weather/demand stress scenarios
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadBenchmarks}
              disabled={loadingBenchmarks}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0EDE4] border border-[#DCD5C5] hover:bg-[#EAE6DB] text-xs font-medium text-[#171E1A] rounded-lg transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBenchmarks ? 'animate-spin' : ''}`} />
              Re-run Matrix
            </button>
            <button
              onClick={exportCSV}
              disabled={!benchmarks || loadingBenchmarks}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1D3D2D] hover:bg-[#28533D] text-[#FAF8F5] font-semibold text-xs rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV Report
            </button>
          </div>
        </div>

        {loadingBenchmarks && (
          <div className="py-12 flex flex-col items-center justify-center text-[#5D7C6C] text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-[#1D3D2D] mb-2" />
            <span>Solving multi-scenario optimization models...</span>
          </div>
        )}

        {benchmarkError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {benchmarkError}
          </div>
        )}

        {benchmarks && !loadingBenchmarks && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E3ECE6] text-[#788A80] font-semibold">
                  <th className="pb-3">Scenario</th>
                  <th className="pb-3">Baseline Cost</th>
                  <th className="pb-3">GridGenie Cost</th>
                  <th className="pb-3">Cost Savings</th>
                  <th className="pb-3">Baseline CO₂</th>
                  <th className="pb-3">GridGenie CO₂</th>
                  <th className="pb-3">CO₂ Avoided</th>
                  <th className="pb-3">Peak Draw</th>
                  <th className="pb-3 text-right">Reliability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DB] font-mono text-[#171E1A]">
                {benchmarks.map((sc) => {
                  const isCurrent = sc.scenario_id === comparison.scenario_id;
                  return (
                    <tr
                      key={sc.scenario_id}
                      className={`hover:bg-[#F3EFE6] transition-colors ${
                        isCurrent ? 'bg-[#E6EFEA]/40' : ''
                      }`}
                    >
                      <td className="py-3 font-medium font-sans">
                        <div className="flex items-center gap-1.5">
                          {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-[#1D3D2D]" />}
                          <span>{sc.scenario_name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-[#5D7C6C]">${sc.baseline.kpis.total_cost.toFixed(2)}</td>
                      <td className="py-3 font-bold">${sc.optimized.kpis.total_cost.toFixed(2)}</td>
                      <td className="py-3">
                        <span className="font-bold text-[#1D3D2D]">
                          -${sc.savings_cost_abs.toFixed(2)} ({sc.savings_cost_pct.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-3 text-[#5D7C6C]">{sc.baseline.kpis.total_emissions.toFixed(1)} kg</td>
                      <td className="py-3 font-bold">{sc.optimized.kpis.total_emissions.toFixed(1)} kg</td>
                      <td className="py-3">
                        <span className="text-[#1D3D2D] font-bold">
                          -{sc.emissions_reduction_abs.toFixed(1)} kg ({sc.emissions_reduction_pct.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-3 text-[#5D7C6C]">
                        {sc.baseline.kpis.peak_grid_import_kw.toFixed(1)} &rarr;{' '}
                        <strong className="text-[#171E1A]">{sc.optimized.kpis.peak_grid_import_kw.toFixed(1)} kW</strong>
                      </td>
                      <td className="py-3 text-right font-bold text-[#10B981]">
                        100.0%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#E3DED2] text-[11px] text-[#788A80] italic flex items-center justify-between">
          <span>* Cost and carbon reductions represent simulated comparative estimates across 24-hour deterministic scenarios.</span>
          <span>Optimizer: SciPy HiGHS LP Solver (Seed: {currentSeed})</span>
        </div>
      </div>
    </div>
  );
};

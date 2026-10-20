import React, { useState, useEffect } from 'react';
import { BenchmarkTableResponse, ComparisonResult } from '../types/api';
import { fetchBenchmarks } from '../api/client';
import { FlaskConical, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface BenchmarkLabProps {
  currentSeed: number;
  onSelectScenario: (scenarioId: string) => void;
}

export const BenchmarkLab: React.FC<BenchmarkLabProps> = ({
  currentSeed,
  onSelectScenario,
}) => {
  const [benchmarks, setBenchmarks] = useState<ComparisonResult[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadBenchmarks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBenchmarks(currentSeed);
      setBenchmarks(data.scenarios);
    } catch (err: any) {
      setError(err.message || 'Failed to execute multi-scenario benchmark');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBenchmarks();
  }, [currentSeed]);

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
      'Peak Shaving (kW)',
      'Baseline Unserved (kWh)',
      'Optimizer Unserved (kWh)',
      'Baseline Curtailment (kWh)',
      'Optimizer Curtailment (kWh)',
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
      sc.peak_shaving_kw.toFixed(1),
      sc.baseline.kpis.unserved_energy_kwh.toFixed(2),
      sc.optimized.kpis.unserved_energy_kwh.toFixed(2),
      sc.baseline.kpis.renewable_curtailment_kwh.toFixed(2),
      sc.optimized.kpis.renewable_curtailment_kwh.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridgenie_ieee_benchmark_report_seed${currentSeed}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#1A263D] gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-[#00E599]" />
            Multi-Scenario Benchmark Laboratory
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Comprehensive cross-scenario comparative performance evaluation for IEEE judges
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadBenchmarks}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141D30] border border-[#1A263D] hover:border-[#2A3B5C] text-xs font-mono text-[#CBD5E1] rounded transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-run All
          </button>
          <button
            onClick={exportCSV}
            disabled={!benchmarks || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00E599]/15 border border-[#00E599]/40 hover:bg-[#00E599]/25 text-xs font-mono font-semibold text-[#00E599] rounded transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV Report
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-[#94A3B8] font-mono text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-[#00E599] mb-2" />
          <span>Solving multi-scenario linear programming models...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-mono">
          Error executing benchmarks: {error}
        </div>
      )}

      {!loading && benchmarks && (
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
                <th className="py-2.5 px-3">Peak Import</th>
                <th className="py-2.5 px-3">Reliability</th>
                <th className="py-2.5 px-3 text-right">Action</th>
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
                  <td className="py-3 px-3">
                    <span className="text-white">{sc.optimized.kpis.peak_grid_import_kw.toFixed(1)} kW</span>
                    <span className="text-[10px] text-[#64748B] block">Base: {sc.baseline.kpis.peak_grid_import_kw.toFixed(1)} kW</span>
                  </td>
                  <td className="py-3 px-3">
                    {sc.optimized.kpis.unserved_energy_kwh === 0 ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> 100% Served
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> {sc.optimized.kpis.unserved_energy_kwh.toFixed(1)} kWh unserved
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectScenario(sc.scenario_id)}
                      className="px-2.5 py-1 bg-[#141D30] hover:bg-[#1A263D] border border-[#1A263D] hover:border-[#00E599] text-[#00E599] rounded text-[11px] font-mono transition"
                    >
                      Load in Twin &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

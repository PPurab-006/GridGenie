import React, { useState, useEffect, useRef } from 'react';
import {
  MicrogridConfig,
  ScenarioId,
  ScenarioSummary,
  ComparisonResult,
  ForecastEvaluation,
} from './types/api';
import { fetchHealth, fetchScenarios, fetchCompare, fetchForecasts } from './api/client';
import { Navbar } from './components/Navbar';
import { OverviewCards } from './components/OverviewCards';
import { DigitalTwin } from './components/DigitalTwin';
import { ForecastAndDispatchCharts } from './components/ForecastAndDispatchCharts';
import { StrategyComparison } from './components/StrategyComparison';
import { DispatchInspector } from './components/DispatchInspector';
import { BenchmarkLab } from './components/BenchmarkLab';
import { ScenarioControls } from './components/ScenarioControls';
import { Cpu, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  // Configuration State
  const [config, setConfig] = useState<MicrogridConfig>({
    scenario_id: 'normal_day',
    battery: {
      capacity_kwh: 100.0,
      max_charge_kw: 40.0,
      max_discharge_kw: 40.0,
      charge_efficiency: 0.95,
      discharge_efficiency: 0.95,
      min_soc: 0.15,
      max_soc: 0.95,
      initial_soc: 0.40,
      degradation_cost_per_kwh: 0.015,
    },
    grid: {
      max_import_kw: 150.0,
      max_export_kw: 50.0,
      export_rate_factor: 0.50,
    },
    optimization: {
      carbon_weight: 0.0,
      unserved_energy_penalty: 50.0,
    },
    solar_capacity_kw: 80.0,
    wind_capacity_kw: 50.0,
    random_seed: 42,
  });

  // Data States
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [forecasts, setForecasts] = useState<Record<string, ForecastEvaluation> | undefined>();
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Time-stepped Simulation Playback State
  const [currentHour, setCurrentHour] = useState<number>(12); // Default to midday
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Load scenarios on mount
  useEffect(() => {
    async function init() {
      try {
        const health = await fetchHealth();
        if (health.status === 'healthy') setBackendOnline(true);
        const scList = await fetchScenarios();
        setScenarios(scList);
      } catch (err: any) {
        console.warn('Backend initial connection failed:', err);
        setBackendOnline(false);
      }
    }
    init();
  }, []);

  // Fetch optimization and forecasts whenever config changes or explicitly triggered
  const runSimulation = async (customConfig?: MicrogridConfig) => {
    const activeConfig = customConfig || config;
    setLoading(true);
    setError(null);
    try {
      const [compRes, fcRes] = await Promise.all([
        fetchCompare(activeConfig),
        fetchForecasts(activeConfig),
      ]);
      setComparison(compRes);
      setForecasts(fcRes);
      setBackendOnline(true);
    } catch (err: any) {
      console.error('Simulation error:', err);
      setError(err.message || 'Error executing microgrid optimization');
    } finally {
      setLoading(false);
    }
  };

  // Run on mount and scenario change
  useEffect(() => {
    runSimulation(config);
  }, [config.scenario_id]);

  // Handle Playback Loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentHour((prev) => (prev + 1) % 24);
      }, 1400);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleScenarioChange = (scenarioId: ScenarioId) => {
    setConfig((prev) => ({
      ...prev,
      scenario_id: scenarioId,
    }));
  };

  const handleBenchmarkSelectScenario = (scenarioId: string) => {
    handleScenarioChange(scenarioId as ScenarioId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentOptStep = comparison?.optimized.steps[currentHour] || comparison?.optimized.steps[0];
  const currentBaseStep = comparison?.baseline.steps[currentHour] || comparison?.baseline.steps[0];

  return (
    <div className="min-h-screen bg-[#080C14] text-[#F1F5F9] flex flex-col font-sans">
      {/* 1. Global Navigation & Playback Controls */}
      <Navbar
        currentHour={currentHour}
        onHourChange={setCurrentHour}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        selectedScenario={config.scenario_id}
        scenarios={scenarios}
        onScenarioChange={handleScenarioChange}
        backendOnline={backendOnline}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {/* Error notification banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between text-xs text-red-400 font-mono">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => runSimulation()}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-200 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. Overview KPI Cards */}
        {comparison && currentOptStep && currentBaseStep && (
          <OverviewCards
            comparison={comparison}
            currentStep={currentOptStep}
            baselineStep={currentBaseStep}
          />
        )}

        {/* 3. Microgrid Digital Twin SVG Single-Line Diagram */}
        {comparison && currentOptStep && (
          <DigitalTwin
            step={currentOptStep}
            batteryCapacity={config.battery.capacity_kwh}
          />
        )}

        {/* 4. Scenario Parameters & Objective Controls Studio */}
        <ScenarioControls
          config={config}
          onChangeConfig={setConfig}
          onRunOptimization={() => runSimulation()}
          loading={loading}
        />

        {/* 5. Forecast & Optimal Dispatch Charts */}
        {comparison && (
          <ForecastAndDispatchCharts
            steps={comparison.optimized.steps}
            currentHour={currentHour}
            onHourClick={setCurrentHour}
            forecasts={forecasts}
            batteryConfig={config.battery}
          />
        )}

        {/* 6. Baseline vs. Look-Ahead LP Strategy Comparison */}
        {comparison && (
          <StrategyComparison
            comparison={comparison}
            currentHour={currentHour}
          />
        )}

        {/* 7. Hourly Dispatch Inspector & Decision Audit Log */}
        {comparison && (
          <DispatchInspector
            comparison={comparison}
            selectedHour={currentHour}
            onSelectHour={setCurrentHour}
          />
        )}

        {/* 8. Multi-Scenario Benchmark Laboratory */}
        <BenchmarkLab
          currentSeed={config.random_seed}
          onSelectScenario={handleBenchmarkSelectScenario}
        />
      </main>

      {/* 9. Technical Footer */}
      <footer className="border-t border-[#1A263D] bg-[#0A0F1D] py-6 px-4 lg:px-8 mt-12 text-xs font-mono text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-[#00E599]/10 border border-[#00E599]/30 flex items-center justify-center text-[#00E599]">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <span>
              GridMind Digital Twin &bull; IEEE ClimateChain Global Hackathon Submission
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#94A3B8]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00E599]" />
              Physical Conservation Enforced
            </span>
            <span>&bull;</span>
            <span>HiGHS LP Solver</span>
            <span>&bull;</span>
            <span>Scikit-Learn ML Forecaster</span>
            <span>&bull;</span>
            <span className="text-[#64748B]">Deterministic Simulation Only</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

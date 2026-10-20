import React, { useState, useEffect, useRef } from 'react';
import {
  MicrogridConfig,
  ScenarioSummary,
  ComparisonResult,
  ForecastEvaluation,
  ScenarioId,
} from './types/api';
import { fetchHealth, fetchScenarios, fetchCompare, fetchForecasts } from './api/client';
import { Navbar, ActiveView } from './components/Navbar';
import { LiveOperationsView } from './views/LiveOperationsView';
import { PerformanceLabView } from './views/PerformanceLabView';
import { ForecastModelView } from './views/ForecastModelView';
import { ParameterDrawer } from './components/ParameterDrawer';
import { Globe2, ShieldCheck, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & Modal State
  const [activeView, setActiveView] = useState<ActiveView>('operations');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Microgrid Configuration State
  const [config, setConfig] = useState<MicrogridConfig>({
    scenario_id: 'normal_day',
    battery: {
      capacity_kwh: 100.0,
      max_charge_kw: 40.0,
      max_discharge_kw: 40.0,
      charge_efficiency: 0.95,
      discharge_efficiency: 0.95,
      min_soc: 0.2,
      max_soc: 0.9,
      initial_soc: 0.5,
      degradation_cost_per_kwh: 0.015,
    },
    grid: {
      max_import_kw: 150.0,
      max_export_kw: 50.0,
      export_rate_factor: 0.6,
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

  // Simulation Clock Playback State
  const [currentHour, setCurrentHour] = useState<number>(12); // Default to midday
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Initialize: load scenarios on mount
  useEffect(() => {
    async function init() {
      try {
        const health = await fetchHealth();
        if (health.status === 'healthy') setBackendOnline(true);
        const scList = await fetchScenarios();
        setScenarios(scList);
      } catch (err: any) {
        console.warn('Backend connection warning:', err);
        setBackendOnline(false);
      }
    }
    init();
  }, []);

  // Fetch optimization comparison and forecasts
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
      setError(err.message || 'Error executing microgrid simulation');
    } finally {
      setLoading(false);
    }
  };

  // Re-run whenever scenario changes
  useEffect(() => {
    runSimulation(config);
  }, [config.scenario_id]);

  // Simulation Playback Timer (1.4s per hour)
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
    setConfig((prev) => ({ ...prev, scenario_id: scenarioId }));
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#171E1A] flex flex-col font-sans selection:bg-[#E6EFEA] selection:text-[#1D3D2D]">
      {/* 1. Global Navigation Bar */}
      <Navbar
        activeView={activeView}
        onViewChange={setActiveView}
        currentHour={currentHour}
        onHourChange={setCurrentHour}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        selectedScenario={config.scenario_id}
        scenarios={scenarios}
        onScenarioChange={handleScenarioChange}
        backendOnline={backendOnline}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Microgrid Parameter Drawer (Modal) */}
      <ParameterDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onChangeConfig={setConfig}
        onRunOptimization={() => runSimulation()}
        loading={loading}
      />

      {/* 3. Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {/* Error notification banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => runSimulation()}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded text-rose-900 transition font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* View 1: Live Operations */}
        {activeView === 'operations' && comparison && (
          <LiveOperationsView
            comparison={comparison}
            currentHour={currentHour}
            onHourClick={setCurrentHour}
            config={config}
          />
        )}

        {/* View 2: Performance Lab */}
        {activeView === 'performance' && comparison && (
          <PerformanceLabView
            comparison={comparison}
            selectedScenario={config.scenario_id}
            scenarios={scenarios}
            onScenarioChange={handleScenarioChange}
            currentSeed={config.random_seed}
          />
        )}

        {/* View 3: Forecast & Model */}
        {activeView === 'forecast' && (
          <ForecastModelView
            forecasts={forecasts}
            selectedScenario={config.scenario_id}
            scenarios={scenarios}
          />
        )}
      </main>

      {/* 4. Technical Telemetry Footer */}
      <footer className="border-t border-[#E3DED2] bg-[#FAF8F5] py-5 px-4 lg:px-8 mt-12 text-xs text-[#5D7C6C]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded bg-[#1D3D2D] text-[#FAF8F5] flex items-center justify-center">
              <Globe2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium text-[#171E1A]">
              GridMind V3 &bull; IEEE ClimateChain Global Hackathon Submission
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-[#4A5B52]">
            <span className="flex items-center gap-1 text-[#1D3D2D] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> Two-Stage Physical Optimization
            </span>
            <span>&bull;</span>
            <span>Interactive 3D Digital Twin</span>
            <span>&bull;</span>
            <span>SciPy HiGHS LP Solver</span>
            <span>&bull;</span>
            <span>scikit-learn Ridge Forecaster</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

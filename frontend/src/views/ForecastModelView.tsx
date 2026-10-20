import React from 'react';
import { ForecastEvaluation, ScenarioSummary, ScenarioId } from '../types/api';
import {
  Brain,
  Cpu,
  Info,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Wind,
  Building2,
  ShieldCheck,
  TrendingUp,
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

interface ForecastModelViewProps {
  forecasts?: Record<string, ForecastEvaluation>;
  selectedScenario: ScenarioId;
  scenarios: ScenarioSummary[];
}

export const ForecastModelView: React.FC<ForecastModelViewProps> = ({
  forecasts,
  selectedScenario,
  scenarios,
}) => {
  const currentScenarioMeta = scenarios.find((s) => s.id === selectedScenario);

  // Prepare chart data for Demand, Solar, Wind
  const demandData =
    forecasts?.demand?.points.map((p) => ({
      timestamp: p.timestamp,
      'Realized Demand (Actual)': p.actual,
      'Day-Ahead Forecast (Decision Time)': p.forecast,
    })) || [];

  const solarData =
    forecasts?.solar?.points.map((p) => ({
      timestamp: p.timestamp,
      'Realized Solar (Actual)': p.actual,
      'Day-Ahead Forecast (Decision Time)': p.forecast,
    })) || [];

  const windData =
    forecasts?.wind?.points.map((p) => ({
      timestamp: p.timestamp,
      'Realized Wind (Actual)': p.actual,
      'Day-Ahead Forecast (Decision Time)': p.forecast,
    })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E6EFEA] border border-[#CCDCD2] text-xs font-semibold text-[#1D3D2D] mb-1.5">
            <Brain className="w-3.5 h-3.5 text-[#28533D]" />
            Machine Learning Intelligence Audit
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#171E1A] tracking-tight">
            Forecasting Engine & Optimizer Architecture
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5B52] mt-0.5">
            Full scientific disclosure of what the ML model predicts, how the LP optimizer acts, and
            provenance of training data.
          </p>
        </div>
        <div className="text-xs px-3.5 py-2 bg-[#F0EDE4] border border-[#DCD5C5] rounded-lg text-[#171E1A] shrink-0">
          <span className="text-[#788A80] block text-[10px] uppercase font-semibold">Active Scenario</span>
          <span className="font-semibold text-sm">{currentScenarioMeta?.name || selectedScenario}</span>
        </div>
      </div>

      {/* Model Performance Scorecards (Ridge vs Persistence Baseline) */}
      {forecasts && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Demand Scorecard */}
          <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm hover:border-[#1D3D2D] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase text-amber-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-700" /> Facility Demand Model
              </span>
              <span className="text-[11px] text-[#788A80] font-mono">24h Horizon</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#E3DED2]">
                <span className="text-[10px] uppercase text-[#788A80] block font-semibold">
                  Ridge MAE
                </span>
                <span className="text-xl font-bold font-mono text-[#171E1A] mt-0.5 block">
                  {forecasts.demand.metric_mae} <span className="text-xs font-normal">kW</span>
                </span>
              </div>
              <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#E3DED2]">
                <span className="text-[10px] uppercase text-[#788A80] block font-semibold">
                  Ridge RMSE
                </span>
                <span className="text-xl font-bold font-mono text-[#171E1A] mt-0.5 block">
                  {forecasts.demand.metric_rmse} <span className="text-xs font-normal">kW</span>
                </span>
              </div>
            </div>
            <div className="text-xs text-[#5D7C6C] pt-2 border-t border-[#E3ECE6] flex justify-between font-mono">
              <span>Persistence Baseline:</span>
              <span className="text-[#171E1A] font-semibold">
                MAE {forecasts.demand.baseline_mae} kW
              </span>
            </div>
          </div>

          {/* Solar Scorecard */}
          <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm hover:border-[#1D3D2D] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase text-amber-800 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-700" /> Solar PV Model
              </span>
              <span className="text-[11px] text-[#788A80] font-mono">24h Horizon</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#E3DED2]">
                <span className="text-[10px] uppercase text-[#788A80] block font-semibold">
                  Ridge MAE
                </span>
                <span className="text-xl font-bold font-mono text-[#171E1A] mt-0.5 block">
                  {forecasts.solar.metric_mae} <span className="text-xs font-normal">kW</span>
                </span>
              </div>
              <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#E3DED2]">
                <span className="text-[10px] uppercase text-[#788A80] block font-semibold">
                  Ridge RMSE
                </span>
                <span className="text-xl font-bold font-mono text-[#171E1A] mt-0.5 block">
                  {forecasts.solar.metric_rmse} <span className="text-xs font-normal">kW</span>
                </span>
              </div>
            </div>
            <div className="text-xs text-[#5D7C6C] pt-2 border-t border-[#E3ECE6] flex justify-between font-mono">
              <span>Persistence Baseline:</span>
              <span className="text-[#171E1A] font-semibold">
                MAE {forecasts.solar.baseline_mae} kW
              </span>
            </div>
          </div>

          {/* Wind Scorecard */}
          <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm hover:border-[#1D3D2D] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase text-cyan-800 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-cyan-700" /> Wind Turbine Model
              </span>
              <span className="text-[11px] text-[#788A80] font-mono">24h Horizon</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#E3DED2]">
                <span className="text-[10px] uppercase text-[#788A80] block font-semibold">
                  Ridge MAE
                </span>
                <span className="text-xl font-bold font-mono text-[#171E1A] mt-0.5 block">
                  {forecasts.wind.metric_mae} <span className="text-xs font-normal">kW</span>
                </span>
              </div>
              <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#E3DED2]">
                <span className="text-[10px] uppercase text-[#788A80] block font-semibold">
                  Ridge RMSE
                </span>
                <span className="text-xl font-bold font-mono text-[#171E1A] mt-0.5 block">
                  {forecasts.wind.metric_rmse} <span className="text-xs font-normal">kW</span>
                </span>
              </div>
            </div>
            <div className="text-xs text-[#5D7C6C] pt-2 border-t border-[#E3ECE6] flex justify-between font-mono">
              <span>Persistence Baseline:</span>
              <span className="text-[#171E1A] font-semibold">
                MAE {forecasts.wind.baseline_mae} kW
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3 Separate Visual Forecast Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Demand Forecast vs Realized */}
        <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm">
          <div className="pb-3 mb-3 border-b border-[#E3DED2]">
            <h3 className="font-editorial text-base font-bold text-[#171E1A] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-700" /> Demand: Forecast vs. Actual
            </h3>
            <p className="text-xs text-[#5D7C6C]">Facility active electrical load profile</p>
          </div>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E0D4" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#788A80" fontSize={10} tickLine={false} />
                <YAxis stroke="#788A80" fontSize={10} tickLine={false} unit=" kW" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'Plus Jakarta Sans' }} />
                <Line
                  type="monotone"
                  dataKey="Realized Demand (Actual)"
                  stroke="#171E1A"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Day-Ahead Forecast (Decision Time)"
                  stroke="#D97706"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Solar Forecast vs Realized */}
        <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm">
          <div className="pb-3 mb-3 border-b border-[#E3DED2]">
            <h3 className="font-editorial text-base font-bold text-[#171E1A] flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-700" /> Solar: Forecast vs. Actual
            </h3>
            <p className="text-xs text-[#5D7C6C]">Solar PV diurnal generation profile</p>
          </div>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={solarData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E0D4" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#788A80" fontSize={10} tickLine={false} />
                <YAxis stroke="#788A80" fontSize={10} tickLine={false} unit=" kW" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'Plus Jakarta Sans' }} />
                <Line
                  type="monotone"
                  dataKey="Realized Solar (Actual)"
                  stroke="#171E1A"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Day-Ahead Forecast (Decision Time)"
                  stroke="#D97706"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Wind Forecast vs Realized */}
        <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-5 shadow-sm">
          <div className="pb-3 mb-3 border-b border-[#E3DED2]">
            <h3 className="font-editorial text-base font-bold text-[#171E1A] flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-cyan-700" /> Wind: Forecast vs. Actual
            </h3>
            <p className="text-xs text-[#5D7C6C]">Wind turbine generation profile</p>
          </div>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={windData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E0D4" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#788A80" fontSize={10} tickLine={false} />
                <YAxis stroke="#788A80" fontSize={10} tickLine={false} unit=" kW" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'Plus Jakarta Sans' }} />
                <Line
                  type="monotone"
                  dataKey="Realized Wind (Actual)"
                  stroke="#171E1A"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Day-Ahead Forecast (Decision Time)"
                  stroke="#0284C7"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Transparency Cards: Machine Learning Model Card vs Optimization Solver Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Machine Learning Model Card */}
        <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E3DED2]">
            <Brain className="w-5 h-5 text-[#1D3D2D]" />
            <h3 className="font-editorial text-lg font-bold text-[#171E1A]">
              Forecasting Model Card: Ridge Regression
            </h3>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-[#384E43]">
            <div className="grid grid-cols-2 gap-2 bg-[#FFFFFF] p-3 rounded-lg border border-[#E3DED2]">
              <div>
                <span className="text-[#788A80] uppercase text-[10px] font-semibold block">Estimator</span>
                <span className="font-mono font-bold text-[#171E1A]">sklearn.linear_model.Ridge</span>
              </div>
              <div>
                <span className="text-[#788A80] uppercase text-[10px] font-semibold block">Hyperparameters</span>
                <span className="font-mono text-[#171E1A]">alpha=1.0, fit_intercept=True</span>
              </div>
              <div>
                <span className="text-[#788A80] uppercase text-[10px] font-semibold block">Features</span>
                <span className="font-mono text-[#171E1A]">sin/cos hour, solar envelope, lag y[t-24]</span>
              </div>
              <div>
                <span className="text-[#788A80] uppercase text-[10px] font-semibold block">Training Horizon</span>
                <span className="font-mono text-[#171E1A]">168 hours (7 days rolling)</span>
              </div>
            </div>

            <div className="p-3 bg-[#E6EFEA] border border-[#CCDCD2] rounded-lg text-xs text-[#1D3D2D]">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#1D3D2D]" />
                Zero Look-Ahead Leakage
              </div>
              <p>
                All input features are strictly known at decision time (t = 0). No future target
                information or realization labels leak into the feature matrix.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Scientific Data Provenance Disclosure
              </div>
              <p>
                Training data are <strong>100% synthetic</strong>, produced deterministically by the
                microgrid physics equations. Performance metrics should be interpreted as demonstrating
                the mathematical pipeline rather than empirical field utility accuracy.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Mathematical Optimization Architecture Card */}
        <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E3DED2]">
            <Cpu className="w-5 h-5 text-[#1D3D2D]" />
            <h3 className="font-editorial text-lg font-bold text-[#171E1A]">
              Dispatch Optimization: SciPy HiGHS Solver
            </h3>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-[#384E43]">
            <div className="grid grid-cols-2 gap-2 bg-[#FFFFFF] p-3 rounded-lg border border-[#E3DED2]">
              <div>
                <span className="text-[#788A80] uppercase text-[10px] font-semibold block">Solver Type</span>
                <span className="font-mono font-bold text-[#171E1A]">Linear Program (HiGHS Simplex)</span>
              </div>
              <div>
                <span className="text-[#788A80] uppercase text-[10px] font-semibold block">Decision Variables</span>
                <span className="font-mono text-[#171E1A]">168 continuous variables (24h horizon)</span>
              </div>
              <div>
                <span className="text-[#788A80] uppercase text-[10px] font-semibold block">Primary Objective</span>
                <span className="font-mono text-[#171E1A]">Min OpCost + Degradation + Penalty</span>
              </div>
              <div>
                <span className="text-[#788A80] uppercase text-[10px] font-semibold block">Real-Time Balancing</span>
                <span className="font-mono text-[#171E1A]">Governor reserve + grid balance</span>
              </div>
            </div>

            <div className="p-3 bg-[#E6EFEA] border border-[#CCDCD2] rounded-lg text-xs text-[#1D3D2D]">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-[#1D3D2D]" />
                Two-Stage Decision Formulation
              </div>
              <p>
                <strong>Stage 1 (Day-Ahead):</strong> Solves the 24-hour commitment plan on ML forecasts.<br />
                <strong>Stage 2 (Real-Time):</strong> Dispatches against realized scenario actuals, using battery reserve and grid support to absorb forecast error while strictly honoring physical limits.
              </p>
            </div>

            <div className="p-3 bg-[#F0EDE4] border border-[#DCD5C5] rounded-lg text-xs text-[#384E43]">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Info className="w-4 h-4 text-[#5D7C6C]" />
                Hard Physical Constraints Enforced
              </div>
              <p>
                Strict nodal power balance &bull; Battery SoC bounds [20%, 90%] &bull; C-rate charging/discharging power limits (25 kW) &bull; Terminal SoC target (&ge; 50%) &bull; Non-simultaneous charge/discharge &bull; Explicit unserved load accounting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

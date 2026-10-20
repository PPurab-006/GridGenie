import React from 'react';
import { ForecastEvaluation, ScenarioSummary, ScenarioId } from '../types/api';
import {
  Brain,
  Cpu,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Wind,
  Building2,
  ShieldCheck,
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
  const demandData = forecasts?.demand?.points.map((p) => ({
    timestamp: p.timestamp,
    'Realized Demand (Actual)': p.actual,
    'Day-Ahead Forecast (Decision Time)': p.forecast,
  })) || [];

  const solarData = forecasts?.solar?.points.map((p) => ({
    timestamp: p.timestamp,
    'Realized Solar (Actual)': p.actual,
    'Day-Ahead Forecast (Decision Time)': p.forecast,
  })) || [];

  const windData = forecasts?.wind?.points.map((p) => ({
    timestamp: p.timestamp,
    'Realized Wind (Actual)': p.actual,
    'Day-Ahead Forecast (Decision Time)': p.forecast,
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#00D8F6]" />
            Forecasting Engine & Model Audit Laboratory
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Transparent evaluation of the scikit-learn day-ahead forecaster and SciPy HiGHS LP optimizer
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1.5 bg-[#141D30] border border-[#1A263D] rounded-lg text-[#CBD5E1]">
          Scenario: <strong className="text-white">{currentScenarioMeta?.name || selectedScenario}</strong>
        </div>
      </div>

      {/* Model Performance Scorecards (Ridge vs Persistence Baseline) */}
      {forecasts && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Demand Scorecard */}
          <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> Electrical Demand Model
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">24h Horizon</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="p-2.5 bg-[#141D30] rounded-lg border border-[#1A263D]">
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Ridge MAE</span>
                <span className="text-lg font-bold font-mono text-white">{forecasts.demand.metric_mae} kW</span>
              </div>
              <div className="p-2.5 bg-[#141D30] rounded-lg border border-[#1A263D]">
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Ridge RMSE</span>
                <span className="text-lg font-bold font-mono text-white">{forecasts.demand.metric_rmse} kW</span>
              </div>
            </div>
            <div className="text-[11px] font-mono text-[#94A3B8] flex justify-between pt-2 border-t border-[#1A263D]">
              <span>Persistence Baseline:</span>
              <span className="text-white font-medium">MAE {forecasts.demand.baseline_mae} kW / RMSE {forecasts.demand.baseline_rmse} kW</span>
            </div>
          </div>

          {/* Solar Scorecard */}
          <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <Sun className="w-4 h-4" /> Solar PV Forecaster
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">24h Horizon</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="p-2.5 bg-[#141D30] rounded-lg border border-[#1A263D]">
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Ridge MAE</span>
                <span className="text-lg font-bold font-mono text-white">{forecasts.solar.metric_mae} kW</span>
              </div>
              <div className="p-2.5 bg-[#141D30] rounded-lg border border-[#1A263D]">
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Ridge RMSE</span>
                <span className="text-lg font-bold font-mono text-white">{forecasts.solar.metric_rmse} kW</span>
              </div>
            </div>
            <div className="text-[11px] font-mono text-[#94A3B8] flex justify-between pt-2 border-t border-[#1A263D]">
              <span>Persistence Baseline:</span>
              <span className="text-white font-medium">MAE {forecasts.solar.baseline_mae} kW / RMSE {forecasts.solar.baseline_rmse} kW</span>
            </div>
          </div>

          {/* Wind Scorecard */}
          <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-[#00D8F6] flex items-center gap-1.5">
                <Wind className="w-4 h-4" /> Wind Turbine Forecaster
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">24h Horizon</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="p-2.5 bg-[#141D30] rounded-lg border border-[#1A263D]">
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Ridge MAE</span>
                <span className="text-lg font-bold font-mono text-white">{forecasts.wind.metric_mae} kW</span>
              </div>
              <div className="p-2.5 bg-[#141D30] rounded-lg border border-[#1A263D]">
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Ridge RMSE</span>
                <span className="text-lg font-bold font-mono text-white">{forecasts.wind.metric_rmse} kW</span>
              </div>
            </div>
            <div className="text-[11px] font-mono text-[#94A3B8] flex justify-between pt-2 border-t border-[#1A263D]">
              <span>Persistence Baseline:</span>
              <span className="text-white font-medium">MAE {forecasts.wind.baseline_mae} kW / RMSE {forecasts.wind.baseline_rmse} kW</span>
            </div>
          </div>
        </div>
      )}

      {/* 3 Separate Readable Forecast vs Actual Charts */}
      <div className="space-y-5">
        {/* Chart 1: Electrical Demand */}
        <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A263D]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Electrical Demand: Day-Ahead Forecast vs. Realized Load
            </h3>
            <span className="text-[11px] font-mono text-[#94A3B8]">Unit: kW &bull; 24h Horizon</span>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A263D" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                <Line type="monotone" dataKey="Realized Demand (Actual)" stroke="#A78BFA" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Day-Ahead Forecast (Decision Time)" stroke="#DDD6FE" strokeDasharray="4 4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Solar Generation */}
        <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A263D]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              Solar PV Generation: Day-Ahead Forecast vs. Realized Output
            </h3>
            <span className="text-[11px] font-mono text-[#94A3B8]">Unit: kW &bull; 24h Horizon</span>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={solarData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A263D" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                <Line type="monotone" dataKey="Realized Solar (Actual)" stroke="#FBBF24" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Day-Ahead Forecast (Decision Time)" stroke="#FDE68A" strokeDasharray="4 4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Wind Generation */}
        <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A263D]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wind className="w-4 h-4 text-[#00D8F6]" />
              Wind Generation: Day-Ahead Forecast vs. Realized Output
            </h3>
            <span className="text-[11px] font-mono text-[#94A3B8]">Unit: kW &bull; 24h Horizon</span>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={windData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A263D" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                <Line type="monotone" dataKey="Realized Wind (Actual)" stroke="#00D8F6" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Day-Ahead Forecast (Decision Time)" stroke="#A5F3FC" strokeDasharray="4 4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Cards & Architecture Explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ML Model Card */}
        <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#1A263D]">
            <Brain className="w-4 h-4 text-[#00D8F6]" />
            <h3 className="text-sm font-bold text-white">ML Forecaster Model Card</h3>
          </div>
          <div className="space-y-3 text-xs font-mono text-[#CBD5E1]">
            <div>
              <span className="text-[#64748B] block">Estimator:</span>
              <strong className="text-white">scikit-learn Ridge Regression (alpha=1.0)</strong>
            </div>
            <div>
              <span className="text-[#64748B] block">Input Features (6):</span>
              <span className="text-[#94A3B8]">sin(2πh/24), cos(2πh/24), Clear-sky solar geometry envelope, lag-24 demand, lag-24 solar, lag-24 wind.</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Training Data Source:</span>
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded mt-1 text-amber-300">
                ⚠️ <strong>100% Synthetic Simulated Output:</strong> Generated via physical diurnal equations across 7 chronological days (144 training steps). Not utility field meter data.
              </div>
            </div>
            <div>
              <span className="text-[#64748B] block">Chronological Integrity:</span>
              <span className="text-[#00E599]">Strict zero future leakage. Only past historical steps are seen at decision time.</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Known Limitations:</span>
              <span className="text-[#94A3B8]">Linear model cannot predict sudden convective cloud shocks or equipment outages that were unobserved in prior days.</span>
            </div>
          </div>
        </div>

        {/* Optimizer Card */}
        <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#1A263D]">
            <Cpu className="w-4 h-4 text-[#00E599]" />
            <h3 className="text-sm font-bold text-white">SciPy HiGHS Optimizer Architecture</h3>
          </div>
          <div className="space-y-3 text-xs font-mono text-[#CBD5E1]">
            <div>
              <span className="text-[#64748B] block">Mathematical Paradigm:</span>
              <strong className="text-white">Constrained Linear Programming (SciPy linprog / HiGHS Dual Simplex)</strong>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Mathematical optimization engine, NOT a trained machine learning model.</p>
            </div>
            <div>
              <span className="text-[#64748B] block">Decision Horizon:</span>
              <span className="text-[#94A3B8]">168 continuous variables across 24 hours (P_imp, P_exp, P_ch, P_dis, P_curt, P_uns, E_batt).</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Physical Constraints:</span>
              <span className="text-[#94A3B8]">Active power balance, energy conservation, battery SoC [15%, 95%], inverter power ratings (40 kW), 90.25% round-trip efficiency, degradation penalty.</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Two-Stage Forecast Integration:</span>
              <div className="p-2 bg-[#00E599]/10 border border-[#00E599]/20 rounded mt-1 text-[#00E599]">
                ✓ <strong>Stage 1:</strong> Optimizes battery schedule on ML Forecasts.<br />
                ✓ <strong>Stage 2:</strong> Evaluates real-time physical realization on actual weather & load.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

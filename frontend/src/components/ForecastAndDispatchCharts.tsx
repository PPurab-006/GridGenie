import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TimeStepDispatch, ForecastEvaluation, BatteryConfig } from '../types/api';
import { Sparkles, BarChart3, TrendingUp } from 'lucide-react';

interface ForecastAndDispatchChartsProps {
  steps: TimeStepDispatch[];
  currentHour: number;
  onHourClick: (hour: number) => void;
  forecasts?: Record<string, ForecastEvaluation>;
  batteryConfig: BatteryConfig;
}

export const ForecastAndDispatchCharts: React.FC<ForecastAndDispatchChartsProps> = ({
  steps,
  currentHour,
  onHourClick,
  forecasts,
  batteryConfig,
}) => {
  const [showForecastOverlay, setShowForecastOverlay] = useState<boolean>(false);

  // Combine dispatch data with forecast data for aligned plotting
  const chartData = steps.map((s) => {
    const demFc = forecasts?.demand?.points[s.hour]?.forecast;
    const solFc = forecasts?.solar?.points[s.hour]?.forecast;
    const wndFc = forecasts?.wind?.points[s.hour]?.forecast;

    return {
      timestamp: s.timestamp,
      hour: s.hour,
      Demand: s.demand_kw,
      Solar: s.solar_kw,
      Wind: s.wind_kw,
      Renewables: s.solar_kw + s.wind_kw,
      'Forecast Demand': demFc,
      'Forecast Solar': solFc,
      'Forecast Wind': wndFc,
      'Renewables Used': s.renewables_used_kw,
      'Battery Disch': s.battery_discharge_kw,
      'Battery Charge': -s.battery_charge_kw, // negative for visual charging below zero or stacked
      'Grid Import': s.grid_import_kw,
      'Grid Export': s.grid_export_kw,
      'Unserved Demand': s.unserved_demand_kw,
      SoC: Number((s.battery_soc * 100).toFixed(1)),
      Price: s.grid_price,
    };
  });

  const activeTimestamp = `${String(currentHour).padStart(2, '0')}:00`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Chart 1: Generation vs Demand Profile */}
      <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#1A263D] gap-2">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00D8F6]" />
              Demand vs. Renewable Availability
            </h3>
            <p className="text-xs text-[#94A3B8]">
              24-Hour Horizon &bull; Click any point to inspect hour
            </p>
          </div>

          <div className="flex items-center gap-2">
            {forecasts?.demand && (
              <button
                onClick={() => setShowForecastOverlay(!showForecastOverlay)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition border ${
                  showForecastOverlay
                    ? 'bg-[#00D8F6]/20 text-[#00D8F6] border-[#00D8F6]/40 font-semibold'
                    : 'bg-[#141D30] text-[#94A3B8] border-[#1A263D] hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {showForecastOverlay ? 'Hide ML Forecast' : 'Overlay ML Forecast'}
              </button>
            )}
          </div>
        </div>

        {/* Forecast MAE/RMSE pill banner if active */}
        {showForecastOverlay && forecasts && (
          <div className="mb-3 px-3 py-1.5 bg-[#141D30] border border-[#1A263D] rounded flex flex-wrap items-center justify-between text-[11px] font-mono text-[#94A3B8]">
            <span>Model: Ridge Chronological (Zero Leakage)</span>
            <div className="flex gap-3 text-white">
              <span>Dem MAE: <strong className="text-[#00D8F6]">{forecasts.demand.metric_mae} kW</strong></span>
              <span>Sol MAE: <strong className="text-amber-400">{forecasts.solar.metric_mae} kW</strong></span>
              <span>Wnd MAE: <strong className="text-[#00E599]">{forecasts.wind.metric_mae} kW</strong></span>
            </div>
          </div>
        )}

        {/* Recharts Area Container */}
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  onHourClick(e.activePayload[0].payload.hour);
                }
              }}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D8F6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00D8F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A263D" vertical={false} />
              <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" />
              <Tooltip />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
              <ReferenceLine x={activeTimestamp} stroke="#00E599" strokeWidth={2} strokeDasharray="3 3" label={{ value: 'ACTIVE', fill: '#00E599', fontSize: 10, position: 'top' }} />

              <Area type="monotone" dataKey="Solar" stroke="#FBBF24" fillOpacity={1} fill="url(#colorSolar)" strokeWidth={2} />
              <Area type="monotone" dataKey="Wind" stroke="#00D8F6" fillOpacity={1} fill="url(#colorWind)" strokeWidth={2} />
              <Line type="monotone" dataKey="Demand" stroke="#A78BFA" strokeWidth={2.5} dot={false} />

              {showForecastOverlay && (
                <>
                  <Line type="monotone" dataKey="Forecast Demand" stroke="#DDD6FE" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Forecast Solar" stroke="#FDE68A" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Optimal Dispatch & Battery State of Charge */}
      <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A263D]">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#00E599]" />
              Constrained Dispatch & Battery SoC
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Supply Dispatch Breakdown (kW) & Battery State of Charge (15% - 95%)
            </p>
          </div>
          <div className="text-xs font-mono text-[#94A3B8] hidden sm:block">
            Capacity: <strong className="text-white">{batteryConfig.capacity_kwh} kWh</strong>
          </div>
        </div>

        {/* Recharts Dispatch & SoC Container */}
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  onHourClick(e.activePayload[0].payload.hour);
                }
              }}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorGrid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorRenUsed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E599" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#00E599" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorDisch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A263D" vertical={false} />
              <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#00E599" fontSize={11} tickLine={false} unit="%" />
              <Tooltip />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
              <ReferenceLine yAxisId="left" x={activeTimestamp} stroke="#00E599" strokeWidth={2} strokeDasharray="3 3" />
              <ReferenceLine yAxisId="right" y={batteryConfig.min_soc * 100} stroke="#EF4444" strokeDasharray="2 2" label={{ value: 'Min SoC', fill: '#EF4444', fontSize: 9 }} />
              <ReferenceLine yAxisId="right" y={batteryConfig.max_soc * 100} stroke="#64748B" strokeDasharray="2 2" label={{ value: 'Max SoC', fill: '#94A3B8', fontSize: 9 }} />

              {/* Stacked generation meeting load */}
              <Area yAxisId="left" type="monotone" dataKey="Renewables Used" stackId="1" stroke="#00E599" fill="url(#colorRenUsed)" />
              <Area yAxisId="left" type="monotone" dataKey="Battery Disch" stackId="1" stroke="#F59E0B" fill="url(#colorDisch)" />
              <Area yAxisId="left" type="monotone" dataKey="Grid Import" stackId="1" stroke="#38BDF8" fill="url(#colorGrid)" />
              <Area yAxisId="left" type="monotone" dataKey="Unserved Demand" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.8} />

              {/* Overlaid Battery SoC Line */}
              <Line yAxisId="right" type="monotone" dataKey="SoC" stroke="#00E599" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

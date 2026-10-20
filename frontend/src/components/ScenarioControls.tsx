import React from 'react';
import { MicrogridConfig, ScenarioId } from '../types/api';
import { Sliders, RefreshCw, Sparkles, Battery, Zap, Leaf } from 'lucide-react';

interface ScenarioControlsProps {
  config: MicrogridConfig;
  onChangeConfig: (newConfig: MicrogridConfig) => void;
  onRunOptimization: () => void;
  loading: boolean;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  config,
  onChangeConfig,
  onRunOptimization,
  loading,
}) => {
  const updateBattery = (field: string, value: number) => {
    onChangeConfig({
      ...config,
      battery: {
        ...config.battery,
        [field]: value,
      },
    });
  };

  const updateOptimization = (field: string, value: number) => {
    onChangeConfig({
      ...config,
      optimization: {
        ...config.optimization,
        [field]: value,
      },
    });
  };

  const applyPreset = (preset: 'default' | 'heavy' | 'lean' | 'carbon') => {
    if (preset === 'default') {
      onChangeConfig({
        ...config,
        battery: {
          ...config.battery,
          capacity_kwh: 100.0,
          max_charge_kw: 40.0,
          max_discharge_kw: 40.0,
          initial_soc: 0.40,
        },
        optimization: {
          ...config.optimization,
          carbon_weight: 0.0,
        },
      });
    } else if (preset === 'heavy') {
      onChangeConfig({
        ...config,
        battery: {
          ...config.battery,
          capacity_kwh: 200.0,
          max_charge_kw: 80.0,
          max_discharge_kw: 80.0,
          initial_soc: 0.50,
        },
      });
    } else if (preset === 'lean') {
      onChangeConfig({
        ...config,
        battery: {
          ...config.battery,
          capacity_kwh: 40.0,
          max_charge_kw: 20.0,
          max_discharge_kw: 20.0,
          initial_soc: 0.30,
        },
      });
    } else if (preset === 'carbon') {
      onChangeConfig({
        ...config,
        optimization: {
          ...config.optimization,
          carbon_weight: 0.25, // $0.25/kg CO2 ($250/ton carbon price)
        },
      });
    }
  };

  return (
    <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#1A263D] gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00E599]" />
            Microgrid Parameter Studio & Objective Controls
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Configure physical battery sizing, power inverter C-rate, and carbon-aware optimization weights
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-[#64748B] uppercase mr-1">Presets:</span>
          <button
            onClick={() => applyPreset('default')}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#141D30] border border-[#1A263D] hover:border-[#2A3B5C] text-[#CBD5E1]"
          >
            Standard (100 kWh)
          </button>
          <button
            onClick={() => applyPreset('heavy')}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#141D30] border border-[#1A263D] hover:border-[#2A3B5C] text-[#CBD5E1]"
          >
            Heavy (200 kWh)
          </button>
          <button
            onClick={() => applyPreset('lean')}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#141D30] border border-[#1A263D] hover:border-[#2A3B5C] text-[#CBD5E1]"
          >
            Constrained (40 kWh)
          </button>
          <button
            onClick={() => applyPreset('carbon')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono border flex items-center gap-1 ${
              config.optimization.carbon_weight > 0
                ? 'bg-[#00D8F6]/20 border-[#00D8F6]/40 text-[#00D8F6] font-semibold'
                : 'bg-[#141D30] border-[#1A263D] text-[#CBD5E1]'
            }`}
          >
            <Leaf className="w-3 h-3 text-[#00D8F6]" />
            Carbon-Aware
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Slider 1: Battery Capacity */}
        <div className="bg-[#141D30] border border-[#1A263D] p-3 rounded-lg">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-[#94A3B8] flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-[#00E599]" />
              Storage Capacity
            </span>
            <span className="text-white font-bold">{config.battery.capacity_kwh} kWh</span>
          </div>
          <input
            type="range"
            min="20"
            max="300"
            step="10"
            value={config.battery.capacity_kwh}
            onChange={(e) => updateBattery('capacity_kwh', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#1E293B] rounded appearance-none cursor-pointer"
            aria-label="Battery Capacity in kWh"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1">
            <span>20 kWh</span>
            <span>300 kWh</span>
          </div>
        </div>

        {/* Slider 2: Max Inverter Power (kW) */}
        <div className="bg-[#141D30] border border-[#1A263D] p-3 rounded-lg">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-[#94A3B8] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Inverter Power Rating
            </span>
            <span className="text-white font-bold">{config.battery.max_discharge_kw} kW</span>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={config.battery.max_discharge_kw}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onChangeConfig({
                ...config,
                battery: {
                  ...config.battery,
                  max_charge_kw: val,
                  max_discharge_kw: val,
                },
              });
            }}
            className="w-full h-1.5 bg-[#1E293B] rounded appearance-none cursor-pointer"
            aria-label="Inverter Power in kW"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1">
            <span>10 kW</span>
            <span>120 kW</span>
          </div>
        </div>

        {/* Slider 3: Starting SoC */}
        <div className="bg-[#141D30] border border-[#1A263D] p-3 rounded-lg">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-[#94A3B8]">Initial SoC (Hour 00:00)</span>
            <span className="text-white font-bold">{(config.battery.initial_soc * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={config.battery.min_soc * 100}
            max={config.battery.max_soc * 100}
            step="5"
            value={config.battery.initial_soc * 100}
            onChange={(e) => updateBattery('initial_soc', parseFloat(e.target.value) / 100.0)}
            className="w-full h-1.5 bg-[#1E293B] rounded appearance-none cursor-pointer"
            aria-label="Initial SoC Percentage"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1">
            <span>Min (15%)</span>
            <span>Max (95%)</span>
          </div>
        </div>

        {/* Slider 4: Carbon Penalty Weight ($/kg CO2) */}
        <div className="bg-[#141D30] border border-[#1A263D] p-3 rounded-lg">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-[#94A3B8] flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-[#00D8F6]" />
              Carbon Weight (λ)
            </span>
            <span className="text-[#00D8F6] font-bold">
              {config.optimization.carbon_weight > 0
                ? `$${config.optimization.carbon_weight.toFixed(2)}/kg`
                : 'Off (Pure Cost)'}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="0.50"
            step="0.05"
            value={config.optimization.carbon_weight}
            onChange={(e) => updateOptimization('carbon_weight', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#1E293B] rounded appearance-none cursor-pointer"
            aria-label="Carbon Penalty Weight in dollars per kg CO2"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1">
            <span>$0.00</span>
            <span>$0.50/kg ($500/t)</span>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-[11px] font-mono text-[#64748B] flex items-center gap-2">
          <span>Random Seed: <strong className="text-[#94A3B8]">{config.random_seed}</strong></span>
          <span>&bull;</span>
          <span>Degradation Penalty: <strong className="text-[#94A3B8]">${config.battery.degradation_cost_per_kwh}/kWh</strong></span>
        </div>

        <button
          onClick={onRunOptimization}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#00E599] hover:bg-[#00D08A] text-[#080C14] font-bold text-xs font-mono rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-[#00E599]/20"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Solving Constrained Dispatch...' : 'Re-Run Look-Ahead Optimizer'}
        </button>
      </div>
    </div>
  );
};

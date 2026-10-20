import React from 'react';
import { MicrogridConfig } from '../types/api';
import { X, Sliders, RefreshCw, Battery, Zap, Leaf } from 'lucide-react';

interface ParameterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: MicrogridConfig;
  onChangeConfig: (newConfig: MicrogridConfig) => void;
  onRunOptimization: () => void;
  loading: boolean;
}

export const ParameterDrawer: React.FC<ParameterDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onRunOptimization,
  loading,
}) => {
  if (!isOpen) return null;

  const updateBattery = (field: string, value: number) => {
    onChangeConfig({
      ...config,
      battery: { ...config.battery, [field]: value },
    });
  };

  const updateOptimization = (field: string, value: number) => {
    onChangeConfig({
      ...config,
      optimization: { ...config.optimization, [field]: value },
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
        optimization: { ...config.optimization, carbon_weight: 0.0 },
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
          carbon_weight: 0.25, // $0.25/kg CO2 ($250/ton)
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F1626] border border-[#1A263D] rounded-xl max-w-xl w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#1A263D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#00E599]/10 rounded-lg text-[#00E599]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Microgrid Parameter Studio</h2>
              <p className="text-xs text-[#94A3B8]">Adjust physical storage ratings & optimization weights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#1A263D] rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mb-5">
          <span className="text-[11px] font-mono uppercase text-[#64748B] block mb-2">Quick Presets:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => applyPreset('default')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#141D30] border border-[#1A263D] hover:border-[#2A3B5C] text-[#CBD5E1] transition"
            >
              Standard (100 kWh)
            </button>
            <button
              onClick={() => applyPreset('heavy')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#141D30] border border-[#1A263D] hover:border-[#2A3B5C] text-[#CBD5E1] transition"
            >
              Heavy (200 kWh)
            </button>
            <button
              onClick={() => applyPreset('lean')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#141D30] border border-[#1A263D] hover:border-[#2A3B5C] text-[#CBD5E1] transition"
            >
              Lean (40 kWh)
            </button>
            <button
              onClick={() => applyPreset('carbon')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border flex items-center justify-center gap-1 transition ${
                config.optimization.carbon_weight > 0
                  ? 'bg-[#00D8F6]/20 border-[#00D8F6]/40 text-[#00D8F6] font-semibold'
                  : 'bg-[#141D30] border-[#1A263D] text-[#CBD5E1]'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              Carbon-Aware
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-4 mb-6">
          {/* Capacity */}
          <div className="bg-[#141D30] border border-[#1A263D] p-3 rounded-lg">
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-[#94A3B8] flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-[#00E599]" />
                Battery Storage Capacity
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
            />
            <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1">
              <span>20 kWh</span>
              <span>300 kWh</span>
            </div>
          </div>

          {/* Inverter Power */}
          <div className="bg-[#141D30] border border-[#1A263D] p-3 rounded-lg">
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-[#94A3B8] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Inverter Power Rating (kW)
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
            />
            <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1">
              <span>10 kW</span>
              <span>120 kW</span>
            </div>
          </div>

          {/* Carbon Weight */}
          <div className="bg-[#141D30] border border-[#1A263D] p-3 rounded-lg">
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-[#94A3B8] flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-[#00D8F6]" />
                Carbon Emission Penalty Weight (λ)
              </span>
              <span className="text-[#00D8F6] font-bold">
                {config.optimization.carbon_weight > 0
                  ? `$${config.optimization.carbon_weight.toFixed(2)}/kg`
                  : 'Off (Cost Minimization)'}
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
            />
            <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1">
              <span>$0.00</span>
              <span>$0.50/kg ($500/t)</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1A263D]">
          <span className="text-[11px] font-mono text-[#64748B]">
            Degradation: ${config.battery.degradation_cost_per_kwh}/kWh throughput
          </span>
          <button
            onClick={() => {
              onRunOptimization();
              onClose();
            }}
            disabled={loading}
            className="px-5 py-2 bg-[#00E599] hover:bg-[#00D08A] text-[#080C14] font-bold text-xs font-mono rounded-lg transition flex items-center gap-2 shadow-lg shadow-[#00E599]/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Solving...' : 'Apply & Re-Run'}
          </button>
        </div>
      </div>
    </div>
  );
};

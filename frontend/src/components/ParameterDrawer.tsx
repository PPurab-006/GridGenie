import React from 'react';
import { MicrogridConfig } from '../types/api';
import { X, Sliders, RefreshCw, Battery, Leaf } from 'lucide-react';

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
          initial_soc: 0.4,
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
          initial_soc: 0.5,
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
          initial_soc: 0.3,
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E3DED2]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E6EFEA] rounded-lg text-[#1D3D2D]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#171E1A] tracking-tight">
                Microgrid Configuration Studio
              </h2>
              <p className="text-xs text-[#5D7C6C]">
                Adjust storage ratings, solar/wind capacities, and carbon optimization weights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#788A80] hover:text-[#171E1A] hover:bg-[#EAE6DB] rounded-lg transition-colors"
            aria-label="Close configuration"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mb-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#5D7C6C] mb-2 block">
            System Architecture Presets
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => applyPreset('default')}
              className="px-2.5 py-1.5 bg-[#FFFFFF] border border-[#D5E0D7] hover:border-[#1D3D2D] text-xs font-medium text-[#171E1A] rounded-lg transition-colors shadow-sm text-center"
            >
              Default (100 kWh)
            </button>
            <button
              onClick={() => applyPreset('heavy')}
              className="px-2.5 py-1.5 bg-[#FFFFFF] border border-[#D5E0D7] hover:border-[#1D3D2D] text-xs font-medium text-[#171E1A] rounded-lg transition-colors shadow-sm text-center"
            >
              Heavy (200 kWh)
            </button>
            <button
              onClick={() => applyPreset('lean')}
              className="px-2.5 py-1.5 bg-[#FFFFFF] border border-[#D5E0D7] hover:border-[#1D3D2D] text-xs font-medium text-[#171E1A] rounded-lg transition-colors shadow-sm text-center"
            >
              Lean (40 kWh)
            </button>
            <button
              onClick={() => applyPreset('carbon')}
              className="px-2.5 py-1.5 bg-[#FFFFFF] border border-[#D5E0D7] hover:border-[#1D3D2D] text-xs font-medium text-[#171E1A] rounded-lg transition-colors shadow-sm text-center"
            >
              High Carbon Tax
            </button>
          </div>
        </div>

        {/* Sliders Form */}
        <div className="space-y-4 mb-6">
          {/* Battery Capacity */}
          <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E3DED2]">
            <div className="flex justify-between text-xs font-medium text-[#171E1A] mb-1.5">
              <span className="flex items-center gap-1.5 text-[#5D7C6C]">
                <Battery className="w-3.5 h-3.5" /> Battery Capacity
              </span>
              <span className="font-mono font-bold text-[#1D3D2D]">
                {config.battery.capacity_kwh} kWh
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="300"
              step="10"
              value={config.battery.capacity_kwh}
              onChange={(e) => updateBattery('capacity_kwh', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#E6E0D4] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#788A80] font-mono mt-1">
              <span>20 kWh</span>
              <span>100 kWh</span>
              <span>300 kWh</span>
            </div>
          </div>

          {/* Max Charge / Discharge Power */}
          <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E3DED2]">
            <div className="flex justify-between text-xs font-medium text-[#171E1A] mb-1.5">
              <span className="text-[#5D7C6C]">BESS Power Inverter Rating</span>
              <span className="font-mono font-bold text-[#1D3D2D]">
                &plusmn;{config.battery.max_charge_kw} kW
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={config.battery.max_charge_kw}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onChangeConfig({
                  ...config,
                  battery: { ...config.battery, max_charge_kw: val, max_discharge_kw: val },
                });
              }}
              className="w-full h-1.5 bg-[#E6E0D4] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#788A80] font-mono mt-1">
              <span>10 kW</span>
              <span>40 kW</span>
              <span>150 kW</span>
            </div>
          </div>

          {/* Initial SoC */}
          <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E3DED2]">
            <div className="flex justify-between text-xs font-medium text-[#171E1A] mb-1.5">
              <span className="text-[#5D7C6C]">Initial Starting SoC (Hour 0)</span>
              <span className="font-mono font-bold text-[#1D3D2D]">
                {Math.round(config.battery.initial_soc * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.8"
              step="0.05"
              value={config.battery.initial_soc}
              onChange={(e) => updateBattery('initial_soc', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#E6E0D4] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#788A80] font-mono mt-1">
              <span>20% (Minimum)</span>
              <span>50%</span>
              <span>80%</span>
            </div>
          </div>

          {/* Carbon Weight */}
          <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E3DED2]">
            <div className="flex justify-between text-xs font-medium text-[#171E1A] mb-1.5">
              <span className="flex items-center gap-1.5 text-[#5D7C6C]">
                <Leaf className="w-3.5 h-3.5 text-[#1D3D2D]" /> Carbon Emission Weight ($\lambda$)
              </span>
              <span className="font-mono font-bold text-[#1D3D2D]">
                ${config.optimization.carbon_weight.toFixed(2)} / kg CO₂
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.5"
              step="0.05"
              value={config.optimization.carbon_weight}
              onChange={(e) => updateOptimization('carbon_weight', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#E6E0D4] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#788A80] font-mono mt-1">
              <span>$0 (Cost Only)</span>
              <span>$0.25 ($250/ton)</span>
              <span>$0.50 ($500/ton)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E3DED2]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#4A5B52] hover:text-[#171E1A] hover:bg-[#EAE6DB] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onRunOptimization();
              onClose();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D3D2D] hover:bg-[#28533D] text-[#FAF8F5] text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Apply & Re-optimize
          </button>
        </div>
      </div>
    </div>
  );
};

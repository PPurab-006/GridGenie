import React from 'react';
import { AssetId, TimeStepDispatch, MicrogridConfig } from '../../types/api';
import { Sun, Wind, Battery, Building2, Zap, X, Info } from 'lucide-react';

interface AssetDetailPanelProps {
  assetId: AssetId;
  step: TimeStepDispatch;
  config: MicrogridConfig;
  onClose: () => void;
}

export const AssetDetailPanel: React.FC<AssetDetailPanelProps> = ({
  assetId,
  step,
  config,
  onClose,
}) => {
  const renderContent = () => {
    switch (assetId) {
      case 'solar': {
        const capacity = config.solar_capacity_kw;
        const gen = step.solar_kw;
        const pct = capacity > 0 ? (gen / capacity) * 100 : 0;
        const isNight = gen < 0.2;

        return {
          icon: <Sun className="w-5 h-5 text-amber-700" />,
          title: 'Solar Photovoltaic Array',
          type: 'Renewable Generation',
          status: isNight ? 'Dormant (Night)' : `Active (${pct.toFixed(0)}% Capacity)`,
          statusColor: isNight ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-900 border-amber-300',
          metrics: [
            { label: 'Current Output', value: `${gen.toFixed(1)} kW` },
            { label: 'Nameplate Capacity', value: `${capacity.toFixed(0)} kW` },
            { label: 'Capacity Factor', value: `${pct.toFixed(1)}%` },
            { label: 'Curtailed Solar', value: `${step.renewables_curtailed_kw.toFixed(1)} kW` },
          ],
          explanation: isNight
            ? 'No solar irradiance is available during nocturnal hours. The microgrid relies on wind generation, battery discharge, or grid import.'
            : `Generating ${gen.toFixed(1)} kW from solar irradiance, covering ${step.demand_kw > 0 ? ((gen / step.demand_kw) * 100).toFixed(0) : 0}% of the facility's instantaneous electrical demand.`,
        };
      }

      case 'wind': {
        const capacity = config.wind_capacity_kw;
        const gen = step.wind_kw;
        const pct = capacity > 0 ? (gen / capacity) * 100 : 0;
        const isCalm = gen < 0.2;

        return {
          icon: <Wind className="w-5 h-5 text-cyan-700" />,
          title: 'Wind Turbine Installation',
          type: 'Renewable Generation',
          status: isCalm ? 'Calm (Low Wind)' : `Generating (${pct.toFixed(0)}% Rated)`,
          statusColor: isCalm ? 'bg-gray-100 text-gray-700' : 'bg-cyan-100 text-cyan-900 border-cyan-300',
          metrics: [
            { label: 'Current Output', value: `${gen.toFixed(1)} kW` },
            { label: 'Rated Capacity', value: `${capacity.toFixed(0)} kW` },
            { label: 'Capacity Factor', value: `${pct.toFixed(1)}%` },
            { label: 'Rotor Status', value: isCalm ? 'Stationary' : 'Active Rotation' },
          ],
          explanation: isCalm
            ? 'Wind speeds are below cut-in threshold. Local generation is supplied by solar PV or battery storage.'
            : `Generating ${gen.toFixed(1)} kW of zero-carbon wind power. Turbines are rotating smoothly to satisfy base load.`,
        };
      }

      case 'battery': {
        const capacity = config.battery.capacity_kwh;
        const energy = step.battery_energy_kwh;
        const soc = Math.round(step.battery_soc * 100);
        const isChg = step.battery_charge_kw > 0.1;
        const isDis = step.battery_discharge_kw > 0.1;

        return {
          icon: <Battery className="w-5 h-5 text-emerald-700" />,
          title: 'Battery Energy Storage (BESS)',
          type: 'Electrochemical Storage',
          status: isChg ? `Charging (+${step.battery_charge_kw.toFixed(1)} kW)` : isDis ? `Discharging (-${step.battery_discharge_kw.toFixed(1)} kW)` : 'Idle (Standby)',
          statusColor: isChg ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : isDis ? 'bg-lime-100 text-lime-900 border-lime-300' : 'bg-gray-100 text-gray-700',
          metrics: [
            { label: 'State of Charge (SoC)', value: `${soc}%` },
            { label: 'Energy Stored', value: `${energy.toFixed(1)} kWh` },
            { label: 'Usable Range', value: `${Math.round(config.battery.min_soc * 100)}% – ${Math.round(config.battery.max_soc * 100)}%` },
            { label: 'Round-Trip Efficiency', value: `${Math.round(config.battery.charge_efficiency * config.battery.discharge_efficiency * 100)}%` },
          ],
          explanation: isChg
            ? `GridMind is charging the battery at ${step.battery_charge_kw.toFixed(1)} kW, buffering surplus zero-marginal-cost renewable energy to prevent curtailment.`
            : isDis
            ? `Discharging ${step.battery_discharge_kw.toFixed(1)} kW to offset high-tariff peak grid power ($${step.grid_price.toFixed(2)}/kWh), protecting the operating budget.`
            : `Battery is on standby at ${soc}% SoC (${energy.toFixed(1)} kWh). Held in reserve for forecasted evening peak demand.`,
        };
      }

      case 'facility': {
        const demand = step.demand_kw;
        const unserved = step.unserved_demand_kw;
        const hasDeficit = unserved > 0.05;

        return {
          icon: <Building2 className="w-5 h-5 text-amber-700" />,
          title: 'Commercial / Industrial Facility',
          type: 'Electrical Demand Load',
          status: hasDeficit ? `Deficit: ${unserved.toFixed(1)} kW` : '100% Demand Satisfied',
          statusColor: hasDeficit ? 'bg-red-100 text-red-900 border-red-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300',
          metrics: [
            { label: 'Instantaneous Demand', value: `${demand.toFixed(1)} kW` },
            { label: 'Supplied Power', value: `${(demand - unserved).toFixed(1)} kW` },
            { label: 'Unserved Deficit', value: `${unserved.toFixed(1)} kW` },
            { label: 'Local Renewable Cover', value: `${step.demand_kw > 0 ? Math.min(100, (step.renewables_used_kw / step.demand_kw) * 100).toFixed(0) : 0}%` },
          ],
          explanation: hasDeficit
            ? `Unserved energy penalty active: local resources and grid interconnection limits were insufficient to cover ${unserved.toFixed(1)} kW.`
            : `Facility electrical load is fully met with zero interruptions through a coordinated dispatch of local renewables, battery storage, and grid support.`,
        };
      }

      case 'grid': {
        const isImp = step.grid_import_kw > 0.1;
        const isExp = step.grid_export_kw > 0.1;

        return {
          icon: <Zap className="w-5 h-5 text-rose-700" />,
          title: 'Substation & Utility Grid',
          type: 'External Interconnection',
          status: isImp ? `Importing (${step.grid_import_kw.toFixed(1)} kW)` : isExp ? `Exporting (${step.grid_export_kw.toFixed(1)} kW)` : 'Balanced / Islanded',
          statusColor: isImp ? 'bg-rose-100 text-rose-900 border-rose-300' : isExp ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-gray-100 text-gray-700',
          metrics: [
            { label: 'Grid Import', value: `${step.grid_import_kw.toFixed(1)} kW` },
            { label: 'Grid Export', value: `${step.grid_export_kw.toFixed(1)} kW` },
            { label: 'Electricity Price', value: `$${step.grid_price.toFixed(3)}/kWh` },
            { label: 'Carbon Intensity', value: `${step.grid_carbon_intensity.toFixed(2)} kg CO₂/kWh` },
          ],
          explanation: isImp
            ? `Importing ${step.grid_import_kw.toFixed(1)} kW from utility grid at $${step.grid_price.toFixed(2)}/kWh to bridge the deficit between local renewables and facility demand.`
            : isExp
            ? `Exporting ${step.grid_export_kw.toFixed(1)} kW of surplus clean generation back to the regional grid.`
            : 'Zero electricity exchange with the regional utility grid; microgrid is operating in a self-sufficient islanded balance.',
        };
      }
    }
  };

  const details = renderContent();

  return (
    <div className="bg-[#FAF8F5] border border-[#D5E0D7] rounded-xl shadow-lg p-5 w-full max-w-sm transition-all duration-300">
      <div className="flex items-start justify-between pb-3 border-b border-[#E3ECE6]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#EAE6DB] border border-[#DCD5C5]">
            {details.icon}
          </div>
          <div>
            <h3 className="font-editorial text-lg font-semibold text-[#171E1A] leading-tight">
              {details.title}
            </h3>
            <span className="text-xs text-[#5D7C6C] font-medium">
              {details.type}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#788A80] hover:text-[#171E1A] p-1 rounded-md hover:bg-[#EAE6DB] transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3">
        <span
          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${details.statusColor}`}
        >
          {details.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {details.metrics.map((m, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E4DDD0]"
          >
            <div className="text-[10px] text-[#788A80] font-medium uppercase tracking-wider">
              {m.label}
            </div>
            <div className="text-sm font-semibold text-[#171E1A] tabular-nums mt-0.5">
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-[#F0EDE4] border border-[#DCD5C5] text-xs text-[#384E43] flex items-start gap-2 leading-relaxed">
        <Info className="w-4 h-4 text-[#5D7C6C] shrink-0 mt-0.5" />
        <span>{details.explanation}</span>
      </div>
    </div>
  );
};

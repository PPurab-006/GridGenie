import React, { useEffect } from 'react';
import { AssetId, TimeStepDispatch, MicrogridConfig } from '../../types/api';
import {
  Sun,
  Wind,
  Battery,
  Building2,
  Zap,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface CinematicInspectionOverlayProps {
  assetId: AssetId;
  step: TimeStepDispatch;
  config: MicrogridConfig;
  onBackToOverview: () => void;
}

export const CinematicInspectionOverlay: React.FC<CinematicInspectionOverlayProps> = ({
  assetId,
  step,
  config,
  onBackToOverview,
}) => {
  // Listen for Escape key to smoothly return to overview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBackToOverview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBackToOverview]);

  // Compute live data and plain-language narrative for the selected asset
  const getAssetDetails = () => {
    switch (assetId) {
      case 'solar': {
        const capacity = config.solar_capacity_kw;
        const currentGen = step.solar_kw;
        const pctOfCap = capacity > 0 ? (currentGen / capacity) * 100 : 0;
        const isNight = currentGen < 0.1;
        const isCharging = step.battery_charge_kw > 0.1;

        let narrative = '';
        if (isNight) {
          narrative = `Solar output is 0.0 kW as the sun has set. The facility is drawing from battery storage and grid connection.`;
        } else if (isCharging) {
          narrative = `The solar array is producing ${currentGen.toFixed(1)} kW, supplying the facility and charging storage.`;
        } else {
          narrative = `The solar array is generating ${currentGen.toFixed(1)} kW from solar irradiance, satisfying local facility demand.`;
        }

        return {
          title: 'Solar Photovoltaic Array',
          role: 'Captures sunlight to generate zero-marginal-cost renewable electricity for the microgrid.',
          icon: <Sun className="w-5 h-5 text-amber-600" />,
          stateBadge: isNight ? 'Dormant (Night)' : `Active (${pctOfCap.toFixed(0)}% Capacity)`,
          badgeColor: isNight ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-amber-50 text-amber-800 border-amber-200',
          primaryValue: `${currentGen.toFixed(1)} kW`,
          primaryLabel: 'Current Solar Output',
          secondaryMetrics: [
            { label: 'Rated Capacity', value: `${capacity.toFixed(0)} kW` },
            { label: 'Capacity Factor', value: `${pctOfCap.toFixed(1)}%` },
            { label: 'Curtailed Solar', value: `${step.renewables_curtailed_kw.toFixed(1)} kW` },
          ],
          narrative,
        };
      }

      case 'wind': {
        const capacity = config.wind_capacity_kw;
        const currentGen = step.wind_kw;
        const pctOfCap = capacity > 0 ? (currentGen / capacity) * 100 : 0;
        const isCalm = currentGen < 0.1;

        const narrative = isCalm
          ? `Wind speeds are below turbine cut-in speed. Local power is supplied by solar PV or battery storage.`
          : `Wind turbines are producing ${currentGen.toFixed(1)} kW of clean power, rotating steadily to satisfy base facility demand.`;

        return {
          title: 'Wind Turbine Installation',
          role: 'Converts kinetic wind energy into clean, zero-carbon electricity to support day-and-night baseline load.',
          icon: <Wind className="w-5 h-5 text-cyan-600" />,
          stateBadge: isCalm ? 'Calm (Low Wind)' : `Active Rotation (${pctOfCap.toFixed(0)}% Rated)`,
          badgeColor: isCalm ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-cyan-50 text-cyan-800 border-cyan-200',
          primaryValue: `${currentGen.toFixed(1)} kW`,
          primaryLabel: 'Current Wind Output',
          secondaryMetrics: [
            { label: 'Rated Capacity', value: `${capacity.toFixed(0)} kW` },
            { label: 'Capacity Factor', value: `${pctOfCap.toFixed(1)}%` },
            { label: 'Rotor Status', value: isCalm ? 'Stationary' : 'Spinning' },
          ],
          narrative,
        };
      }

      case 'battery': {
        const capacity = config.battery.capacity_kwh;
        const storedEnergy = step.battery_energy_kwh;
        const socPct = Math.round(step.battery_soc * 100);
        const isCharging = step.battery_charge_kw > 0.1;
        const isDischarging = step.battery_discharge_kw > 0.1;

        let narrative = '';
        if (isCharging) {
          narrative = `The battery is charging at ${step.battery_charge_kw.toFixed(1)} kW to store available renewable energy.`;
        } else if (isDischarging) {
          narrative = `Discharging at ${step.battery_discharge_kw.toFixed(1)} kW during peak price ($${step.grid_price.toFixed(2)}/kWh) to avoid expensive utility purchases.`;
        } else {
          narrative = `The battery is on standby at ${socPct}% SoC (${storedEnergy.toFixed(1)} kWh), reserved for forecasted peak hours.`;
        }

        return {
          title: 'Battery Energy Storage (BESS)',
          role: 'Stores surplus clean energy and discharges during high-tariff periods to reduce operating costs and shave peak demand.',
          icon: <Battery className="w-5 h-5 text-emerald-600" />,
          stateBadge: isCharging
            ? `Charging (+${step.battery_charge_kw.toFixed(1)} kW)`
            : isDischarging
            ? `Discharging (-${step.battery_discharge_kw.toFixed(1)} kW)`
            : 'Standby (Reserve)',
          badgeColor: isCharging
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : isDischarging
            ? 'bg-lime-50 text-lime-800 border-lime-200'
            : 'bg-gray-100 text-gray-700 border-gray-200',
          primaryValue: `${socPct}%`,
          primaryLabel: 'State of Charge (SoC)',
          secondaryMetrics: [
            { label: 'Stored Energy', value: `${storedEnergy.toFixed(1)} / ${capacity} kWh` },
            {
              label: 'Power Flow',
              value: isCharging
                ? `+${step.battery_charge_kw.toFixed(1)} kW`
                : isDischarging
                ? `-${step.battery_discharge_kw.toFixed(1)} kW`
                : '0.0 kW',
            },
            {
              label: 'Efficiency',
              value: `${Math.round(config.battery.charge_efficiency * config.battery.discharge_efficiency * 100)}%`,
            },
          ],
          narrative,
        };
      }

      case 'facility': {
        const demand = step.demand_kw;
        const unserved = step.unserved_demand_kw;
        const hasUnserved = unserved > 0.05;

        const narrative = hasUnserved
          ? `Local resources and grid limits are currently short by ${unserved.toFixed(1)} kW of meeting facility load.`
          : `The facility currently requires ${demand.toFixed(1)} kW, satisfied by coordinated clean energy and grid support.`;

        return {
          title: 'Commercial / Industrial Facility',
          role: 'Represents the active electricity consumption of operations, heating/cooling, and institutional equipment.',
          icon: <Building2 className="w-5 h-5 text-amber-700" />,
          stateBadge: hasUnserved ? `Deficit: ${unserved.toFixed(1)} kW` : '100% Demand Met',
          badgeColor: hasUnserved ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200',
          primaryValue: `${demand.toFixed(1)} kW`,
          primaryLabel: 'Instantaneous Load',
          secondaryMetrics: [
            { label: 'Supplied Power', value: `${(demand - unserved).toFixed(1)} kW` },
            { label: 'Unserved Deficit', value: `${unserved.toFixed(1)} kW` },
            {
              label: 'Renewable Fraction',
              value: `${demand > 0 ? Math.min(100, (step.renewables_used_kw / demand) * 100).toFixed(0) : 0}%`,
            },
          ],
          narrative,
        };
      }

      case 'grid': {
        const isImporting = step.grid_import_kw > 0.1;
        const isExporting = step.grid_export_kw > 0.1;
        const exchangeKw = isImporting ? step.grid_import_kw : isExporting ? step.grid_export_kw : 0;

        let narrative = '';
        if (isImporting) {
          narrative = `Importing ${step.grid_import_kw.toFixed(1)} kW from the utility grid at $${step.grid_price.toFixed(2)}/kWh to bridge local deficit.`;
        } else if (isExporting) {
          narrative = `Exporting ${step.grid_export_kw.toFixed(1)} kW of surplus clean energy back to the regional distribution network.`;
        } else {
          narrative = `Operating in self-sufficient islanded balance with zero net energy exchange with the utility grid.`;
        }

        return {
          title: 'Substation & Grid Interconnection',
          role: 'Connects the microgrid to external regional utility lines for bidirectional power trading and backup reliability.',
          icon: <Zap className="w-5 h-5 text-rose-600" />,
          stateBadge: isImporting
            ? `Importing (${step.grid_import_kw.toFixed(1)} kW)`
            : isExporting
            ? `Exporting (${step.grid_export_kw.toFixed(1)} kW)`
            : 'Balanced / Islanded',
          badgeColor: isImporting
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : isExporting
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-gray-100 text-gray-700 border-gray-200',
          primaryValue: `${exchangeKw.toFixed(1)} kW`,
          primaryLabel: isImporting ? 'Active Grid Import' : isExporting ? 'Active Grid Export' : 'Net Grid Exchange',
          secondaryMetrics: [
            { label: 'Electricity Price', value: `$${step.grid_price.toFixed(3)}/kWh` },
            { label: 'Carbon Intensity', value: `${step.grid_carbon_intensity.toFixed(2)} kg/kWh` },
            { label: 'Max Interconnect', value: `${config.grid.max_import_kw} kW` },
          ],
          narrative,
        };
      }
    }
  };

  const details = getAssetDetails();

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-4 left-4 z-20 w-80 sm:w-96 bg-[#FAF8F5]/94 backdrop-blur-md border border-[#D5E0D7] shadow-xl rounded-2xl p-5 animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-auto select-none"
    >
      {/* Top Bar: Return to Overview Button + Escape key badge */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E3DED2]">
        <button
          onClick={onBackToOverview}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1D3D2D] hover:bg-[#28533D] text-[#FAF8F5] text-xs font-semibold shadow-sm transition-all hover:gap-2.5 active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to overview</span>
        </button>

        <span className="text-[10px] text-[#788A80] font-mono bg-[#EFECE4] px-2 py-0.5 rounded border border-[#E0DBCF]">
          ESC
        </span>
      </div>

      {/* Asset Title & Category */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-[#E6EFEA] border border-[#CCDCD2] shrink-0">
          {details.icon}
        </div>
        <div className="flex-1">
          <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-[#5D7C6C] mb-0.5">
            <Sparkles className="w-3 h-3 text-[#1D3D2D]" />
            Inspection Mode
          </div>
          <h2 className="font-editorial text-xl font-bold text-[#171E1A] leading-tight">
            {details.title}
          </h2>
        </div>
      </div>

      {/* Plain-Language Role Description */}
      <p className="text-xs text-[#4A5B52] leading-relaxed mb-4">
        {details.role}
      </p>

      {/* Primary Value Display & Status Badge */}
      <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E4DDD0] shadow-sm mb-3.5">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[#788A80] font-medium text-[11px] uppercase tracking-wide">
            {details.primaryLabel}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${details.badgeColor}`}
          >
            {details.stateBadge}
          </span>
        </div>
        <div className="font-editorial text-3xl font-bold text-[#171E1A] tabular-nums mt-0.5">
          {details.primaryValue}
        </div>
      </div>

      {/* Secondary Telemetry Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3.5">
        {details.secondaryMetrics.map((m, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E4DDD0] text-center"
          >
            <span className="text-[9px] uppercase font-semibold text-[#788A80] block truncate">
              {m.label}
            </span>
            <span className="text-xs font-bold text-[#171E1A] font-mono tabular-nums mt-0.5 block truncate">
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* Dynamic Simulation Rationale */}
      <div className="p-3 rounded-xl bg-[#F0EDE4] border border-[#DCD5C5] text-xs text-[#283830] leading-relaxed">
        <span className="font-semibold block text-[10px] uppercase tracking-wider text-[#5D7C6C] mb-1">
          Operating State @ {step.timestamp}
        </span>
        {details.narrative}
      </div>
    </div>
  );
};

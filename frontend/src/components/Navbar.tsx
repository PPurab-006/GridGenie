import React from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Activity,
  Scale,
  Brain,
  Globe2,
} from 'lucide-react';
import { ScenarioId, ScenarioSummary } from '../types/api';

export type ActiveView = 'operations' | 'performance' | 'forecast';

interface NavbarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  currentHour: number;
  onHourChange: (hour: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  selectedScenario: ScenarioId;
  scenarios: ScenarioSummary[];
  onScenarioChange: (id: ScenarioId) => void;
  backendOnline: boolean;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onViewChange,
  currentHour,
  onHourChange,
  isPlaying,
  onTogglePlay,
  selectedScenario,
  scenarios,
  onScenarioChange,
  backendOnline,
  onOpenSettings,
}) => {
  return (
    <header className="border-b border-[#E3DED2] bg-[#FAF8F5]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-2.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Tabs */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#1D3D2D] text-[#FAF8F5] flex items-center justify-center shadow-sm">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial text-lg font-bold text-[#171E1A] tracking-tight">
                  GridMind
                </span>
                <span className="text-[10px] font-sans font-semibold text-[#1D3D2D] bg-[#E6EFEA] px-1.5 py-0.5 rounded border border-[#CCDCD2]">
                  v3.0
                </span>
              </div>
              <p className="text-[10px] text-[#788A80] font-sans">
                IEEE ClimateChain Digital Twin
              </p>
            </div>
          </div>

          {/* View Navigation Tabs */}
          <nav className="flex items-center bg-[#EFECE4] border border-[#E0DBCF] rounded-lg p-1 gap-1">
            <button
              onClick={() => onViewChange('operations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === 'operations'
                  ? 'bg-[#1D3D2D] text-[#FAF8F5] font-semibold shadow-sm'
                  : 'text-[#4A5B52] hover:text-[#171E1A] hover:bg-[#FAF8F5]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Live Operations
            </button>
            <button
              onClick={() => onViewChange('performance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === 'performance'
                  ? 'bg-[#1D3D2D] text-[#FAF8F5] font-semibold shadow-sm'
                  : 'text-[#4A5B52] hover:text-[#171E1A] hover:bg-[#FAF8F5]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Performance Lab
            </button>
            <button
              onClick={() => onViewChange('forecast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === 'forecast'
                  ? 'bg-[#1D3D2D] text-[#FAF8F5] font-semibold shadow-sm'
                  : 'text-[#4A5B52] hover:text-[#171E1A] hover:bg-[#FAF8F5]'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              Forecast & Model
            </button>
          </nav>
        </div>

        {/* Right: Simulation Clock Scrubber & Scenario Picker */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 24h Clock Scrubber */}
          <div className="flex items-center bg-[#FAF8F5] border border-[#D5E0D7] rounded-lg px-2.5 py-1 gap-2 shadow-sm">
            <button
              onClick={() => onHourChange((currentHour - 1 + 24) % 24)}
              className="p-1 text-[#5D7C6C] hover:text-[#171E1A] hover:bg-[#EFECE4] rounded transition-colors"
              title="Previous Hour"
              aria-label="Previous Hour"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onTogglePlay}
              className={`p-1 rounded flex items-center justify-center transition-colors ${
                isPlaying
                  ? 'bg-[#1D3D2D] text-[#FAF8F5]'
                  : 'text-[#5D7C6C] hover:text-[#171E1A] hover:bg-[#EFECE4]'
              }`}
              title={isPlaying ? 'Pause simulation clock' : 'Play simulation clock (24h)'}
              aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={() => onHourChange((currentHour + 1) % 24)}
              className="p-1 text-[#5D7C6C] hover:text-[#171E1A] hover:bg-[#EFECE4] rounded transition-colors"
              title="Next Hour"
              aria-label="Next Hour"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <span className="text-xs font-mono font-bold text-[#1D3D2D] bg-[#E6EFEA] px-2 py-0.5 rounded border border-[#CCDCD2] min-w-[52px] text-center tabular-nums">
              {String(currentHour).padStart(2, '0')}:00
            </span>

            <input
              type="range"
              min="0"
              max="23"
              value={currentHour}
              onChange={(e) => onHourChange(parseInt(e.target.value, 10))}
              className="w-20 sm:w-24 h-1.5 bg-[#D5E0D7] rounded-lg appearance-none cursor-pointer"
              aria-label="Simulation Hour"
            />
          </div>

          {/* Scenario Selector */}
          <select
            value={selectedScenario}
            onChange={(e) => onScenarioChange(e.target.value as ScenarioId)}
            className="bg-[#FAF8F5] border border-[#D5E0D7] text-xs font-medium text-[#171E1A] rounded-lg px-2.5 py-1.5 focus:border-[#1D3D2D] focus:outline-none cursor-pointer shadow-sm hover:bg-[#F3EFE6] transition-colors"
            aria-label="Select Scenario"
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 bg-[#FAF8F5] hover:bg-[#F0EDE4] border border-[#D5E0D7] hover:border-[#1D3D2D] text-[#4A5B52] hover:text-[#171E1A] rounded-lg transition-colors shadow-sm"
            title="Configure Microgrid Parameters"
            aria-label="Parameters"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Status Dot */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#D5E0D7] shadow-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                backendOnline ? 'bg-[#10B981]' : 'bg-red-500'
              }`}
            />
            <span className="text-[10px] font-mono text-[#5D7C6C] font-medium">
              {backendOnline ? 'LP SOLVER READY' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

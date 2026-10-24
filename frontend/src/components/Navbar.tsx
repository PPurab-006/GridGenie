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
    <header className="border-b border-[#E3DED2] bg-[#FAF8F5] sticky top-0 z-50 px-3 sm:px-6 lg:px-8 py-2.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
        {/* Top/Left: Brand & View Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          {/* Brand header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#1D3D2D] text-[#FAF8F5] flex items-center justify-center shadow-sm shrink-0">
                <Globe2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-editorial text-lg font-bold text-[#171E1A] tracking-tight leading-tight">
                    GridGenie
                  </span>
                  <span className="text-[10px] font-sans font-semibold text-[#1D3D2D] bg-[#E6EFEA] px-1.5 py-0.2 rounded border border-[#CCDCD2]">
                    v3.3
                  </span>
                </div>
                <p className="text-[9.5px] text-[#788A80] font-sans leading-none">
                  IEEE ClimateChain Digital Twin
                </p>
              </div>
            </div>

            {/* Mobile Settings button */}
            <div className="flex sm:hidden items-center gap-1.5">
              <button
                onClick={onOpenSettings}
                className="p-1.5 bg-[#FAF8F5] hover:bg-[#F0EDE4] border border-[#D5E0D7] text-[#4A5B52] rounded-lg touch-manipulation"
                title="Configure Microgrid Parameters"
                aria-label="Parameters"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Navigation Tabs (Optimized for full touch responsiveness) */}
          <nav className="flex items-center bg-[#EFECE4] border border-[#E0DBCF] rounded-lg p-0.5 gap-0.5 max-sm:w-full max-sm:justify-between">
            <button
              onClick={() => onViewChange('operations')}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all max-sm:flex-1 touch-manipulation min-h-[34px] ${
                activeView === 'operations'
                  ? 'bg-[#1D3D2D] text-[#FAF8F5] font-semibold shadow-sm'
                  : 'text-[#4A5B52] hover:text-[#171E1A] hover:bg-[#FAF8F5]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 shrink-0" />
              <span>Operations</span>
            </button>
            <button
              onClick={() => onViewChange('performance')}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all max-sm:flex-1 touch-manipulation min-h-[34px] ${
                activeView === 'performance'
                  ? 'bg-[#1D3D2D] text-[#FAF8F5] font-semibold shadow-sm'
                  : 'text-[#4A5B52] hover:text-[#171E1A] hover:bg-[#FAF8F5]'
              }`}
            >
              <Scale className="w-3.5 h-3.5 shrink-0" />
              <span>Performance</span>
            </button>
            <button
              onClick={() => onViewChange('forecast')}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all max-sm:flex-1 touch-manipulation min-h-[34px] ${
                activeView === 'forecast'
                  ? 'bg-[#1D3D2D] text-[#FAF8F5] font-semibold shadow-sm'
                  : 'text-[#4A5B52] hover:text-[#171E1A] hover:bg-[#FAF8F5]'
              }`}
            >
              <Brain className="w-3.5 h-3.5 shrink-0" />
              <span>Forecast</span>
            </button>
          </nav>
        </div>

        {/* Right/Bottom: Simulation Clock Scrubber & Scenario Picker */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 pt-1 sm:pt-0 border-t border-[#EAE5D9] md:border-t-0">
          {/* 24h Clock Scrubber */}
          <div className="flex items-center bg-[#FAF8F5] border border-[#D5E0D7] rounded-lg px-2 py-1 gap-1.5 shadow-sm max-sm:flex-1 max-sm:justify-between">
            <button
              onClick={() => onHourChange((currentHour - 1 + 24) % 24)}
              className="p-1 text-[#5D7C6C] hover:text-[#171E1A] hover:bg-[#EFECE4] rounded transition-colors touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center"
              title="Previous Hour"
              aria-label="Previous Hour"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onTogglePlay}
              className={`p-1.5 rounded flex items-center justify-center transition-colors touch-manipulation min-w-[30px] min-h-[30px] ${
                isPlaying
                  ? 'bg-[#1D3D2D] text-[#FAF8F5]'
                  : 'text-[#5D7C6C] hover:text-[#171E1A] hover:bg-[#EFECE4]'
              }`}
              title={isPlaying ? 'Pause simulation clock' : 'Play simulation clock (24h)'}
              aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onHourChange((currentHour + 1) % 24)}
              className="p-1 text-[#5D7C6C] hover:text-[#171E1A] hover:bg-[#EFECE4] rounded transition-colors touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center"
              title="Next Hour"
              aria-label="Next Hour"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-bold text-[#1D3D2D] bg-[#E6EFEA] px-1.5 py-0.5 rounded border border-[#CCDCD2] min-w-[48px] text-center tabular-nums">
              {String(currentHour).padStart(2, '0')}:00
            </span>

            <input
              type="range"
              min="0"
              max="23"
              value={currentHour}
              onChange={(e) => onHourChange(parseInt(e.target.value, 10))}
              className="w-16 sm:w-20 md:w-24 h-1.5 bg-[#D5E0D7] rounded-lg appearance-none cursor-pointer"
              aria-label="Simulation Hour"
            />
          </div>

          {/* Scenario Selector */}
          <select
            value={selectedScenario}
            onChange={(e) => onScenarioChange(e.target.value as ScenarioId)}
            className="bg-[#FAF8F5] border border-[#D5E0D7] text-xs font-medium text-[#171E1A] rounded-lg px-2.5 py-1.5 focus:border-[#1D3D2D] focus:outline-none cursor-pointer shadow-sm hover:bg-[#F3EFE6] transition-colors max-sm:max-w-[130px] truncate"
            aria-label="Select Scenario"
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>

          {/* Desktop Settings Button */}
          <button
            onClick={onOpenSettings}
            className="hidden sm:flex p-1.5 bg-[#FAF8F5] hover:bg-[#F0EDE4] border border-[#D5E0D7] hover:border-[#1D3D2D] text-[#4A5B52] hover:text-[#171E1A] rounded-lg transition-colors shadow-sm"
            title="Configure Microgrid Parameters"
            aria-label="Parameters"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Desktop Status Dot */}
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

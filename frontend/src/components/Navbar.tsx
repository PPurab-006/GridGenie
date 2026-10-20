import React from 'react';
import { Cpu, Play, Pause, ChevronLeft, ChevronRight, Sliders, Activity, Scale, Brain } from 'lucide-react';
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
    <header className="border-b border-[#1A263D] bg-[#0A0F1D]/95 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Tabs */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#00E599]/10 border border-[#00E599]/30 flex items-center justify-center text-[#00E599]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-white">GridMind</span>
                <span className="text-[10px] font-mono text-[#00E599] bg-[#00E599]/10 px-1.5 py-0.2 rounded border border-[#00E599]/20">v2.0</span>
              </div>
              <p className="text-[10px] text-[#64748B] font-mono">IEEE ClimateChain Microgrid Optimizer</p>
            </div>
          </div>

          {/* View Navigation Tabs */}
          <nav className="flex items-center bg-[#0F1626] border border-[#1A263D] rounded-lg p-1 gap-1">
            <button
              onClick={() => onViewChange('operations')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition ${
                activeView === 'operations'
                  ? 'bg-[#00E599] text-[#080C14] font-bold shadow'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1A263D]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Live Operations
            </button>
            <button
              onClick={() => onViewChange('performance')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition ${
                activeView === 'performance'
                  ? 'bg-[#00E599] text-[#080C14] font-bold shadow'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1A263D]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Performance Lab
            </button>
            <button
              onClick={() => onViewChange('forecast')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition ${
                activeView === 'forecast'
                  ? 'bg-[#00E599] text-[#080C14] font-bold shadow'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1A263D]'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              Forecast & Model
            </button>
          </nav>
        </div>

        {/* Right: Simulation Clock Scrubber & Scenario Picker */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 24h Clock Scrubber */}
          <div className="flex items-center bg-[#0F1626] border border-[#1A263D] rounded-lg px-2.5 py-1 gap-2">
            <button
              onClick={() => onHourChange((currentHour - 1 + 24) % 24)}
              className="p-1 text-[#94A3B8] hover:text-white rounded"
              title="Previous Hour"
              aria-label="Previous Hour"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onTogglePlay}
              className={`p-1 rounded font-mono flex items-center gap-1 text-xs ${
                isPlaying ? 'bg-[#00E599] text-[#080C14]' : 'text-[#94A3B8] hover:text-white'
              }`}
              title={isPlaying ? 'Pause simulation clock' : 'Play simulation clock (24h)'}
              aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={() => onHourChange((currentHour + 1) % 24)}
              className="p-1 text-[#94A3B8] hover:text-white rounded"
              title="Next Hour"
              aria-label="Next Hour"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-[#00E599] bg-[#00E599]/10 px-2 py-0.5 rounded border border-[#00E599]/20 min-w-[50px] text-center tabular-nums">
              {String(currentHour).padStart(2, '0')}:00
            </span>
            <input
              type="range"
              min="0"
              max="23"
              value={currentHour}
              onChange={(e) => onHourChange(parseInt(e.target.value, 10))}
              className="w-20 sm:w-28 h-1 bg-[#1A263D] rounded-lg appearance-none cursor-pointer"
              aria-label="Simulation Hour"
            />
          </div>

          {/* Scenario Selector */}
          <select
            value={selectedScenario}
            onChange={(e) => onScenarioChange(e.target.value as ScenarioId)}
            className="bg-[#0F1626] border border-[#1A263D] text-xs font-mono text-white rounded-lg px-2.5 py-1.5 focus:border-[#00E599] focus:outline-none cursor-pointer"
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
            className="p-1.5 bg-[#0F1626] hover:bg-[#141D30] border border-[#1A263D] hover:border-[#00E599] text-[#94A3B8] hover:text-white rounded-lg transition"
            title="Configure Microgrid Parameters"
            aria-label="Parameters"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Status Dot */}
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-[#0F1626] border border-[#1A263D]">
            <span className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-[#00E599] animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-mono text-[#94A3B8]">
              {backendOnline ? 'HiGHS ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

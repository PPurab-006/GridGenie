import React from 'react';
import { Cpu, Play, Pause, ChevronLeft, ChevronRight, Activity, ShieldCheck } from 'lucide-react';
import { ScenarioId, ScenarioSummary } from '../types/api';

interface NavbarProps {
  currentHour: number;
  onHourChange: (hour: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  selectedScenario: ScenarioId;
  scenarios: ScenarioSummary[];
  onScenarioChange: (id: ScenarioId) => void;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentHour,
  onHourChange,
  isPlaying,
  onTogglePlay,
  selectedScenario,
  scenarios,
  onScenarioChange,
  backendOnline,
}) => {
  return (
    <header className="border-b border-[#1A263D] bg-[#0A0F1D]/90 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Context */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#00E599]/10 border border-[#00E599]/30 flex items-center justify-center text-[#00E599]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                GridMind <span className="text-xs font-mono font-normal text-[#00E599] bg-[#00E599]/10 border border-[#00E599]/20 px-1.5 py-0.5 rounded">v1.0</span>
              </h1>
              <span className="text-[11px] font-mono text-[#94A3B8] hidden sm:inline">
                // Autonomous Microgrid Optimizer
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              IEEE ClimateChain Global Hackathon &bull; Digital Twin Simulation
            </p>
          </div>
        </div>

        {/* Center: 24h Time Scrub & Playback Controls */}
        <div className="flex items-center bg-[#0F1626] border border-[#1A263D] rounded-lg px-3 py-1.5 gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onHourChange((currentHour - 1 + 24) % 24)}
              className="p-1 text-[#94A3B8] hover:text-white hover:bg-[#1A263D] rounded transition"
              title="Previous Hour"
              aria-label="Previous Hour"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onTogglePlay}
              className={`p-1.5 rounded transition font-mono flex items-center gap-1 text-xs ${
                isPlaying
                  ? 'bg-[#00E599] text-[#080C14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1A263D]'
              }`}
              title={isPlaying ? 'Pause simulation clock' : 'Play simulation clock (24h)'}
              aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onHourChange((currentHour + 1) % 24)}
              className="p-1 text-[#94A3B8] hover:text-white hover:bg-[#1A263D] rounded transition"
              title="Next Hour"
              aria-label="Next Hour"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-[#00E599] bg-[#00E599]/10 px-2 py-0.5 rounded border border-[#00E599]/20 min-w-[56px] text-center tabular-nums">
              {String(currentHour).padStart(2, '0')}:00
            </span>
            <input
              type="range"
              min="0"
              max="23"
              value={currentHour}
              onChange={(e) => onHourChange(parseInt(e.target.value, 10))}
              className="w-24 sm:w-36 h-1 bg-[#1A263D] rounded-lg appearance-none cursor-pointer"
              title={`Hour: ${currentHour}:00`}
              aria-label="Simulation Hour"
            />
          </div>
        </div>

        {/* Right: Scenario Selector & System Status */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#64748B] font-mono uppercase">Scenario:</span>
              <select
                value={selectedScenario}
                onChange={(e) => onScenarioChange(e.target.value as ScenarioId)}
                className="bg-[#0F1626] border border-[#1A263D] text-xs text-white rounded px-2.5 py-1 focus:border-[#00E599] focus:outline-none cursor-pointer font-medium"
                aria-label="Select Scenario"
              >
                {scenarios.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0F1626] border border-[#1A263D]">
            <span
              className={`h-2 w-2 rounded-full ${
                backendOnline ? 'bg-[#00E599] animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-[11px] font-mono text-[#94A3B8]">
              {backendOnline ? 'HiGHS LP ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

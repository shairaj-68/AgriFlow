import React, { useState } from 'react';
import { Play, FastForward, Sun, CloudRain, RotateCcw, Sparkles, Loader2 } from 'lucide-react';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

export const QuickSimulationBar = ({ onSimulateDays, onTriggerScenario, simulating }) => {
  const [customDays, setCustomDays] = useState(1);

  return (
    <div className="glass-panel rounded-xl p-4 border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-900/60 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FastForward className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Virtual Soil Simulation Sandbox</h4>
              <ProvenanceBadge type="SIMULATED" size="xs" />
            </div>
            <p className="text-[11px] text-slate-400">Step soil water balance forward in time to demonstrate irrigation triggers</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* +1 Day */}
          <button
            onClick={() => onSimulateDays(1)}
            disabled={simulating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500 text-xs font-bold transition disabled:opacity-50"
          >
            {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>+1 Day</span>
          </button>

          {/* +7 Days */}
          <button
            onClick={() => onSimulateDays(7)}
            disabled={simulating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500 text-xs font-bold transition disabled:opacity-50"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span>+7 Days</span>
          </button>

          {/* Trigger Dry Spell (Dries soil -> Red Status) */}
          <button
            onClick={() => onTriggerScenario('DRY_SPELL', 3)}
            disabled={simulating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 text-xs font-bold transition disabled:opacity-50"
            title="Simulate 3 days heat & zero rain to trigger IRRIGATION REQUIRED"
          >
            <Sun className="w-3.5 h-3.5 text-red-400" />
            <span>Simulate Dry Spell (Stress)</span>
          </button>

          {/* Trigger Rain Scenario (Fills soil / Postpones) */}
          <button
            onClick={() => onTriggerScenario('HEAVY_RAIN', 1)}
            disabled={simulating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-500/30 text-xs font-bold transition disabled:opacity-50"
            title="Simulate 25mm rain event"
          >
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span>Simulate Rain Event</span>
          </button>
        </div>
      </div>
    </div>
  );
};

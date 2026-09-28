import React from 'react';
import {
  Droplet,
  Clock,
  Gauge,
  HelpCircle,
  Play,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  CloudRain,
  Activity
} from 'lucide-react';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { StatusBadge } from '../common/StatusBadge';

export const IrrigationHeroCard = ({ recommendation, onOpenWhyModal, onApplyIrrigation, applying }) => {
  if (!recommendation) return null;

  const {
    zone_name,
    crop_name,
    growth_stage,
    status,
    status_display,
    current_soil_water_mm,
    target_soil_water_mm,
    water_deficit_mm,
    recommended_irrigation_mm,
    gross_irrigation_mm,
    water_volume_liters,
    pump_duration_minutes,
    pump_duration_formatted,
    recommended_time,
    summary_text,
    irrigation_efficiency_pct
  } = recommendation;

  const isRed = status === 'IRRIGATION_REQUIRED';
  const isBlue = status === 'IRRIGATION_POSTPONED';
  const isYellow = status === 'MONITOR_SOIL';

  let panelClass = 'glass-panel-glow border-emerald-500/30';
  if (isRed) panelClass = 'glass-panel-danger border-red-500/40';
  else if (isBlue) panelClass = 'glass-panel-blue border-blue-500/40';
  else if (isYellow) panelClass = 'glass-panel-yellow border-amber-500/40';

  return (
    <div className={`rounded-2xl p-6 lg:p-7 shadow-2xl transition-all relative overflow-hidden ${panelClass}`}>
      {/* Background ambient glow circle */}
      <div
        className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isRed ? 'bg-red-500' : isBlue ? 'bg-blue-500' : isYellow ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
      />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {zone_name} • {crop_name} ({growth_stage})
            </span>
            <ProvenanceBadge type="CALCULATED" size="xs" />
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} size="lg" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={onOpenWhyModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700 hover:border-slate-500 text-xs font-bold tracking-wide shadow-md transition"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Why this decision?</span>
          </button>

          {isRed && (
            <button
              onClick={() => onApplyIrrigation(recommendation.zone_id)}
              disabled={applying}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{applying ? 'Applying...' : 'Apply Irrigation'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Narrative */}
      <p className="text-sm text-slate-200/90 leading-relaxed mb-6 font-medium bg-black/20 p-3.5 rounded-xl border border-white/5">
        {summary_text}
      </p>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1 */}
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Current Soil Water</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white font-mono">{current_soil_water_mm}</span>
            <span className="text-xs text-slate-400">mm</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Root zone storage</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Target Soil Water</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-300 font-mono">{target_soil_water_mm}</span>
            <span className="text-xs text-slate-400">mm</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Management target</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Water Deficit</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-bold font-mono ${water_deficit_mm > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {water_deficit_mm}
            </span>
            <span className="text-xs text-slate-400">mm</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Net depletion</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Gross Irrigation</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-cyan-300 font-mono">{gross_irrigation_mm}</span>
            <span className="text-xs text-slate-400">mm</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">@{irrigation_efficiency_pct}% eff</span>
        </div>

        {/* Metric 5 */}
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Water Volume</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-cyan-400 font-mono">
              {water_volume_liters > 0 ? water_volume_liters.toLocaleString() : '0'}
            </span>
            <span className="text-xs text-slate-400">L</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Zone total</span>
        </div>

        {/* Metric 6 */}
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pump Runtime</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-amber-300 font-mono">
              {pump_duration_minutes > 0 ? pump_duration_formatted : '0 min'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>@ {recommended_time}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useFarm } from '../../context/FarmContext';
import {
  Brain,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Activity,
  Layers,
  Zap,
  ShieldAlert,
  Droplet
} from 'lucide-react';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { StatusBadge } from '../common/StatusBadge';

export const AIPredictionWidget = () => {
  const { activeFarm } = useFarm();
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!activeFarm) return;
      try {
        const res = await api.get(`/farms/${activeFarm.id}/predictions`);
        setPredictions(res.data);
      } catch (err) {
        console.error('Failed to load ML predictions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [activeFarm]);

  if (loading || !predictions || !predictions.zone_predictions?.length) {
    return null;
  }

  const primaryZone = predictions.zone_predictions[0];
  const m1 = primaryZone.model_1_et;
  const m2 = primaryZone.model_2_soil;
  const m3 = primaryZone.model_3_irrigation;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-purple-500/30 shadow-xl space-y-4 bg-gradient-to-br from-slate-900/90 via-purple-950/20 to-slate-900/90">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">AI Multi-Model Predictive Core</h3>
              <ProvenanceBadge type="PREDICTED" size="xs" />
            </div>
            <p className="text-[11px] text-slate-400">
              Weather Data ➔ Feature Eng ➔ Models 1 & 2 ➔ Model 3 Synthesizer
            </p>
          </div>
        </div>

        <Link
          to="/predictions"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/20"
        >
          <span>Open AI Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3-Model Micro Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
        {/* Model 1 Box */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-purple-500/20 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-purple-400 font-bold uppercase">
            <span>Model 1: ET Demand</span>
            <span className="text-slate-400 font-normal">Confidence 95%</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white font-mono">{m1.predicted_etc_today_mm}</span>
            <span className="text-[10px] text-slate-400">mm/day ETc</span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            7-day cumulative loss: <strong className="text-purple-300 font-mono">{m1.cumulative_7d_etc_loss_mm} mm</strong>
          </p>
        </div>

        {/* Model 2 Box */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-cyan-500/20 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold uppercase">
            <span>Model 2: Soil Moisture</span>
            <span className="text-slate-400 font-normal">Stress Forecast</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-cyan-300 font-mono">{m2.current_water_mm}</span>
            <span className="text-[10px] text-slate-400">mm ({m2.current_moisture_pct}% θv)</span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            Threshold breach: <strong className={m2.projected_days_until_stress ? "text-amber-400 font-mono" : "text-emerald-400 font-mono"}>
              {m2.projected_days_until_stress ? `Day +${m2.projected_days_until_stress}` : "Optimal (>7d)"}
            </strong>
          </p>
        </div>

        {/* Model 3 Box */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-emerald-500/20 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold uppercase">
            <span>Model 3: Irrigation Sizing</span>
            <span className="text-slate-400 font-normal">Ensemble</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-emerald-300 font-mono">{m3.irrigation_needed_probability_pct}%</span>
            <span className="text-[10px] text-slate-400">Need Prob</span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            Predicted Volume: <strong className="text-white font-mono">{m3.predicted_water_volume_liters > 0 ? `${m3.predicted_water_volume_liters.toLocaleString()} L` : '0 L'}</strong>
          </p>
        </div>
      </div>

      {/* Synthesis Footnote */}
      <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-300 font-sans flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-white font-semibold">{primaryZone.zone_name}:</strong> {primaryZone.synthesis_summary}
        </p>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  Brain,
  Sparkles,
  ArrowRight,
  ArrowDown,
  Layers,
  Zap,
  TrendingDown,
  Droplets,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Sun,
  CloudRain,
  Sliders,
  BarChart2,
  Gauge
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { StatusBadge } from '../components/common/StatusBadge';

export const PredictionsPage = () => {
  const { activeFarm } = useFarm();
  const [predictionsData, setPredictionsData] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = async () => {
    if (!activeFarm) return;
    setLoading(true);
    try {
      const res = await api.get(`/farms/${activeFarm.id}/predictions`);
      setPredictionsData(res.data);
      if (res.data.zone_predictions?.length > 0 && !selectedZoneId) {
        setSelectedZoneId(res.data.zone_predictions[0].zone_id);
      }
    } catch (err) {
      console.error('Failed to load ML predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [activeFarm]);

  if (loading || !predictionsData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Running Multi-Stage Machine Learning Predictive Core...</p>
        </div>
      </div>
    );
  }

  const selectedZone = predictionsData.zone_predictions?.find(z => z.zone_id === selectedZoneId) || predictionsData.zone_predictions[0];
  const m1 = selectedZone?.model_1_et;
  const m2 = selectedZone?.model_2_soil;
  const m3 = selectedZone?.model_3_irrigation;

  // Combine Model 1 and Model 2 7-day trajectories into a single Recharts series
  const combinedTrajectory = m2?.forecast_trajectory?.map((item, idx) => {
    const etItem = m1?.forecast_series?.[idx] || {};
    return {
      date: item.date,
      day: `Day +${item.day_index}`,
      soil_water_mm: item.predicted_soil_water_mm,
      moisture_pct: item.predicted_moisture_pct,
      stress_threshold: item.stress_threshold_mm,
      field_capacity: item.field_capacity_mm,
      wilting_point: item.wilting_point_mm,
      etc_loss_mm: etItem.predicted_etc_mm || item.predicted_etc_loss_mm,
      rain_mm: item.predicted_rain_mm
    };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header & Zone Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-400" />
              <span>AI Multi-Model Predictive Studio</span>
            </h2>
            <ProvenanceBadge type="PREDICTED" size="xs" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hierarchical ML pipeline: Weather ➔ Feature Engineering ➔ Model 1 (ET) & Model 2 (Soil) ➔ Model 3 (Irrigation Synthesizer)
          </p>
        </div>

        {/* Zone Selector */}
        {predictionsData.zone_predictions?.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Select Zone:</span>
            <select
              value={selectedZone?.zone_id || ''}
              onChange={(e) => setSelectedZoneId(parseInt(e.target.value))}
              className="bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
            >
              {predictionsData.zone_predictions.map((z) => (
                <option key={z.zone_id} value={z.zone_id}>
                  🌱 {z.zone_name} ({z.crop_name})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Visual Pipeline Architecture Map (Section requested in Master Prompt diagram) */}
      <div className="glass-panel rounded-2xl p-6 border border-purple-500/40 shadow-2xl bg-gradient-to-r from-slate-950 via-purple-950/20 to-slate-950">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Pipeline Topology & Dataflow</h3>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>PIPELINE ACTIVE ({selectedZone?.features_engineered_count} FEATURES)</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono text-center">
          {/* Stage 1: Weather Telemetry */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 relative">
            <span className="text-[9px] text-cyan-400 uppercase font-bold block">Stage 1: Ingestion</span>
            <strong className="text-white text-xs block">Weather Telemetry</strong>
            <span className="text-[10px] text-slate-400 block">T, RH, Wind, Solar, Rain</span>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-purple-400 z-10 font-bold text-sm">➔</div>
          </div>

          {/* Stage 2: Feature Engineering */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/30 space-y-1 relative">
            <span className="text-[9px] text-purple-400 uppercase font-bold block">Stage 2: Features</span>
            <strong className="text-purple-300 text-xs block">Feature Eng Engine</strong>
            <span className="text-[10px] text-slate-400 block">VPD, Rn, ET0, Kc, RAW, Lags</span>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-purple-400 z-10 font-bold text-sm">➔</div>
          </div>

          {/* Stage 3: Models 1 & 2 Parallel */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/50 space-y-1 relative">
            <span className="text-[9px] text-amber-400 uppercase font-bold block">Stage 3: Parallel Core</span>
            <strong className="text-amber-300 text-xs block">Model 1 & Model 2</strong>
            <span className="text-[10px] text-slate-400 block">ET Demand & Soil Moisture</span>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-purple-400 z-10 font-bold text-sm">➔</div>
          </div>

          {/* Stage 4: Model 3 Synthesis */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-1 relative">
            <span className="text-[9px] text-emerald-400 uppercase font-bold block">Stage 4: Synthesis</span>
            <strong className="text-emerald-300 text-xs block">Model 3 (Decision & Vol)</strong>
            <span className="text-[10px] text-slate-400 block">Probability %, Liters, Mins</span>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-purple-400 z-10 font-bold text-sm">➔</div>
          </div>

          {/* Stage 5: Delivery */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/50 space-y-1">
            <span className="text-[9px] text-emerald-400 uppercase font-bold block">Stage 5: Output</span>
            <strong className="text-white text-xs block">Decision Support</strong>
            <span className="text-[10px] text-emerald-300 block">Live Rationale & Triggers</span>
          </div>
        </div>
      </div>

      {/* 3 Core Model Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Model 1: Evapotranspiration Forecaster Card */}
        <div className="glass-panel rounded-2xl p-5 border border-purple-500/30 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block">Core Model 1</span>
                <h3 className="text-sm font-bold text-white">Atmospheric ET Forecaster</h3>
              </div>
              <ProvenanceBadge type="PREDICTED" size="xs" />
            </div>

            <div className="grid grid-cols-2 gap-3 my-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Daily ETc Loss</span>
                <strong className="text-white text-lg font-bold">{m1?.predicted_etc_today_mm} mm/d</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">7d Cumulative Loss</span>
                <strong className="text-purple-300 text-lg font-bold">{m1?.cumulative_7d_etc_loss_mm} mm</strong>
              </div>
            </div>

            {/* Model 1 Feature Importances */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top ET Drivers</span>
              {m1?.top_feature_importances?.slice(0, 3).map((feat, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <span className="text-slate-300">{feat.display_name}</span>
                  <span className="font-mono text-purple-400 font-bold">{(feat.importance_score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Model Confidence Score: <strong className="text-emerald-400">{m1?.confidence_score_pct}%</strong>
          </div>
        </div>

        {/* Model 2: Soil Moisture Forecaster Card */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">Core Model 2</span>
                <h3 className="text-sm font-bold text-white">Soil Moisture Dynamics</h3>
              </div>
              <ProvenanceBadge type="PREDICTED" size="xs" />
            </div>

            <div className="grid grid-cols-2 gap-3 my-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Current Water</span>
                <strong className="text-cyan-300 text-lg font-bold">{m2?.current_water_mm} mm</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Stress Breach Horizon</span>
                <strong className={m2?.projected_days_until_stress ? "text-amber-400 text-lg font-bold" : "text-emerald-400 text-lg font-bold"}>
                  {m2?.projected_days_until_stress ? `In ${m2.projected_days_until_stress} days` : "> 7 days"}
                </strong>
              </div>
            </div>

            {/* Model 2 Feature Importances */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Soil Retention Drivers</span>
              {m2?.top_feature_importances?.slice(0, 3).map((feat, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <span className="text-slate-300">{feat.display_name}</span>
                  <span className="font-mono text-cyan-400 font-bold">{(feat.importance_score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Stress Risk Index: <strong className={m2?.stress_risk_index > 0.5 ? "text-red-400" : "text-emerald-400"}>{m2?.stress_risk_index} / 1.0</strong>
          </div>
        </div>

        {/* Model 3: Irrigation Decision & Volume Synthesizer Card */}
        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/40 shadow-xl space-y-4 flex flex-col justify-between bg-gradient-to-b from-slate-900/60 to-emerald-950/20">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">Core Model 3</span>
                <h3 className="text-sm font-bold text-white">Predictive Synthesizer</h3>
              </div>
              <StatusBadge status={m3?.predicted_decision} size="xs" />
            </div>

            <div className="grid grid-cols-2 gap-3 my-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Irrigation Probability</span>
                <strong className="text-emerald-300 text-lg font-bold">{m3?.irrigation_needed_probability_pct}%</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Predicted Volume</span>
                <strong className="text-white text-lg font-bold">
                  {m3?.predicted_water_volume_liters > 0 ? `${m3.predicted_water_volume_liters.toLocaleString()} L` : '0 L'}
                </strong>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Gross Depth:</span>
                <strong className="text-cyan-300">{m3?.predicted_gross_depth_mm} mm</strong>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Pump Duration:</span>
                <strong className="text-amber-300">{m3?.predicted_pump_duration_minutes} min</strong>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Recommended Window:</span>
                <strong className="text-purple-300">{m3?.optimal_window_recommendation}</strong>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>Leaching Risk: {m3?.leaching_risk_score}</span>
            <span>Under-Irrig Risk: {m3?.under_irrigation_risk_score}</span>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Multi-Model Trajectory Chart */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>7-Day Predictive Trajectory: Soil Moisture Depletion vs Crop ETc Loss</span>
            </h3>
            <p className="text-xs text-slate-400">
              Multi-model simulation showing projected soil water drawdown under forecasted atmospheric demand
            </p>
          </div>
          <ProvenanceBadge type="PREDICTED" size="xs" />
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedTrajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />

              <ReferenceLine y={m2?.field_capacity_mm} label={{ value: 'Field Capacity (FC)', fill: '#38bdf8', fontSize: 10 }} stroke="#38bdf8" strokeDasharray="3 3" />
              <ReferenceLine y={m2?.stress_threshold_mm} label={{ value: 'Stress Threshold (RAW)', fill: '#f59e0b', fontSize: 10 }} stroke="#f59e0b" strokeDasharray="3 3" />
              <ReferenceLine y={m2?.wilting_point_mm} label={{ value: 'Wilting Point (WP)', fill: '#ef4444', fontSize: 10 }} stroke="#ef4444" strokeDasharray="3 3" />

              <Line type="monotone" dataKey="soil_water_mm" name="Model 2: Predicted Soil Storage (mm)" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="etc_loss_mm" name="Model 1: Predicted Daily ETc (mm)" stroke="#c084fc" strokeWidth={2} />
              <Line type="monotone" dataKey="rain_mm" name="Predicted Infiltration Rain (mm)" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Synthesis Summary Callout */}
      <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
            AI Model Ensemble Synthesis Narrative ({selectedZone?.zone_name})
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {selectedZone?.synthesis_summary}
          </p>
        </div>
      </div>
    </div>
  );
};

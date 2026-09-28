import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  ShowerHead,
  Play,
  Clock,
  Droplet,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  CloudRain,
  HelpCircle,
  History,
  Activity,
  Zap,
  Layers
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { WhyDecisionModal } from '../components/dashboard/WhyDecisionModal';

export const IrrigationPage = () => {
  const { activeFarm } = useFarm();
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const [applyingZoneId, setApplyingZoneId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchIrrigationData = async () => {
    if (!activeFarm) return;
    setLoading(true);
    try {
      const [ovRes, histRes] = await Promise.all([
        api.get(`/farms/${activeFarm.id}/irrigation/recommendations`),
        api.get(`/farms/${activeFarm.id}/irrigation/history`)
      ]);
      setOverview(ovRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error('Failed to load irrigation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIrrigationData();
  }, [activeFarm]);

  const handleApplyIrrigation = async (zoneId) => {
    setApplyingZoneId(zoneId);
    try {
      await api.post(`/zones/${zoneId}/irrigation/apply`, {
        notes: 'Precision water application triggered from command center'
      });
      await fetchIrrigationData();
    } catch (err) {
      console.error('Error applying irrigation:', err);
    } finally {
      setApplyingZoneId(null);
    }
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Evaluating Precision Irrigation Decision Engine...</p>
        </div>
      </div>
    );
  }

  const recommendations = overview?.recommendations || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Precision Irrigation Command Center</h2>
            <ProvenanceBadge type="CALCULATED" size="xs" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Zone-specific scheduling, volumetric hydraulic sizing, and pump duration optimization
          </p>
        </div>
      </div>

      {/* Aggregate Farm Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Overall Status</span>
          <div className="my-2">
            <StatusBadge status={overview?.overall_status} size="sm" />
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {overview?.zones_requiring_irrigation_count} of {overview?.active_zones_count} zones need water
          </span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Irrigation Volume</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-extrabold text-cyan-300 font-mono">
              {overview?.total_recommended_volume_liters?.toLocaleString() || 0}
            </span>
            <span className="text-xs text-slate-400">Liters</span>
          </div>
          <span className="text-[11px] text-slate-500">Total applied volume today</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-amber-500/30">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Pump Runtime</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-extrabold text-amber-300 font-mono">
              {overview?.total_pump_duration_minutes || 0}
            </span>
            <span className="text-xs text-slate-400">mins</span>
          </div>
          <span className="text-[11px] text-slate-500">Across all operational pumps</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-purple-500/30">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Recommended Window</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl font-bold text-purple-300 font-mono">06:00 AM</span>
          </div>
          <span className="text-[11px] text-slate-500">Low evaporation & calm wind</span>
        </div>
      </div>

      {/* Zone-by-Zone Irrigation Recommendations Matrix */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Zone-Specific Decision Matrix</span>
        </h3>

        <div className="space-y-4">
          {recommendations.map((rec) => {
            const isRed = rec.status === 'IRRIGATION_REQUIRED';
            const isBlue = rec.status === 'IRRIGATION_POSTPONED';
            const isYellow = rec.status === 'MONITOR_SOIL';

            return (
              <div
                key={rec.zone_id}
                className={`glass-panel rounded-2xl p-5 border transition shadow-lg ${
                  isRed
                    ? 'border-red-500/40 bg-red-950/10'
                    : isBlue
                    ? 'border-blue-500/40 bg-blue-950/10'
                    : isYellow
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-bold text-white">{rec.zone_name}</h4>
                      <span className="text-xs text-slate-400 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono">
                        {rec.crop_name} • {rec.growth_stage} stage
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{rec.summary_text}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={rec.status} size="md" />

                    <button
                      onClick={() => {
                        setSelectedRec(rec);
                        setWhyModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Why?</span>
                    </button>

                    {isRed && (
                      <button
                        onClick={() => handleApplyIrrigation(rec.zone_id)}
                        disabled={applyingZoneId === rec.zone_id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{applyingZoneId === rec.zone_id ? 'Applying...' : 'Apply Now'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sizing Parameters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Soil Storage</span>
                    <strong className="text-slate-200">{rec.current_soil_water_mm} mm</strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Deficit</span>
                    <strong className={rec.water_deficit_mm > 0 ? 'text-red-400' : 'text-emerald-400'}>
                      {rec.water_deficit_mm} mm
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Gross Depth</span>
                    <strong className="text-cyan-300">{rec.gross_irrigation_mm} mm</strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Water Volume</span>
                    <strong className="text-cyan-400">{rec.water_volume_liters > 0 ? rec.water_volume_liters.toLocaleString() : '0'} L</strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Pump Runtime</span>
                    <strong className="text-amber-300">{rec.pump_duration_formatted}</strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Schedule Window</span>
                    <strong className="text-purple-300">@ {rec.recommended_time}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Applied Irrigation Logs Table */}
      <div className="glass-panel rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <span>Irrigation Application Audit History</span>
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No irrigation applications logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Zone</th>
                  <th className="pb-3">Depth (mm)</th>
                  <th className="pb-3">Volume (L)</th>
                  <th className="pb-3">Runtime (min)</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 text-slate-400">{h.applied_date}</td>
                    <td className="py-2.5 font-bold text-white">{h.zone_name}</td>
                    <td className="py-2.5 text-cyan-300 font-bold">{h.applied_depth_mm} mm</td>
                    <td className="py-2.5 text-cyan-400">{h.applied_volume_liters.toLocaleString()} L</td>
                    <td className="py-2.5 text-amber-300">{h.duration_minutes} min</td>
                    <td className="py-2.5 text-slate-400">{h.method}</td>
                    <td className="py-2.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                        {h.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Why This Decision Modal */}
      <WhyDecisionModal
        isOpen={whyModalOpen}
        onClose={() => setWhyModalOpen(false)}
        recommendation={selectedRec}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  Sprout,
  Droplet,
  Layers,
  ArrowRight,
  TrendingDown,
  FastForward,
  Play,
  Sun,
  CloudRain,
  ShieldAlert,
  Sliders
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
  ReferenceLine
} from 'recharts';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { StatusBadge } from '../components/common/StatusBadge';

export const SoilMonitoringPage = () => {
  const { activeFarm } = useFarm();
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [waterBalanceData, setWaterBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchSoilData = async () => {
    if (!activeFarm) return;
    setLoading(true);
    try {
      const zonesRes = await api.get(`/farms/${activeFarm.id}/zones`);
      setZones(zonesRes.data);

      const targetZoneId = selectedZoneId || zonesRes.data[0]?.id;
      if (targetZoneId) {
        setSelectedZoneId(targetZoneId);
        const wbRes = await api.get(`/zones/${targetZoneId}/water-balance`);
        setWaterBalanceData(wbRes.data);
      }
    } catch (err) {
      console.error('Failed to load soil water data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoilData();
  }, [activeFarm, selectedZoneId]);

  const handleStepSimulation = async (days = 1, scenario = null) => {
    if (!selectedZoneId) return;
    setSimulating(true);
    try {
      await api.post(`/zones/${selectedZoneId}/simulate`, { days, scenario });
      await fetchSoilData();
    } catch (err) {
      console.error('Simulation step failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading && !waterBalanceData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading Soil Water Balance Models...</p>
        </div>
      </div>
    );
  }

  const currentStatus = waterBalanceData?.current_status || {};
  const wb = currentStatus.water_balance_today || {};
  const series = waterBalanceData?.series || [];

  return (
    <div className="space-y-6">
      {/* Header & Zone Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Virtual Soil Moisture & Water Balance</h2>
            <ProvenanceBadge type="SIMULATED" size="xs" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic daily root zone hydrologic mass balance: W_t = W_t-1 + P + I - ETc - R - D
          </p>
        </div>

        {/* Zone Selector */}
        {zones.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Select Zone:</span>
            <select
              value={selectedZoneId || ''}
              onChange={(e) => setSelectedZoneId(parseInt(e.target.value))}
              className="bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  🌱 {z.name} ({z.crop?.name})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Top 4 Metrics & Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Soil Moisture</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-extrabold text-white font-mono">{currentStatus.volumetric_moisture_pct}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Volumetric fraction</span>
            <ProvenanceBadge type="SIMULATED" size="xs" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Available Storage</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-extrabold text-cyan-300 font-mono">{currentStatus.current_soil_water_mm}</span>
            <span className="text-xs text-slate-400">mm</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Target: {currentStatus.target_soil_water_mm} mm
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-purple-500/30">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Stress Threshold</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-extrabold text-purple-300 font-mono">{currentStatus.stress_threshold_mm}</span>
            <span className="text-xs text-slate-400">mm</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            RAW = {currentStatus.readily_available_water_mm} mm
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-700">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Hydrologic Status</span>
          <div className="my-2">
            <StatusBadge status={currentStatus.status} size="sm" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {currentStatus.relative_available_water_pct}% of plant available capacity
          </span>
        </div>
      </div>

      {/* Main 2-Column Section: Water Balance Breakdown Card + Simulation Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Water Balance Ledger Card (Section 18) (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Droplet className="w-4 h-4 text-cyan-400" />
                <span>Daily Water Balance Ledger</span>
              </h3>
              <ProvenanceBadge type="CALCULATED" size="xs" />
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Previous Soil Water:</span>
                <span className="text-slate-200 font-bold">{wb.previous_water_mm} mm</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <span className="font-bold text-sm">+</span> Rainfall (P):
                </span>
                <span className="font-bold">{wb.rainfall_mm} mm</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <span className="font-bold text-sm">+</span> Irrigation Applied (I):
                </span>
                <span className="font-bold">{wb.irrigation_mm} mm</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-amber-300">
                <span className="flex items-center gap-1.5">
                  <span className="font-bold text-sm">-</span> Crop ETc Loss:
                </span>
                <span className="font-bold">{wb.etc_mm} mm</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="font-bold text-sm">-</span> Surface Runoff (R):
                </span>
                <span>{wb.runoff_mm} mm</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="font-bold text-sm">-</span> Deep Drainage (D):
                </span>
                <span>{wb.drainage_mm} mm</span>
              </div>
            </div>

            {/* Total Ledger Sum Line */}
            <div className="mt-4 pt-3 border-t-2 border-slate-700 flex items-center justify-between text-sm font-mono font-bold">
              <span className="text-white">Remaining Soil Water:</span>
              <span className="text-cyan-400 text-base">{wb.remaining_water_mm} mm</span>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-500 font-mono">
            *Clamped within physical soil limits: Wilting Point ({currentStatus.wilting_point_mm} mm) ≤ Storage ≤ Field Capacity ({currentStatus.field_capacity_mm} mm).
          </div>
        </div>

        {/* Stateful Simulation Controls & Scenarios (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Simulation Experiment Panel</span>
              </h3>
              <ProvenanceBadge type="SIMULATED" size="xs" />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Simulate progressive weather days to observe soil moisture decline and test explainable irrigation triggers in real time.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                onClick={() => handleStepSimulation(1)}
                disabled={simulating}
                className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left transition flex items-start gap-3 disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-white block">Step +1 Day</strong>
                  <span className="text-[11px] text-slate-400">Advance water balance by 24h using real forecast ET</span>
                </div>
              </button>

              <button
                onClick={() => handleStepSimulation(7)}
                disabled={simulating}
                className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left transition flex items-start gap-3 disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                  <FastForward className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-white block">Step +7 Days</strong>
                  <span className="text-[11px] text-slate-400">Advance one full weekly forecast cycle</span>
                </div>
              </button>

              <button
                onClick={() => handleStepSimulation(3, 'DRY_SPELL')}
                disabled={simulating}
                className="p-4 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-left transition flex items-start gap-3 disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 mt-0.5">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-red-300 block">Dry Spell (Water Stress)</strong>
                  <span className="text-[11px] text-slate-400">3 days zero rain + high ETc to trigger RED status</span>
                </div>
              </button>

              <button
                onClick={() => handleStepSimulation(1, 'HEAVY_RAIN')}
                disabled={simulating}
                className="p-4 rounded-xl bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/30 text-left transition flex items-start gap-3 disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                  <CloudRain className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-blue-300 block">Heavy Rainfall Event</strong>
                  <span className="text-[11px] text-slate-400">25 mm rain event to replenish storage & trigger drainage</span>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 font-mono">
            Stateful Simulation: All simulated steps persist sequentially in the database table <code>soil_water_records</code>.
          </div>
        </div>
      </div>

      {/* Historical Time-Series Chart of Soil Water vs Field Capacity & Wilting Point */}
      <div className="glass-panel rounded-2xl p-5 shadow-xl">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-cyan-400" />
          <span>Soil Water Storage vs Agronomic Thresholds (mm)</span>
        </h4>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              
              {/* Field Capacity Line */}
              <ReferenceLine y={currentStatus.field_capacity_mm} label={{ value: 'Field Capacity (FC)', fill: '#38bdf8', fontSize: 10 }} stroke="#38bdf8" strokeDasharray="3 3" />
              
              {/* Stress Threshold Line */}
              <ReferenceLine y={currentStatus.stress_threshold_mm} label={{ value: 'Stress Threshold (RAW)', fill: '#f59e0b', fontSize: 10 }} stroke="#f59e0b" strokeDasharray="3 3" />
              
              {/* Wilting Point Line */}
              <ReferenceLine y={currentStatus.wilting_point_mm} label={{ value: 'Permanent Wilting Point (WP)', fill: '#ef4444', fontSize: 10 }} stroke="#ef4444" strokeDasharray="3 3" />

              <Line type="monotone" dataKey="soil_water_mm" name="Current Soil Water (mm)" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="etc_mm" name="Crop ETc (mm)" stroke="#a855f7" strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

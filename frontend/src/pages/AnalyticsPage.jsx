import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  BarChart3,
  Download,
  TrendingDown,
  Droplets,
  Zap,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  Leaf
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';

export const AnalyticsPage = () => {
  const { activeFarm } = useFarm();
  const [range, setRange] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!activeFarm) return;
    setLoading(true);
    try {
      const res = await api.get(`/farms/${activeFarm.id}/analytics`, {
        params: { range }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeFarm, range]);

  const handleExportCSV = () => {
    if (!activeFarm) return;
    window.open(`/api/farms/${activeFarm.id}/export/csv`, '_blank');
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Computing Precision Irrigation Water Savings & Energy Models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Water Conservation & Energy Analytics</h2>
            <ProvenanceBadge type="CALCULATED" size="xs" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparative performance: Fixed calendar schedule vs AgriFlow AI Precision Irrigation
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Filter Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            {['7d', '30d', '90d'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase ${
                  range === r
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 text-xs font-bold shadow-md transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV Audit</span>
          </button>
        </div>
      </div>

      {/* Hero Savings KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/40 bg-emerald-950/20">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">Estimated Water Saved</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-extrabold text-white font-mono">
              {analytics.estimated_saved_liters.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-bold">Liters</span>
          </div>
          <div className="mt-2 text-xs font-bold text-emerald-300 flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            <span>{analytics.estimated_savings_pct}% water conserved</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-amber-500/30">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Pump Runtime Saved</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-extrabold text-amber-300 font-mono">{analytics.estimated_pump_hours_saved}</span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">Reduced wear & pump lifespan extension</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Electricity Saved</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-extrabold text-cyan-300 font-mono">{analytics.estimated_electricity_kwh_saved}</span>
            <span className="text-xs text-slate-400">kWh</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">Based on 3.7 kW agricultural motor</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-purple-500/30">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Irrigation Events</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-extrabold text-purple-300 font-mono">{analytics.irrigation_events_count}</span>
            <span className="text-xs text-slate-400">events</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">Optimal timing without unnecessary cycles</span>
        </div>
      </div>

      {/* Traditional vs AgriFlow Comparison Chart (Recharts) */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Comparative Water Volume: Fixed Schedule vs Precision AgriFlow</span>
            </h3>
            <p className="text-xs text-slate-400">{analytics.disclaimer}</p>
          </div>
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.chart_series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="traditional_liters" name="Traditional Fixed Schedule (L)" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="agriflow_liters" name="AgriFlow AI Applied (L)" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="saved_liters" name="Net Conserved (L)" stroke="#38bdf8" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agronomic Averages Summary Table */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block">Average Daily ET₀</span>
          <strong className="text-slate-200 text-sm">{analytics.average_daily_et0_mm} mm/day</strong>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block">Average Daily ETc</span>
          <strong className="text-emerald-400 text-sm">{analytics.average_daily_etc_mm} mm/day</strong>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block">Mean Soil Moisture</span>
          <strong className="text-cyan-300 text-sm">{analytics.average_soil_moisture_pct}%</strong>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block">Total Rain Contribution</span>
          <strong className="text-purple-300 text-sm">{analytics.total_rainfall_mm} mm</strong>
        </div>
      </div>
    </div>
  );
};

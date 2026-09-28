import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  Droplets,
  Sun,
  Activity,
  Calculator,
  Info,
  Sliders,
  HelpCircle,
  TrendingUp,
  BookOpen
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
  AreaChart,
  Area
} from 'recharts';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';

export const ETAnalysisPage = () => {
  const { activeFarm } = useFarm();
  const [etOverview, setEtOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interactive Calculator State
  const [calcInputs, setCalcInputs] = useState({
    temperature_c: 28.0,
    relative_humidity_pct: 50.0,
    wind_speed_ms: 2.5,
    solar_radiation_wm2: 350.0,
    custom_kc: 1.15,
    crop_name: 'Tomato',
    growth_stage: 'Flowering'
  });
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const fetchETOverview = async () => {
    if (!activeFarm) return;
    setLoading(true);
    try {
      const res = await api.get(`/farms/${activeFarm.id}/et`);
      setEtOverview(res.data);
      if (res.data) {
        setCalcInputs(prev => ({
          ...prev,
          custom_kc: res.data.current_kc || 1.15,
          crop_name: res.data.crop_name || 'Tomato',
          growth_stage: res.data.growth_stage || 'Flowering'
        }));
      }
    } catch (err) {
      console.error('Failed to load ET overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const runCustomCalculation = async () => {
    setCalculating(true);
    try {
      const res = await api.post('/et/calculate', calcInputs);
      setCalcResult(res.data);
    } catch (err) {
      console.error('Custom ET calculation failed:', err);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchETOverview();
    runCustomCalculation();
  }, [activeFarm]);

  useEffect(() => {
    runCustomCalculation();
  }, [calcInputs]);

  if (loading || !etOverview) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Computing FAO-56 Penman-Monteith Psychrometrics...</p>
        </div>
      </div>
    );
  }

  const psych = calcResult?.psychrometrics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Evapotranspiration (ET) Scientific Analysis</h2>
            <ProvenanceBadge type="CALCULATED" size="xs" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            FAO-56 Penman-Monteith standard reference (ET₀) & crop water demand (ETc)
          </p>
        </div>
      </div>

      {/* Educational Banner (Evaporation vs Transpiration vs ET) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4 border-l-4 border-l-amber-500">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">Evaporation (E)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Water vaporized directly from bare soil surfaces and wet canopies driven by vapor pressure deficit (VPD) and solar radiation.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4 border-l-4 border-l-emerald-500">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">Transpiration (T)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Water taken up by plant root systems and released into the atmosphere through leaf stomata during essential photosynthesis.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4 border-l-4 border-l-cyan-500">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">Evapotranspiration (ET = E + T)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Combined moisture loss that must be replenished via irrigation or rainfall: <strong>ETc = ET₀ × Kc</strong>.
          </p>
        </div>
      </div>

      {/* 3 Core ET Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-purple-500/30">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Reference ET₀</span>
            <Sun className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{etOverview.current_et0_mm} <span className="text-xs text-slate-400">mm/day</span></div>
          <span className="text-[11px] text-slate-500 mt-2 block">Standard well-watered grass canopy</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Crop Coefficient (Kc)</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">{etOverview.current_kc}</div>
          <span className="text-[11px] text-slate-500 mt-2 block">{etOverview.crop_name} ({etOverview.growth_stage} stage)</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Crop ETc</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-300 font-mono">{etOverview.current_etc_mm} <span className="text-xs text-slate-400">mm/day</span></div>
          <span className="text-[11px] text-slate-500 mt-2 block">Actual crop water consumptive use</span>
        </div>
      </div>

      {/* Interactive FAO-56 Penman-Monteith Calculator & Psychrometrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Sliders (6 cols) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">Interactive FAO-56 Simulator</h3>
            </div>
            <ProvenanceBadge type="CALCULATED" size="xs" />
          </div>

          <div className="space-y-4">
            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Air Temperature (°C)</span>
                <span className="font-mono font-bold text-amber-400">{calcInputs.temperature_c}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="48"
                step="0.5"
                value={calcInputs.temperature_c}
                onChange={(e) => setCalcInputs({ ...calcInputs, temperature_c: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Relative Humidity Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Relative Humidity (%)</span>
                <span className="font-mono font-bold text-blue-400">{calcInputs.relative_humidity_pct}%</span>
              </div>
              <input
                type="range"
                min="15"
                max="95"
                step="1"
                value={calcInputs.relative_humidity_pct}
                onChange={(e) => setCalcInputs({ ...calcInputs, relative_humidity_pct: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Wind Speed Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Wind Speed at 2m (m/s)</span>
                <span className="font-mono font-bold text-emerald-400">{calcInputs.wind_speed_ms} m/s</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="8.0"
                step="0.1"
                value={calcInputs.wind_speed_ms}
                onChange={(e) => setCalcInputs({ ...calcInputs, wind_speed_ms: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Solar Radiation Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Solar Irradiance (W/m²)</span>
                <span className="font-mono font-bold text-purple-400">{calcInputs.solar_radiation_wm2} W/m²</span>
              </div>
              <input
                type="range"
                min="50"
                max="950"
                step="10"
                value={calcInputs.solar_radiation_wm2}
                onChange={(e) => setCalcInputs({ ...calcInputs, solar_radiation_wm2: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Crop Coefficient Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Crop Coefficient (Kc)</span>
                <span className="font-mono font-bold text-cyan-400">{calcInputs.custom_kc}</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="1.40"
                step="0.05"
                value={calcInputs.custom_kc}
                onChange={(e) => setCalcInputs({ ...calcInputs, custom_kc: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Computed Output Box */}
          <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Calculated ETc</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {calcResult?.crop_etc_mm_day || 0} mm/day
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Reference ET₀</span>
              <span className="text-xl font-bold text-purple-300 font-mono">
                {calcResult?.reference_et0_mm_day || 0} mm/day
              </span>
            </div>
          </div>
        </div>

        {/* Psychrometric Matrix Table (6 cols) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">Psychrometric Parameters</h3>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Slope of Vapor Curve (Δ):</span>
                <strong className="text-slate-200">{psych.delta_slope_kpa_c || '0.145'} kPa/°C</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Psychrometric Constant (γ):</span>
                <strong className="text-slate-200">{psych.psychrometric_constant_gamma || '0.067'} kPa/°C</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Saturation Vapor Pressure (es):</span>
                <strong className="text-slate-200">{psych.saturation_vapor_pressure_es_kpa || '3.78'} kPa</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Actual Vapor Pressure (ea):</span>
                <strong className="text-slate-200">{psych.actual_vapor_pressure_ea_kpa || '1.89'} kPa</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Vapor Pressure Deficit (VPD = es - ea):</span>
                <strong className="text-amber-400">{psych.vapor_pressure_deficit_vpd_kpa || '1.89'} kPa</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Net Solar Radiation (Rn):</span>
                <strong className="text-purple-300">{psych.net_radiation_rn_mj_m2 || '19.6'} MJ/m²/day</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Computed strictly according to United Nations FAO Irrigation & Drainage Paper No. 56.
          </div>
        </div>
      </div>

      {/* 7-Day ET Trend Curve */}
      <div className="glass-panel rounded-2xl p-5 shadow-xl">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>7-Day Reference ET₀ vs Crop Water Demand (ETc)</span>
        </h4>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={etOverview.trend_7d}>
              <defs>
                <linearGradient id="etcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="etc_mm" name={`Crop ETc (${etOverview.crop_name} mm/day)`} stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#etcGrad)" />
              <Line type="monotone" dataKey="et0_mm" name="Reference ET₀ (mm/day)" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

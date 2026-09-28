import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  Compass,
  RefreshCw,
  Clock,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';

export const WeatherPage = () => {
  const { activeFarm } = useFarm();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = async (force = false) => {
    if (!activeFarm) return;
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get(`/farms/${activeFarm.id}/weather`, {
        params: { refresh: force }
      });
      setWeather(res.data);
    } catch (err) {
      console.error('Failed to load weather:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [activeFarm]);

  if (loading || !weather) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading Open-Meteo Meteorological Telemetry...</p>
        </div>
      </div>
    );
  }

  const curr = weather.current || {};
  const forecast = weather.forecast_7d || [];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Agro-Meteorological Telemetry</h2>
            <ProvenanceBadge type="API" size="xs" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time atmospheric observations & 7-day numerical forecast for {activeFarm?.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-[11px] text-slate-400 font-mono hidden sm:block">
            <span>Cache: {weather.cached ? 'Hit' : 'Live'} • </span>
            <span>{new Date(weather.last_updated).toLocaleTimeString()}</span>
          </div>
          <button
            onClick={() => fetchWeather(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh Open-Meteo</span>
          </button>
        </div>
      </div>

      {/* Current Conditions 6-Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="glass-panel rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{curr.temperature_c}°C</div>
          <span className="text-[10px] text-slate-500 mt-1 block">{curr.weather_description}</span>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Relative Humidity</span>
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{curr.relative_humidity_pct}%</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Atmospheric moisture</span>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Wind Speed</span>
            <Wind className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{curr.wind_speed_ms} <span className="text-xs">m/s</span></div>
          <span className="text-[10px] text-slate-500 mt-1 block">({curr.wind_speed_kmh} km/h @ 10m)</span>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Rainfall</span>
            <CloudRain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">{curr.rainfall_mm} <span className="text-xs">mm</span></div>
          <span className="text-[10px] text-slate-500 mt-1 block">Accumulation today</span>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Solar Radiation</span>
            <Sun className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">{curr.solar_radiation_wm2} <span className="text-xs">W/m²</span></div>
          <span className="text-[10px] text-slate-500 mt-1 block">Shortwave irradiance</span>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Surface Pressure</span>
            <Compass className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-200 font-mono">{curr.surface_pressure_kpa} <span className="text-xs">kPa</span></div>
          <span className="text-[10px] text-slate-500 mt-1 block">Barometric altitude</span>
        </div>
      </div>

      {/* 7-Day Forecast Cards */}
      <div>
        <h3 className="text-sm font-bold text-white tracking-tight uppercase mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>7-Day Agricultural Forecast</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {forecast.map((day, i) => (
            <div
              key={day.date}
              className={`glass-panel rounded-xl p-3.5 text-center flex flex-col justify-between ${
                i === 0 ? 'border-emerald-500/40 bg-emerald-950/20' : ''
              }`}
            >
              <div>
                <span className="text-[11px] font-bold text-slate-300 block mb-1">
                  {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block mb-2">{day.date.slice(5)}</span>
                
                <div className="my-2">
                  <span className="text-base font-bold text-white font-mono">{day.temperature_max_c}°</span>
                  <span className="text-xs text-slate-500 font-mono ml-1">{day.temperature_min_c}°</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[10px] font-mono">
                <div className="text-cyan-400 flex items-center justify-center gap-1">
                  <CloudRain className="w-3 h-3" />
                  <span>{day.rainfall_sum_mm} mm ({day.precipitation_probability_pct}%)</span>
                </div>
                <div className="text-purple-300">ET₀: {day.et0_forecast_mm} mm</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recharts Analytics: Temperature Curves & Rainfall Probability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature & Humidity Forecast Chart */}
        <div className="glass-panel rounded-2xl p-5 shadow-xl">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-amber-400" />
            <span>7-Day Temperature Range & Humidity</span>
          </h4>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="temperature_max_c" name="Max Temp (°C)" stroke="#f59e0b" fillOpacity={1} fill="url(#tempGradient)" />
                <Line type="monotone" dataKey="temperature_min_c" name="Min Temp (°C)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="relative_humidity_mean_pct" name="Mean Humidity (%)" stroke="#a855f7" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precipitation Forecast & ET0 Demand Chart */}
        <div className="glass-panel rounded-2xl p-5 shadow-xl">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-cyan-400" />
            <span>Expected Rainfall vs Atmospheric Evaporative Demand (ET₀)</span>
          </h4>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="rainfall_sum_mm" name="Rainfall Sum (mm)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="et0_forecast_mm" name="Reference ET₀ (mm/day)" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

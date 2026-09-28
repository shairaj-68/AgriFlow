import React from 'react';
import { Menu, MapPin, RefreshCw, Sparkles, ChevronDown, Radio } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

export const Header = ({ onToggleSidebar }) => {
  const { user, loadDemo } = useAuth();
  const { farms, activeFarm, selectActiveFarm, triggerRefresh, loading } = useFarm();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 flex items-center justify-between">
      {/* Left section: Mobile toggle & Greeting */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 lg:hidden hover:bg-slate-700 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base lg:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Farmer'} <span className="text-xl">👋</span>
          </h2>
          {activeFarm && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeFarm.location_name}</span>
              <span className="font-mono text-[10px] text-slate-500">
                ({activeFarm.latitude.toFixed(4)}°N, {activeFarm.longitude.toFixed(4)}°E)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Farm dropdown, Simulation status, and Refresh */}
      <div className="flex items-center gap-3">
        {/* Phase 1 Simulation indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="text-slate-400">Soil Engine:</span>
          <ProvenanceBadge type="SIMULATED" size="xs" />
        </div>

        {/* Farm Switcher Dropdown */}
        {farms.length > 0 && (
          <div className="relative">
            <select
              value={activeFarm?.id || ''}
              onChange={(e) => {
                const selected = farms.find(f => f.id === parseInt(e.target.value));
                if (selected) selectActiveFarm(selected);
              }}
              className="appearance-none bg-slate-800/90 hover:bg-slate-750 text-slate-200 text-xs font-semibold px-3.5 py-2 pr-8 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm transition"
            >
              {farms.map(f => (
                <option key={f.id} value={f.id}>
                  🌱 {f.name} ({f.area} {f.area_unit})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        )}

        {/* Load Demo Farm Shortcut */}
        <button
          onClick={loadDemo}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
          title="Reload turnkey demo scenario"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo Farm</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={triggerRefresh}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Refresh All Telemetry & Forecasts"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};

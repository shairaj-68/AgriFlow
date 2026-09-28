import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  CloudSun,
  Droplets,
  Sprout,
  ShowerHead,
  Wheat,
  Grid,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  Layers,
  Brain
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFarm } from '../../context/FarmContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Prediction Studio', path: '/predictions', icon: Brain },
  { name: 'Farms', path: '/farms', icon: Map },
  { name: 'Weather', path: '/weather', icon: CloudSun },
  { name: 'ET Analysis', path: '/et-analysis', icon: Droplets },
  { name: 'Soil Monitoring', path: '/soil', icon: Sprout },
  { name: 'Irrigation', path: '/irrigation', icon: ShowerHead },
  { name: 'Crop Management', path: '/crops', icon: Wheat },
  { name: 'Farm Zones', path: '/zones', icon: Grid },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { activeFarm } = useFarm();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900/95 border-r border-slate-800/80 z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-xl">🌱</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                AgriFlow <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">AI</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Precision Irrigation DSS</p>
            </div>
          </div>
        </div>

        {/* Active Farm Quick Pill */}
        {activeFarm && (
          <div className="px-4 py-3 border-b border-slate-800/60 bg-emerald-950/20">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>ACTIVE FARM</span>
            </div>
            <p className="text-sm font-semibold text-slate-200 truncate">{activeFarm.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{activeFarm.location_name}</p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & Logout footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 text-xs">
                {user?.full_name?.charAt(0) || 'F'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Farmer'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

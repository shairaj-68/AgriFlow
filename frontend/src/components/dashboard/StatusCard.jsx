import React from 'react';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

export const StatusCard = ({ title, value, unit, icon: Icon, badge = 'API', trend, subtitle, color = 'emerald' }) => {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    blue: 'text-blue-400 bg-blue-950/40 border-blue-800/40',
    amber: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    purple: 'text-purple-400 bg-purple-950/40 border-purple-800/40',
    cyan: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
  };

  const activeColor = colorMap[color] || colorMap.emerald;

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col justify-between transition hover:border-slate-700/80 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg border ${activeColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">{title}</span>
        </div>
        <ProvenanceBadge type={badge} size="xs" />
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>{subtitle || 'Real-time calculation'}</span>
        {trend && <span className="font-mono text-emerald-400">{trend}</span>}
      </div>
    </div>
  );
};

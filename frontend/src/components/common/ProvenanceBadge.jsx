import React from 'react';

export const ProvenanceBadge = ({ type = 'SIMULATED', size = 'sm' }) => {
  const badgeType = type?.toUpperCase() || 'SIMULATED';

  const badgeStyles = {
    SIMULATED: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    REAL: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 animate-pulse-slow',
    API: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
    CALCULATED: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
    PREDICTED: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
  };

  const sizeStyles = {
    xs: 'text-[9px] px-1.5 py-0.5 font-mono tracking-wider font-semibold rounded',
    sm: 'text-[10px] px-2 py-0.5 font-mono tracking-wider font-semibold rounded-md',
    md: 'text-xs px-2.5 py-1 font-mono tracking-wider font-semibold rounded-md',
  };

  const currentStyle = badgeStyles[badgeType] || badgeStyles.SIMULATED;
  const currentSize = sizeStyles[size] || sizeStyles.sm;

  return (
    <span
      className={`inline-flex items-center gap-1 border ${currentStyle} ${currentSize} select-none shadow-sm uppercase`}
      title={`Scientific Data Source: ${badgeType}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {badgeType}
    </span>
  );
};

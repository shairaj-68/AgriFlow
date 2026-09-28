import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, CloudRain } from 'lucide-react';

export const StatusBadge = ({ status = 'NO_IRRIGATION_REQUIRED', label, showIcon = true, size = 'md' }) => {
  const normalized = status?.toUpperCase() || 'NO_IRRIGATION_REQUIRED';

  let config = {
    bg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
    icon: CheckCircle2,
    text: '✓ NO IRRIGATION REQUIRED',
  };

  if (normalized.includes('REQUIRED') && !normalized.includes('NO_')) {
    config = {
      bg: 'bg-red-950/80 border-red-500/50 text-red-300 animate-pulse-slow',
      icon: AlertOctagon,
      text: '🚨 IRRIGATION REQUIRED',
    };
  } else if (normalized.includes('POSTPONED')) {
    config = {
      bg: 'bg-blue-950/80 border-blue-500/50 text-blue-300',
      icon: CloudRain,
      text: '🌧️ IRRIGATION POSTPONED',
    };
  } else if (normalized.includes('MONITOR') || normalized.includes('SOON') || normalized.includes('MODERATE')) {
    config = {
      bg: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
      icon: AlertTriangle,
      text: '⚠️ IRRIGATION MAY BE REQUIRED SOON',
    };
  }

  const Icon = config.icon;
  const displayText = label || config.text;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2 font-semibold',
    lg: 'text-base px-4 py-2 gap-2.5 font-bold tracking-wide',
  };

  return (
    <span className={`inline-flex items-center rounded-lg border shadow-lg ${config.bg} ${sizeClasses[size] || sizeClasses.md}`}>
      {showIcon && <Icon className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
      <span>{displayText}</span>
    </span>
  );
};

import React from 'react';
import { X, CheckCircle2, AlertTriangle, AlertOctagon, Info, HelpCircle, BookOpen, Calculator } from 'lucide-react';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

export const WhyDecisionModal = ({ isOpen, onClose, recommendation }) => {
  if (!isOpen || !recommendation) return null;

  const {
    zone_name,
    crop_name,
    growth_stage,
    status_display,
    status_color,
    reasons = [],
    factors = [],
    scientific_basis = {},
    gross_irrigation_mm,
    water_volume_liters,
    pump_duration_formatted
  } = recommendation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Explainable Decision Support</h3>
              <p className="text-xs text-slate-400">Why AgriFlow AI generated this recommendation for {zone_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Decision Outcome Banner */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Decision Outcome</span>
              <span className="text-sm font-bold text-slate-100">{status_display}</span>
            </div>
            <ProvenanceBadge type="CALCULATED" size="sm" />
          </div>

          {/* Core Reasoning Checklist */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Scientific Evaluation Checklist</span>
            </h4>
            <div className="space-y-2.5 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              {reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                  <span className="text-emerald-400 font-bold text-sm leading-none mt-0.5">✓</span>
                  <span className="leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Factor Breakdown */}
          {factors.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Agronomic & Weather Factors</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {factors.map((f, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-750">
                    <span className="text-xs font-bold text-slate-200 block mb-1">{f.title}</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scientific Formulas & Transparency */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-400" />
              <span>Mathematical Equations Applied</span>
            </h4>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-[11px] text-purple-300/90 space-y-2">
              <div>{scientific_basis.fao_crop_et}</div>
              <div>{scientific_basis.soil_threshold}</div>
              <div>{scientific_basis.formula_water_volume}</div>
              <div>{scientific_basis.formula_pump_duration}</div>
            </div>
          </div>

          {/* Conclusion Box */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 leading-relaxed font-medium">
            <span className="font-bold text-white block mb-1">Conclusion:</span>
            {gross_irrigation_mm > 0 ? (
              <span>
                Apply approximately <strong className="text-white font-bold">{gross_irrigation_mm} mm</strong> ({water_volume_liters.toLocaleString()} L)
                to {zone_name} for <strong className="text-white font-bold">{pump_duration_formatted}</strong>.
              </span>
            ) : (
              <span>No water application is needed today. Crop transpiration demands are adequately satisfied by existing root zone storage.</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};

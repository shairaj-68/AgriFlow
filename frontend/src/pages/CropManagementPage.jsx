import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Wheat,
  Plus,
  Sprout,
  Activity,
  Layers,
  Info,
  X,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';

export const CropManagementPage = () => {
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    root_depth_min_cm: 30.0,
    root_depth_max_cm: 90.0,
    kc_seedling: 0.45,
    kc_vegetative: 0.75,
    kc_flowering: 1.15,
    kc_fruiting: 1.10,
    kc_maturity: 0.80,
    field_capacity_pct: 32.0,
    wilting_point_pct: 14.0,
    critical_depletion_fraction: 0.50,
    recommended_min_moisture_pct: 35.0,
    recommended_max_moisture_pct: 65.0,
  });

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const res = await api.get('/crops');
      setCrops(res.data);
      if (res.data.length > 0 && !selectedCrop) {
        setSelectedCrop(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load crops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const handleCreateCrop = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/crops', formData);
      await fetchCrops();
      setSelectedCrop(res.data);
      setModalOpen(false);
    } catch (err) {
      console.error('Error creating crop:', err);
    }
  };

  const getKcCurveData = (crop) => {
    if (!crop) return [];
    return [
      { stage: 'Seedling', kc: crop.kc_seedling },
      { stage: 'Vegetative', kc: crop.kc_vegetative },
      { stage: 'Flowering', kc: crop.kc_flowering },
      { stage: 'Fruiting', kc: crop.kc_fruiting },
      { stage: 'Maturity', kc: crop.kc_maturity },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Crop Agronomic Database & Kc Profiles</h2>
            <ProvenanceBadge type="CALCULATED" size="xs" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            FAO-56 growth stage coefficients (Kc), root depths, and allowable depletion factors
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Crop</span>
        </button>
      </div>

      {/* Main Grid: Crop Catalog List (5 cols) + Selected Crop Deep Dive (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Crop Cards List */}
        <div className="lg:col-span-5 space-y-3">
          {crops.map((crop) => {
            const isSelected = selectedCrop?.id === crop.id;
            return (
              <div
                key={crop.id}
                onClick={() => setSelectedCrop(crop)}
                className={`glass-panel rounded-2xl p-4 border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-emerald-500/60 bg-slate-800/90 shadow-lg shadow-emerald-950/20'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    🌾
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{crop.name}</h4>
                    <p className="text-[11px] text-slate-400">Peak Kc: {crop.kc_flowering} • Root: {crop.root_depth_max_cm} cm</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {crop.is_system ? 'FAO-56 Standard' : 'Custom'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Crop Detail & Kc Curve */}
        {selectedCrop && (
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{selectedCrop.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    FAO-56 Calibrated
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">{selectedCrop.description || 'Precision irrigation profile'}</p>
              </div>
            </div>

            {/* Growth Stage Kc Curve Recharts */}
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Crop Coefficient (Kc) Evolution Across Growth Stages</span>
              </h4>
              <div className="h-[200px] bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getKcCurveData(selectedCrop)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="stage" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis domain={[0, 1.5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="kc" name="Crop Coefficient (Kc)" stroke="#22c55e" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stage Kc Values 5-Grid */}
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Seedling</span>
                <strong className="text-slate-200">{selectedCrop.kc_seedling}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Vegetative</span>
                <strong className="text-slate-200">{selectedCrop.kc_vegetative}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300">
                <span className="text-[10px] text-emerald-400 block uppercase font-bold">Flowering</span>
                <strong className="text-emerald-400 text-sm">{selectedCrop.kc_flowering}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Fruiting</span>
                <strong className="text-slate-200">{selectedCrop.kc_fruiting}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Maturity</span>
                <strong className="text-slate-200">{selectedCrop.kc_maturity}</strong>
              </div>
            </div>

            {/* Soil Tolerances Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Root Depth</span>
                <strong className="text-slate-200">{selectedCrop.root_depth_min_cm} - {selectedCrop.root_depth_max_cm} cm</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Field Capacity</span>
                <strong className="text-cyan-300">{selectedCrop.field_capacity_pct}% θv</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Wilting Point</span>
                <strong className="text-red-300">{selectedCrop.wilting_point_pct}% θv</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Allowable Depletion (p)</span>
                <strong className="text-amber-300">{selectedCrop.critical_depletion_fraction * 100}%</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Custom Crop Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
              <h3 className="text-base font-bold text-white tracking-tight">Add Custom Crop Profile</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCrop} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Crop Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Bell Pepper"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Horticultural cash crop"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Stage Coefficients (Kc)</label>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Seedling</span>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={formData.kc_seedling}
                      onChange={(e) => setFormData({ ...formData, kc_seedling: parseFloat(e.target.value) || 0.4 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Vegetative</span>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={formData.kc_vegetative}
                      onChange={(e) => setFormData({ ...formData, kc_vegetative: parseFloat(e.target.value) || 0.7 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Flowering</span>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={formData.kc_flowering}
                      onChange={(e) => setFormData({ ...formData, kc_flowering: parseFloat(e.target.value) || 1.1 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Fruiting</span>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={formData.kc_fruiting}
                      onChange={(e) => setFormData({ ...formData, kc_fruiting: parseFloat(e.target.value) || 1.05 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Maturity</span>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={formData.kc_maturity}
                      onChange={(e) => setFormData({ ...formData, kc_maturity: parseFloat(e.target.value) || 0.75 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg">
                  Save Crop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

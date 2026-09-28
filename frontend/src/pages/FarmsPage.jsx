import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Layers,
  Sprout,
  Droplets,
  Activity,
  X,
  Gauge
} from 'lucide-react';
import { LocationPickerMap } from '../components/maps/LocationPickerMap';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';

export const FarmsPage = () => {
  const { farms, activeFarm, selectActiveFarm, fetchFarms } = useFarm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location_name: '',
    latitude: 11.3482,
    longitude: 77.7172,
    area: 2.0,
    area_unit: 'Acre',
    soil_type: 'Loam',
    root_zone_depth_cm: 60.0,
    irrigation_method: 'Drip',
    pump_flow_rate_lpm: 500.0,
    irrigation_efficiency: 0.90,
  });
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingFarm(null);
    setFormData({
      name: '',
      location_name: 'Selected Region',
      latitude: 11.3482,
      longitude: 77.7172,
      area: 2.5,
      area_unit: 'Acre',
      soil_type: 'Loam',
      root_zone_depth_cm: 60.0,
      irrigation_method: 'Drip',
      pump_flow_rate_lpm: 500.0,
      irrigation_efficiency: 0.90,
    });
    setModalOpen(true);
  };

  const openEditModal = (farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name,
      location_name: farm.location_name,
      latitude: farm.latitude,
      longitude: farm.longitude,
      area: farm.area,
      area_unit: farm.area_unit,
      soil_type: farm.soil_type,
      root_zone_depth_cm: farm.root_zone_depth_cm,
      irrigation_method: farm.irrigation_method,
      pump_flow_rate_lpm: farm.pump_flow_rate_lpm,
      irrigation_efficiency: farm.irrigation_efficiency,
    });
    setModalOpen(true);
  };

  const handleMethodChange = (method) => {
    let eff = 0.90;
    if (method.toLowerCase() === 'sprinkler') eff = 0.75;
    else if (method.toLowerCase() === 'flood') eff = 0.60;
    setFormData({
      ...formData,
      irrigation_method: method,
      irrigation_efficiency: eff,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingFarm) {
        await api.put(`/farms/${editingFarm.id}`, formData);
      } else {
        await api.post('/farms', formData);
      }
      await fetchFarms();
      setModalOpen(false);
    } catch (err) {
      console.error('Error saving farm:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (farmId, farmName) => {
    if (window.confirm(`Are you sure you want to delete '${farmName}'?`)) {
      try {
        await api.delete(`/farms/${farmId}`);
        await fetchFarms();
      } catch (err) {
        console.error('Error deleting farm:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Farm Management</span>
            <ProvenanceBadge type="CALCULATED" size="xs" />
          </h2>
          <p className="text-xs text-slate-400">Configure agricultural holdings, coordinate bounds, soil profiles, and hydraulic pumps</p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Farm</span>
        </button>
      </div>

      {/* Farms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {farms.map((farm) => {
          const isActive = activeFarm?.id === farm.id;
          return (
            <div
              key={farm.id}
              className={`glass-panel rounded-2xl p-5 shadow-xl flex flex-col justify-between transition relative overflow-hidden ${
                isActive ? 'border-emerald-500/60 ring-1 ring-emerald-500/40 bg-slate-900/90' : 'hover:border-slate-700'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-bold px-3 py-0.5 rounded-bl-lg tracking-wider uppercase">
                  Active
                </div>
              )}

              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-1">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-white truncate">{farm.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span className="truncate">{farm.location_name}</span>
                    </p>
                  </div>
                </div>

                {/* Specs Pill Matrix */}
                <div className="grid grid-cols-2 gap-2 my-4 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Area</span>
                    <strong className="text-slate-200">{farm.area} {farm.area_unit}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Soil Type</span>
                    <strong className="text-slate-200">{farm.soil_type}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Irrigation</span>
                    <strong className="text-slate-200">{farm.irrigation_method} ({farm.irrigation_efficiency * 100}%)</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Pump Rate</span>
                    <strong className="text-slate-200">{farm.pump_flow_rate_lpm} L/min</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {!isActive ? (
                  <button
                    onClick={() => selectActiveFarm(farm)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Set Active</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(farm)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                    title="Edit Farm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(farm.id, farm.name)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                    title="Delete Farm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Farm Create/Edit Modal with Leaflet Map */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingFarm ? 'Edit Farm Parameters' : 'Register New Precision Farm'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Farm Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Green Valley Farm"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Location Name</label>
                  <input
                    type="text"
                    required
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    placeholder="e.g. Erode, Tamil Nadu"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Interactive Location Picker Map */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Farm Coordinates (OpenStreetMap / Leaflet)
                </label>
                <LocationPickerMap
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={(lat, lng, locName) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                      location_name: locName || prev.location_name
                    }));
                  }}
                />
              </div>

              {/* Area & Units */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Area</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Area Unit</label>
                  <select
                    value={formData.area_unit}
                    onChange={(e) => setFormData({ ...formData, area_unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Acre">Acre (4,046.86 m²)</option>
                    <option value="Hectare">Hectare (10,000 m²)</option>
                    <option value="m2">Square Meters (m²)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Soil Type</label>
                  <select
                    value={formData.soil_type}
                    onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Loam">Loam</option>
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Silty Clay">Silty Clay</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                  </select>
                </div>
              </div>

              {/* Hydraulic & Equipment Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Irrigation Method</label>
                  <select
                    value={formData.irrigation_method}
                    onChange={(e) => handleMethodChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Drip">Drip Irrigation (90% eff)</option>
                    <option value="Sprinkler">Sprinkler System (75% eff)</option>
                    <option value="Flood">Surface / Flood (60% eff)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Pump Flow Rate (L/min)</label>
                  <input
                    type="number"
                    step="10"
                    min="10"
                    required
                    value={formData.pump_flow_rate_lpm}
                    onChange={(e) => setFormData({ ...formData, pump_flow_rate_lpm: parseFloat(e.target.value) || 300.0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Efficiency Factor</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.4"
                    max="1.0"
                    required
                    value={formData.irrigation_efficiency}
                    onChange={(e) => setFormData({ ...formData, irrigation_efficiency: parseFloat(e.target.value) || 0.90 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingFarm ? 'Update Farm' : 'Create Farm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

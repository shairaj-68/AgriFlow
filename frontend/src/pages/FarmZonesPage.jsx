import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  Grid,
  Plus,
  Trash2,
  Edit2,
  Sprout,
  Droplet,
  Layers,
  MapPin,
  X,
  Gauge
} from 'lucide-react';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { FarmMapWidget } from '../components/dashboard/FarmMapWidget';

export const FarmZonesPage = () => {
  const { activeFarm } = useFarm();
  const [zones, setZones] = useState([]);
  const [crops, setCrops] = useState([]);
  const [irrigationOverview, setIrrigationOverview] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    crop_id: 1,
    growth_stage: 'Flowering',
    area: 1.0,
    area_unit: 'Acre',
    soil_type: 'Loam',
    root_zone_depth_cm: 60.0,
    field_capacity_mm: 110.0,
    wilting_point_mm: 45.0,
    current_soil_water_mm: 75.0,
    target_soil_water_mm: 100.0,
    irrigation_method: 'Drip',
    pump_flow_rate_lpm: 300.0,
    irrigation_efficiency: 0.90,
    polygon_json: null
  });

  const fetchData = async () => {
    if (!activeFarm) return;
    setLoading(true);
    try {
      const [zonesRes, cropsRes, irrigRes] = await Promise.all([
        api.get(`/farms/${activeFarm.id}/zones`),
        api.get('/crops'),
        api.get(`/farms/${activeFarm.id}/irrigation/recommendations`)
      ]);
      setZones(zonesRes.data);
      setCrops(cropsRes.data);
      setIrrigationOverview(irrigRes.data);
    } catch (err) {
      console.error('Failed to load farm zones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeFarm]);

  const openCreateModal = () => {
    setEditingZone(null);
    setFormData({
      name: `Zone ${zones.length + 1}`,
      crop_id: crops[0]?.id || 1,
      growth_stage: 'Flowering',
      area: 1.0,
      area_unit: 'Acre',
      soil_type: 'Sandy Loam',
      root_zone_depth_cm: 60.0,
      field_capacity_mm: 110.0,
      wilting_point_mm: 45.0,
      current_soil_water_mm: 75.0,
      target_soil_water_mm: 100.0,
      irrigation_method: 'Drip',
      pump_flow_rate_lpm: 300.0,
      irrigation_efficiency: 0.90,
      polygon_json: null
    });
    setModalOpen(true);
  };

  const openEditModal = (zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      crop_id: zone.crop_id,
      growth_stage: zone.growth_stage,
      area: zone.area,
      area_unit: zone.area_unit,
      soil_type: zone.soil_type,
      root_zone_depth_cm: zone.root_zone_depth_cm,
      field_capacity_mm: zone.field_capacity_mm,
      wilting_point_mm: zone.wilting_point_mm,
      current_soil_water_mm: zone.current_soil_water_mm,
      target_soil_water_mm: zone.target_soil_water_mm,
      irrigation_method: zone.irrigation_method,
      pump_flow_rate_lpm: zone.pump_flow_rate_lpm,
      irrigation_efficiency: zone.irrigation_efficiency,
      polygon_json: zone.polygon_json
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingZone) {
        await api.put(`/zones/${editingZone.id}`, formData);
      } else {
        await api.post(`/farms/${activeFarm.id}/zones`, {
          ...formData,
          farm_id: activeFarm.id
        });
      }
      await fetchData();
      setModalOpen(false);
    } catch (err) {
      console.error('Error saving zone:', err);
    }
  };

  const handleDelete = async (zoneId, name) => {
    if (window.confirm(`Delete zone '${name}'?`)) {
      try {
        await api.delete(`/zones/${zoneId}`);
        await fetchData();
      } catch (err) {
        console.error('Error deleting zone:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Farm Zone Partitioning</h2>
            <ProvenanceBadge type="CALCULATED" size="xs" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage micro-parcels, crop staging, soil capacities, and zone-specific pump lines
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Zone</span>
        </button>
      </div>

      {/* Grid: Zone Map (5 cols) + Zone Cards (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Box */}
        <div className="lg:col-span-5">
          <FarmMapWidget
            farm={activeFarm}
            recommendations={irrigationOverview?.recommendations || []}
          />
        </div>

        {/* Zones List */}
        <div className="lg:col-span-7 space-y-4">
          {zones.map((zone) => {
            const rec = irrigationOverview?.recommendations?.find(r => r.zone_id === zone.id);
            const status = rec?.status || 'NO_IRRIGATION_REQUIRED';

            return (
              <div
                key={zone.id}
                className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{zone.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Crop: <strong className="text-emerald-400">{zone.crop?.name}</strong> • Stage: <strong className="text-slate-200">{zone.growth_stage}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={status} size="sm" />
                    <button
                      onClick={() => openEditModal(zone)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(zone.id, zone.name)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Specs 4-Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Area</span>
                    <strong className="text-slate-200">{zone.area} {zone.area_unit}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Current Water</span>
                    <strong className="text-cyan-300">{zone.current_soil_water_mm} mm</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Field Capacity</span>
                    <strong className="text-slate-300">{zone.field_capacity_mm} mm</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Wilting Point</span>
                    <strong className="text-slate-300">{zone.wilting_point_mm} mm</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Zone Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingZone ? 'Edit Zone Parameters' : 'Add Farm Zone'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Zone Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Cultivated Crop</label>
                  <select
                    value={formData.crop_id}
                    onChange={(e) => setFormData({ ...formData, crop_id: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>🌾 {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Growth Stage</label>
                  <select
                    value={formData.growth_stage}
                    onChange={(e) => setFormData({ ...formData, growth_stage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Seedling">Seedling</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Fruiting">Fruiting</option>
                    <option value="Maturity">Maturity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Zone Area</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Area Unit</label>
                  <select
                    value={formData.area_unit}
                    onChange={(e) => setFormData({ ...formData, area_unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="Acre">Acre</option>
                    <option value="Hectare">Hectare</option>
                    <option value="m2">m²</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Field Capacity (mm)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.field_capacity_mm}
                    onChange={(e) => setFormData({ ...formData, field_capacity_mm: parseFloat(e.target.value) || 110.0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Wilting Point (mm)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.wilting_point_mm}
                    onChange={(e) => setFormData({ ...formData, wilting_point_mm: parseFloat(e.target.value) || 45.0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Target Water (mm)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.target_soil_water_mm}
                    onChange={(e) => setFormData({ ...formData, target_soil_water_mm: parseFloat(e.target.value) || 100.0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg">
                  {editingZone ? 'Update Zone' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

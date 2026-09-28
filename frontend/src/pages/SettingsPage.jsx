import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  Settings,
  Cpu,
  Radio,
  Wifi,
  Plus,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Sparkles
} from 'lucide-react';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';

export const SettingsPage = () => {
  const { activeFarm } = useFarm();
  const [sensors, setSensors] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pingingId, setPingingId] = useState(null);

  const fetchSensorData = async () => {
    if (!activeFarm) return;
    setLoading(true);
    try {
      const [sensRes, readRes] = await Promise.all([
        api.get(`/farms/${activeFarm.id}/sensors`),
        api.get(`/farms/${activeFarm.id}/sensors/readiness`)
      ]);
      setSensors(sensRes.data);
      setReadiness(readRes.data);
    } catch (err) {
      console.error('Failed to load sensor settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
  }, [activeFarm]);

  const handleMockPing = async (deviceId) => {
    setPingingId(deviceId);
    try {
      await api.post(`/sensors/${deviceId}/mock-ping`, null, {
        params: { telemetry_value: '38.5' }
      });
      await fetchSensorData();
    } catch (err) {
      console.error('Error pinging sensor:', err);
    } finally {
      setPingingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">System Architecture & IoT Hardware Readiness</h2>
            <ProvenanceBadge type="SIMULATED" size="xs" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Phase 1 Software Simulation engine and Phase 2 ESP32 / MQTT sensor abstraction hub
          </p>
        </div>
      </div>

      {/* Sensor Readiness Status Card */}
      <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sensor Abstraction Architecture</h3>
              <p className="text-xs text-emerald-400 font-semibold">{readiness?.current_phase || 'Phase 1 Active'}</p>
            </div>
          </div>
          <ProvenanceBadge type="REAL" size="sm" />
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The AgriFlow AI core irrigation engine is strictly decoupled from telemetry sources via the <code>SoilDataProvider</code> interface.
          In Phase 1, stateful deterministic simulations drive water balance. In Phase 2, real ESP32 edge microcontrollers can publish telemetry over MQTT without requiring algorithm rewrites.
        </p>

        {/* Specs 4-Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono pt-2">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Active Data Provider</span>
            <strong className="text-amber-300">{readiness?.data_provider_mode || 'SIMULATED'}</strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">MQTT Broker Gateway</span>
            <strong className="text-slate-200 truncate block">{readiness?.mqtt_broker_endpoint}</strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Firmware Protocol</span>
            <strong className="text-cyan-300 truncate block">{readiness?.esp32_firmware_support}</strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Registered Edge Devices</span>
            <strong className="text-emerald-400 text-sm">{sensors.length} nodes</strong>
          </div>
        </div>
      </div>

      {/* IoT Devices Registry Table */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>IoT Sensor Registry (Phase 2 ESP32 Ready)</span>
          </h3>
        </div>

        {sensors.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No sensor hardware registered. Application is operating in pure Phase 1 software simulation.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3">Device Name</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Hardware ID / MAC</th>
                  <th className="pb-3">MQTT Topic</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Last Value</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {sensors.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-bold text-white">{s.device_name}</td>
                    <td className="py-3 text-slate-300">{s.device_type}</td>
                    <td className="py-3 text-slate-400">{s.device_id}</td>
                    <td className="py-3 text-slate-400 text-[11px]">{s.topic}</td>
                    <td className="py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        s.status === 'ONLINE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : s.status === 'SIMULATED'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 text-cyan-300 font-bold">
                      {s.last_value ? `${s.last_value}%` : '—'}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleMockPing(s.device_id)}
                        disabled={pingingId === s.device_id}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-[11px] font-bold transition disabled:opacity-50"
                        title="Simulate incoming MQTT telemetry packet"
                      >
                        {pingingId === s.device_id ? 'Pinging...' : 'Simulate MQTT Ping'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Global Agronomic Settings */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Scientific Units & Precision Parameters</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Depth Units</span>
            <strong className="text-slate-200">Millimeters (mm) [1 mm = 1 L/m²]</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Area Conversion</span>
            <strong className="text-slate-200">1 Acre = 4,046.86 m² • 1 Ha = 10,000 m²</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Meteorology Source</span>
            <strong className="text-slate-200">Open-Meteo High-Resolution Numerical Model</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

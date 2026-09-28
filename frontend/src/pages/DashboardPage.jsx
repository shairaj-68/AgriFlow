import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import api from '../services/api';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Sun,
  Activity,
  Zap,
  Sprout,
  ShieldCheck,
  RefreshCw,
  AlertOctagon,
  Layers,
  HelpCircle,
  Play
} from 'lucide-react';
import { StatusCard } from '../components/dashboard/StatusCard';
import { IrrigationHeroCard } from '../components/dashboard/IrrigationHeroCard';
import { WhyDecisionModal } from '../components/dashboard/WhyDecisionModal';
import { QuickSimulationBar } from '../components/dashboard/QuickSimulationBar';
import { FarmMapWidget } from '../components/dashboard/FarmMapWidget';
import { StatusBadge } from '../components/common/StatusBadge';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { AIPredictionWidget } from '../components/dashboard/AIPredictionWidget';

export const DashboardPage = () => {
  const { activeFarm, loading: farmLoading, triggerRefresh } = useFarm();
  const [weatherData, setWeatherData] = useState(null);
  const [etData, setEtData] = useState(null);
  const [soilData, setSoilData] = useState([]);
  const [irrigationOverview, setIrrigationOverview] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!activeFarm) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [weatherRes, etRes, soilRes, irrigRes] = await Promise.all([
        api.get(`/farms/${activeFarm.id}/weather`),
        api.get(`/farms/${activeFarm.id}/et`),
        api.get(`/farms/${activeFarm.id}/soil`),
        api.get(`/farms/${activeFarm.id}/irrigation/recommendations`)
      ]);

      setWeatherData(weatherRes.data);
      setEtData(etRes.data);
      setSoilData(soilRes.data);
      setIrrigationOverview(irrigRes.data);

      // Select first zone recommendation for the hero card
      if (irrigRes.data.recommendations?.length > 0) {
        // Prioritize a zone requiring irrigation if any, else first
        const reqZone = irrigRes.data.recommendations.find(r => r.status === 'IRRIGATION_REQUIRED') || irrigRes.data.recommendations[0];
        setSelectedRecommendation(reqZone);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeFarm]);

  const handleSimulateDays = async (days) => {
    if (!selectedRecommendation) return;
    setSimulating(true);
    try {
      await api.post(`/zones/${selectedRecommendation.zone_id}/simulate`, { days });
      await fetchDashboardData();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleTriggerScenario = async (scenario, days = 1) => {
    if (!activeFarm) return;
    setSimulating(true);
    try {
      await api.post(`/farms/${activeFarm.id}/simulate-scenario`, null, {
        params: { scenario, days }
      });
      await fetchDashboardData();
    } catch (err) {
      console.error('Scenario simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleApplyIrrigation = async (zoneId) => {
    setApplying(true);
    try {
      await api.post(`/zones/${zoneId}/irrigation/apply`, {
        notes: 'Applied precision irrigation via dashboard'
      });
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to apply irrigation:', err);
    } finally {
      setApplying(false);
    }
  };

  if (farmLoading || (loading && !weatherData)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Retrieving Meteorological Telemetry & Computing ET...</p>
        </div>
      </div>
    );
  }

  if (!activeFarm) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center max-w-xl mx-auto my-12">
        <Sprout className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Active Farm Configured</h3>
        <p className="text-sm text-slate-400 mb-6">Create your first precision farm or launch the instant demo scenario to get started.</p>
        <button
          onClick={() => window.location.href = '/farms'}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition"
        >
          Manage Farms
        </button>
      </div>
    );
  }

  const currentW = weatherData?.current || {};
  const primarySoil = soilData[0] || {};

  return (
    <div className="space-y-6">
      {/* Simulation Sandbox Control Bar */}
      <QuickSimulationBar
        onSimulateDays={handleSimulateDays}
        onTriggerScenario={handleTriggerScenario}
        simulating={simulating}
      />

      {/* 6 Key Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatusCard
          title="Temperature"
          value={currentW.temperature_c ?? 34.2}
          unit="°C"
          icon={Thermometer}
          badge="API"
          subtitle={currentW.weather_description || 'Clear sky'}
          color="amber"
        />

        <StatusCard
          title="Humidity"
          value={currentW.relative_humidity_pct ?? 52}
          unit="%"
          icon={Droplets}
          badge="API"
          subtitle="Relative humidity"
          color="blue"
        />

        <StatusCard
          title="Soil Moisture"
          value={primarySoil.volumetric_moisture_pct ?? 38.0}
          unit="%"
          icon={Sprout}
          badge="SIMULATED"
          subtitle="Root zone moisture"
          color="emerald"
        />

        <StatusCard
          title="Rainfall"
          value={currentW.rainfall_mm ?? 0.0}
          unit="mm"
          icon={CloudRain}
          badge="API"
          subtitle="Precipitation today"
          color="cyan"
        />

        <StatusCard
          title="Reference ET₀"
          value={etData?.current_et0_mm ?? 5.0}
          unit="mm/day"
          icon={Sun}
          badge="CALCULATED"
          subtitle="FAO-56 Penman-Monteith"
          color="purple"
        />

        <StatusCard
          title="Crop ETc"
          value={etData?.current_etc_mm ?? 5.75}
          unit="mm/day"
          icon={Activity}
          badge="CALCULATED"
          subtitle={`Kc = ${etData?.current_kc ?? 1.15}`}
          color="emerald"
        />
      </div>

      {/* AI Multi-Model Predictive Core Banner */}
      <AIPredictionWidget />

      {/* Primary Hero Irrigation Decision Card */}
      {selectedRecommendation && (
        <IrrigationHeroCard
          recommendation={selectedRecommendation}
          onOpenWhyModal={() => setWhyModalOpen(true)}
          onApplyIrrigation={handleApplyIrrigation}
          applying={applying}
        />
      )}

      {/* Multi-Zone Precision Agriculture Matrix & Farm Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Farm Zones Precision Irrigation Matrix (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Zone-Specific Precision Irrigation</h3>
                  <p className="text-[11px] text-slate-400">Differential water application across farm zones</p>
                </div>
              </div>
              <ProvenanceBadge type="CALCULATED" size="xs" />
            </div>

            {/* Zones Table / List */}
            <div className="space-y-3">
              {irrigationOverview?.recommendations?.map((rec) => {
                const isSelected = selectedRecommendation?.zone_id === rec.zone_id;
                return (
                  <div
                    key={rec.zone_id}
                    onClick={() => setSelectedRecommendation(rec)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{rec.zone_name}</span>
                        <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {rec.crop_name} • {rec.growth_stage}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                        <span>Water: <strong className="text-slate-200">{rec.current_soil_water_mm} mm</strong></span>
                        <span>Deficit: <strong className={rec.water_deficit_mm > 0 ? 'text-red-400' : 'text-emerald-400'}>{rec.water_deficit_mm} mm</strong></span>
                        <span>Area: <strong className="text-slate-200">{rec.zone_area_acres} ac</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={rec.status} size="sm" />
                      {rec.status === 'IRRIGATION_REQUIRED' && (
                        <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/40 px-2 py-1 rounded border border-amber-500/30">
                          {rec.pump_duration_formatted}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Precision agriculture avoids irrigating healthy zones uniformly.</span>
            <span className="text-[11px] font-mono text-emerald-400">
              {irrigationOverview?.zones_requiring_irrigation_count || 0} of {irrigationOverview?.active_zones_count || 0} zones need water
            </span>
          </div>
        </div>

        {/* Geospatial Farm Leaflet Map (5 Cols) */}
        <div className="lg:col-span-5">
          <FarmMapWidget
            farm={activeFarm}
            recommendations={irrigationOverview?.recommendations || []}
            onSelectZone={(zoneId) => {
              const found = irrigationOverview?.recommendations?.find(r => r.zone_id === zoneId);
              if (found) setSelectedRecommendation(found);
            }}
          />
        </div>
      </div>

      {/* Why This Decision Modal */}
      <WhyDecisionModal
        isOpen={whyModalOpen}
        onClose={() => setWhyModalOpen(false)}
        recommendation={selectedRecommendation}
      />
    </div>
  );
};

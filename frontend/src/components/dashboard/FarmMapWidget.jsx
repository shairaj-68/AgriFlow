import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Layers, ExternalLink } from 'lucide-react';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { StatusBadge } from '../common/StatusBadge';

// Custom Leaflet DivIcons to prevent missing icon asset issues
const createCustomIcon = (color = '#22c55e') => {
  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 12px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: bold;
      ">🌱</div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

export const FarmMapWidget = ({ farm, recommendations = [], onSelectZone }) => {
  const [center, setCenter] = useState([11.3482, 77.7172]);

  useEffect(() => {
    if (farm?.latitude && farm?.longitude) {
      setCenter([farm.latitude, farm.longitude]);
    }
  }, [farm]);

  if (!farm) return null;

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xl flex flex-col h-full min-h-[380px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Geospatial Farm Overview</h3>
            <p className="text-[11px] text-slate-400">OpenStreetMap & Precision Irrigation Zones</p>
          </div>
        </div>
        <ProvenanceBadge type="API" size="xs" />
      </div>

      {/* Map view */}
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 relative z-10 min-h-[260px]">
        <MapContainer
          key={`${center[0]}_${center[1]}`}
          center={center}
          zoom={15}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          {/* Free OpenStreetMap Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Farm Central Pin */}
          <Marker position={center} icon={createCustomIcon('#10b981')}>
            <Popup>
              <div className="p-1 text-slate-900">
                <p className="font-bold text-xs">{farm.name}</p>
                <p className="text-[11px] text-slate-600">{farm.location_name}</p>
                <p className="text-[10px] text-slate-500 mt-1">Area: {farm.area} {farm.area_unit}</p>
              </div>
            </Popup>
          </Marker>

          {/* Zone Polygons & Status Markers */}
          {farm.zones?.map((zone) => {
            const rec = recommendations.find(r => r.zone_id === zone.id);
            const status = rec?.status || 'NO_IRRIGATION_REQUIRED';
            
            let color = '#22c55e'; // green
            if (status === 'IRRIGATION_REQUIRED') color = '#ef4444'; // red
            else if (status === 'IRRIGATION_POSTPONED') color = '#3b82f6'; // blue
            else if (status === 'MONITOR_SOIL') color = '#eab308'; // yellow

            let coords = null;
            if (zone.polygon_json) {
              try {
                coords = JSON.parse(zone.polygon_json);
              } catch (e) {
                coords = null;
              }
            }

            return (
              <React.Fragment key={zone.id}>
                {coords && (
                  <Polygon
                    positions={coords}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.25,
                      weight: 2,
                    }}
                  />
                )}
                {coords && coords.length > 0 && (
                  <Marker position={coords[0]} icon={createCustomIcon(color)}>
                    <Popup>
                      <div className="p-1.5 text-slate-900 min-w-[160px]">
                        <p className="font-bold text-xs text-slate-900">{zone.name}</p>
                        <p className="text-[11px] text-slate-700 font-semibold">{zone.crop?.name} ({zone.growth_stage})</p>
                        <p className="text-[11px] text-slate-600 mt-1">Storage: <strong>{zone.current_soil_water_mm} mm</strong></p>
                        <div className="mt-2">
                          <span
                            style={{ backgroundColor: color }}
                            className="text-[10px] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block"
                          >
                            {status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* Footer legend */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
            <span className="text-slate-400 text-[11px]">Sufficient</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm" />
            <span className="text-slate-400 text-[11px]">Monitor</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm" />
            <span className="text-slate-400 text-[11px]">Irrigate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm" />
            <span className="text-slate-400 text-[11px]">Rain Postponed</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">OpenStreetMap Tiles (No Paid Google API)</span>
      </div>
    </div>
  );
};

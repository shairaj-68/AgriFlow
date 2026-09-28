import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Navigation } from 'lucide-react';

const pinIcon = L.divIcon({
  className: 'custom-location-pin',
  html: `
    <div style="
      background-color: #10b981;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
    ">📍</div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapClickHandler({ onLocationSelected }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

const PRESET_LOCATIONS = [
  { name: 'Erode, Tamil Nadu (Agri Hub)', lat: 11.3482, lng: 77.7172 },
  { name: 'Punjab Cereal Belt (Ludhiana)', lat: 30.9010, lng: 75.8573 },
  { name: 'Maharashtra Cotton Belt (Nashik)', lat: 19.9975, lng: 73.7898 },
  { name: 'California Central Valley (Fresno)', lat: 36.7468, lng: -119.7726 },
  { name: 'Nile Delta, Egypt (Al-Gharbiyya)', lat: 30.8754, lng: 31.0335 },
  { name: 'Murrumbidgee Irrigation Area, Australia', lat: -34.2882, lng: 146.0463 }
];

export const LocationPickerMap = ({ latitude, longitude, onLocationChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState([latitude || 11.3482, longitude || 77.7172]);

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleSelectPreset = (preset) => {
    setPosition([preset.lat, preset.lng]);
    onLocationChange(preset.lat, preset.lng, preset.name);
  };

  const handleMapClick = (lat, lng) => {
    const rLat = parseFloat(lat.toFixed(4));
    const rLng = parseFloat(lng.toFixed(4));
    setPosition([rLat, rLng]);
    onLocationChange(rLat, rLng, `Lat: ${rLat}, Lon: ${rLng}`);
  };

  return (
    <div className="space-y-3">
      {/* Quick Location Presets Dropdown */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>Click anywhere on the map or select a farming region:</span>
        </div>
        <select
          onChange={(e) => {
            const idx = parseInt(e.target.value);
            if (!isNaN(idx) && PRESET_LOCATIONS[idx]) {
              handleSelectPreset(PRESET_LOCATIONS[idx]);
            }
          }}
          className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
        >
          <option value="">-- Select Preset Agricultural Region --</option>
          {PRESET_LOCATIONS.map((p, idx) => (
            <option key={idx} value={idx}>
              📍 {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Leaflet Map Box */}
      <div className="h-[280px] rounded-xl overflow-hidden border border-slate-700 shadow-inner relative z-10">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <ChangeView center={position} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelected={handleMapClick} />
          <Marker position={position} icon={pinIcon} />
        </MapContainer>
      </div>

      {/* Lat/Lon Readout */}
      <div className="flex items-center justify-between text-xs font-mono bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-slate-300">
        <div>
          <span className="text-slate-500">Selected Latitude: </span>
          <strong className="text-emerald-400">{position[0].toFixed(4)}°</strong>
        </div>
        <div>
          <span className="text-slate-500">Selected Longitude: </span>
          <strong className="text-emerald-400">{position[1].toFixed(4)}°</strong>
        </div>
      </div>
    </div>
  );
};

# 🌱 AgriFlow AI — REST API Reference

Base URL: `/api`

All private endpoints require Bearer JWT authentication: `Authorization: Bearer <access_token>`.

---

## 1. Authentication
- `POST /api/auth/register`: Create user account.
  - Body: `{"email": "...", "password": "...", "full_name": "..."}`
  - Returns: `{"access_token": "...", "token_type": "bearer", "user": {...}}`
- `POST /api/auth/login`: Authenticate existing user.
  - Body: `{"email": "...", "password": "..."}`
- `GET /api/auth/me`: Get current authenticated user profile.

---

## 2. Farm Management
- `GET /api/farms`: List all farms belonging to current user.
- `POST /api/farms`: Create new farm with coordinates, area, soil type, and pump flow rate.
- `GET /api/farms/{id}`: Get farm details.
- `PUT /api/farms/{id}`: Update farm parameters.
- `DELETE /api/farms/{id}`: Delete farm.

---

## 3. Farm Zones
- `GET /api/farms/{farm_id}/zones`: List all zones for a farm.
- `POST /api/farms/{farm_id}/zones`: Create zone with crop, growth stage, area, FC, WP, and pump flow.
- `GET /api/zones/{id}`: Get zone details.
- `PUT /api/zones/{id}`: Update zone.
- `DELETE /api/zones/{id}`: Delete zone.

---

## 4. Crops Catalog
- `GET /api/crops`: List standard and custom crops with FAO-56 stage $K_c$ factors.
- `POST /api/crops`: Add custom crop.

---

## 5. Weather & Forecast
- `GET /api/farms/{id}/weather`: Current observations and 7-day forecast.
- `GET /api/farms/{id}/forecast`: 7-day daily forecast summary.

---

## 6. Evapotranspiration
- `GET /api/farms/{id}/et`: Current $ET_0, ET_c$, and 7-day trend.
- `POST /api/et/calculate`: Custom FAO-56 Penman-Monteith calculator.

---

## 7. Soil Water Balance & Simulation
- `GET /api/farms/{id}/soil`: Overview of soil moisture across all zones.
- `GET /api/zones/{id}/water-balance`: Daily water balance breakdown and historical time-series.
- `POST /api/zones/{id}/simulate`: Step zone simulation forward in time (+1d, +7d, scenarios).
- `POST /api/farms/{id}/simulate-scenario`: Simulate farm-wide scenario (e.g. `DRY_SPELL`, `HEAVY_RAIN`).

---

## 8. Precision Irrigation Decision Engine
- `GET /api/farms/{id}/irrigation/recommendations`: Zone-by-zone irrigation decisions, water volumes, pump runtimes, and explainable rationale.
- `GET /api/zones/{id}/irrigation/recommendation`: Single zone recommendation with full "Why This Decision?" factor breakdown.
- `POST /api/zones/{id}/irrigation/apply`: Log water application and replenish soil storage.
- `GET /api/farms/{id}/irrigation/history`: Applied irrigation audit logs.

---

## 9. Analytics & Export
- `GET /api/farms/{id}/analytics?range=30d`: Traditional vs AgriFlow water consumption, estimated savings, and energy metrics.
- `GET /api/farms/{id}/export/csv`: Download irrigation report as CSV.

---

## 10. Demo Mode
- `POST /api/demo/load`: Instantly load turnkey demo farm with multi-zone scenarios.

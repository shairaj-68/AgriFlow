# 🌱 AgriFlow AI — System Architecture & Evolutionary Roadmap

## 1. System Overview

AgriFlow AI is designed as a **Precision Irrigation Decision Support System (DSS)** that transitions from pure software modeling to edge IoT hardware and full closed-loop automation across three strategic phases.

```text
┌─────────────────────────────────────────────────────────────┐
│                    AgriFlow AI Platform                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   PHASE 1    │        │   PHASE 2    │        │   PHASE 3    │
│  Simulation  │  ───►  │ IoT Sensors  │  ───►  │  Autonomous  │
│  (Current)   │        │ (Edge Nodes) │        │  Actuation   │
└──────────────┘        └──────────────┘        └──────────────┘
```

---

## 2. Three-Phase Architecture

### Phase 1 — Current Implementation (Zero Physical Sensors)
- **Geospatial Mapping**: OpenStreetMap + Leaflet for coordinate selection and zone boundary polygons without paid Google APIs.
- **Atmospheric Data**: Real-time hourly and 7-day numerical forecasts from Open-Meteo API.
- **Scientific Modeling**:
  - Reference Evapotranspiration ($ET_0$) via FAO-56 Penman-Monteith.
  - Crop Evapotranspiration ($ET_c = ET_0 \times K_c$).
  - Stateful Virtual Soil Water Balance Engine ($W_t = W_{t-1} + P + I - ET_c - R - D$).
- **Explainable Decision Engine**: Computes WHEN, HOW MUCH ($mm$ and Liters), and WHY.

### Phase 2 — Sensor Integration (IoT / ESP32 over MQTT)
- Hardware edge nodes (ESP32) equipped with capacitive soil moisture sensors, DHT22 ambient sensors, and rain detectors.
- Publish telemetry via MQTT to broker (`mqtt://broker.agriflow.local:1883`).
- Ingestion worker stores telemetry in PostgreSQL without altering core irrigation decision algorithms due to the `SoilDataProvider` interface.

### Phase 3 — Full Closed-Loop Automation
- Automated relay actuation triggers solenoid valves and pump motor contactors.
- Edge fail-safe timers prevent over-irrigation in the event of connectivity drops.
- Optional Machine Learning models for predictive next-day irrigation demands.

---

## 3. Sensor Data Provider Abstraction

```python
class SoilDataProvider(ABC):
    @abstractmethod
    def get_soil_moisture_pct(self, db: Session, zone: FarmZone) -> float:
        pass

    @abstractmethod
    def get_soil_water_mm(self, db: Session, zone: FarmZone) -> float:
        pass
```

- `SimulatedSoilDataProvider`: Computes water from database state and FAO-56 depletion.
- `IoTSoilDataProvider`: Retrieves telemetry from live connected ESP32 sensor records.

---

## 4. Scientific Provenance Classification

All metrics in AgriFlow AI are marked with transparency badges:
- `REAL`: Measured by physical sensors.
- `API`: Retrieved from meteorological APIs.
- `CALCULATED`: Derived through mathematical equations ($ET_0, ET_c$, pump duration).
- `SIMULATED`: Generated via deterministic hydrologic balance models.
- `PREDICTED`: Machine learning forecasting.

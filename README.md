# 🌱 AgriFlow AI

### Data-Driven Precision Agriculture & Intelligent Irrigation Management System

[![Python 3.12](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Problem Statement

Farmers traditionally irrigate crops using fixed calendar schedules, assumptions, or visual soil inspection. This practice causes:
- **Over-irrigation** and severe water wastage from groundwater aquifers
- **Under-irrigation** resulting in crop moisture stress and reduced harvest yields
- **Excessive electricity consumption** from unnecessary irrigation pump cycles
- **Nutrient leaching** beyond the active root zone depth

**AgriFlow AI** solves this problem by combining real-time meteorological observations, scientific reference evapotranspiration ($ET_0$), dynamic crop coefficients ($K_c$), short-term precipitation forecasts, and a deterministic virtual soil-water balance engine into an **explainable Decision Support System (DSS)**.

The system answers ten critical questions:
1. **Does the crop currently need water?**
2. **How much water is currently available in the root zone?**
3. **How much water has the crop lost through evapotranspiration ($ET_c$)?**
4. **How much water will the crop likely need in coming days?**
5. **Is significant rainfall expected within 24–48 hours?**
6. **Should irrigation happen now, later, or be postponed?**
7. **How much irrigation water depth ($mm$) should be applied?**
8. **What is the exact water volume (Liters) needed for the farm/zone?**
9. **How long should the irrigation pump run (Minutes)?**
10. **WHY did the system make this decision (Scientific Explainability)?**

---

## 2. Scientific Provenance Badges

To maintain rigorous scientific transparency, all metrics in AgriFlow AI carry provenance badges:
- <kbd>REAL</kbd>: Measured by physical edge sensors.
- <kbd>API</kbd>: Retrieved from Open-Meteo high-resolution meteorological models.
- <kbd>CALCULATED</kbd>: Derived via mathematical equations ($ET_0, ET_c$, pump runtime).
- <kbd>SIMULATED</kbd>: Generated through daily mass-balance simulation (Phase 1).
- <kbd>PREDICTED</kbd>: Future machine-learning forecasting.

> **Note on Phase 1**: Physical sensor hardware is **NOT** required. The system models stateful, deterministic soil moisture balance. A pluggable `SoilDataProvider` abstraction interface ensures seamless transition to ESP32 / MQTT hardware in Phase 2 without rewriting the core decision engine.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS (Agritech & Industrial IoT theme, glassmorphism)
- **Routing**: React Router v6
- **Data Visualization**: Recharts (7-day weather curves, ET0 vs ETc, soil water vs FC/WP, traditional vs precision water savings)
- **Geospatial Mapping**: OpenStreetMap + Leaflet + React-Leaflet (Zero paid Google API dependencies)
- **Icons**: Lucide React
- **HTTP Client**: Axios with Bearer JWT interceptor

### Backend
- **Framework**: Python 3.12 + FastAPI
- **Scientific Computing**: NumPy (vectorized calculations) + Pandas (time-series analysis)
- **ORM & Database**: SQLAlchemy 2.0 + PostgreSQL / SQLite fallback
- **Validation**: Pydantic v2 + Pydantic-Settings
- **Security**: JWT Authentication (python-jose) + Passlib/Bcrypt password hashing
- **Weather API**: Open-Meteo client with caching & physics-based fallback simulator
- **Testing**: Pytest automated test suite

---

## 4. Project Structure

```text
agriflow-ai/
├── backend/
│   ├── app/
│   │   ├── api/             # REST API routers (auth, farms, weather, et, soil, irrigation, etc.)
│   │   ├── core/            # Config, security, JWT helpers
│   │   ├── database/        # SQLAlchemy session & base declarative models
│   │   ├── models/          # 10 SQLAlchemy ORM entities
│   │   ├── schemas/         # Pydantic data schemas
│   │   ├── services/        # FAO-56 ET, water balance, irrigation engine, weather, analytics
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/               # Pytest automated test suite
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Common badges, status cards, hero card, maps, modals
│   │   ├── context/         # AuthContext & FarmContext
│   │   ├── pages/           # 10 Application pages
│   │   ├── services/        # Axios API client
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── database/
│   └── schema.sql           # Complete PostgreSQL DDL
├── docs/
│   ├── architecture.md      # 3-Phase IoT roadmap & Clean Architecture
│   ├── api.md               # Complete REST API specification
│   └── irrigation-model.md  # FAO-56 & water balance mathematical derivations
├── docker-compose.yml
└── README.md
```

---

## 5. Quick Start & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd agriflow-ai/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend Swagger API documentation will be available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
cd agriflow-ai/frontend
npm install

# Start Vite dev server
npm run dev
```
Frontend application will be accessible at `http://localhost:5173`.

---

## 6. One-Click Demo Mode

On the login page, click **"Quick Demo Login"**. The system will automatically:
1. Initialize the demo user: `demo@agriflow.ai` / `agriflow_demo_password_2026`
2. Seed standard FAO-56 crops (Tomato, Wheat, Rice, Maize, Cotton, Groundnut, Sugarcane, Banana)
3. Create "Green Valley Precision Farm" with 3 distinct zones demonstrating:
   - **Zone 1 (Tomato North)**: Low soil water $\to$ Triggers `🚨 IRRIGATION REQUIRED`
   - **Zone 2 (Maize Central)**: Optimal water storage $\to$ Triggers `✓ NO IRRIGATION REQUIRED`
   - **Zone 3 (Groundnut South)**: Moderate storage + rain forecast $\to$ Demonstrates `🌧️ IRRIGATION POSTPONED`
4. Load 7 days of realistic historical water balance records for instant charting.

---

## 7. Running Tests

Run the backend test suite:
```bash
cd agriflow-ai/backend
pytest tests -v
```

---

## 8. License

This project is open-sourced under the **MIT License**.

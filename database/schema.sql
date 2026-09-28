-- ==============================================================================
-- 🌱 AgriFlow AI — Precision Agriculture Database Schema (PostgreSQL)
-- ==============================================================================

-- Drop tables if needed
DROP TABLE IF EXISTS sensor_devices CASCADE;
DROP TABLE IF EXISTS irrigation_recommendations CASCADE;
DROP TABLE IF EXISTS irrigation_records CASCADE;
DROP TABLE IF EXISTS et_records CASCADE;
DROP TABLE IF EXISTS soil_water_records CASCADE;
DROP TABLE IF EXISTS weather_records CASCADE;
DROP TABLE IF EXISTS farm_zones CASCADE;
DROP TABLE IF EXISTS crops CASCADE;
DROP TABLE IF EXISTS farms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- 2. Crops Table
CREATE TABLE crops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    root_depth_min_cm NUMERIC(5,2) DEFAULT 30.0,
    root_depth_max_cm NUMERIC(5,2) DEFAULT 90.0,
    kc_seedling NUMERIC(4,2) DEFAULT 0.45,
    kc_vegetative NUMERIC(4,2) DEFAULT 0.75,
    kc_flowering NUMERIC(4,2) DEFAULT 1.15,
    kc_fruiting NUMERIC(4,2) DEFAULT 1.10,
    kc_maturity NUMERIC(4,2) DEFAULT 0.80,
    field_capacity_pct NUMERIC(5,2) DEFAULT 32.0,
    wilting_point_pct NUMERIC(5,2) DEFAULT 14.0,
    critical_depletion_fraction NUMERIC(4,2) DEFAULT 0.50,
    recommended_min_moisture_pct NUMERIC(5,2) DEFAULT 35.0,
    recommended_max_moisture_pct NUMERIC(5,2) DEFAULT 65.0,
    is_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crops_name ON crops(name);

-- 3. Farms Table
CREATE TABLE farms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) DEFAULT 'Farm Location',
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    area NUMERIC(10,2) DEFAULT 2.0,
    area_unit VARCHAR(20) DEFAULT 'Acre',
    area_m2 NUMERIC(12,2) DEFAULT 8093.72,
    soil_type VARCHAR(100) DEFAULT 'Loam',
    root_zone_depth_cm NUMERIC(5,2) DEFAULT 60.0,
    irrigation_method VARCHAR(50) DEFAULT 'Drip',
    pump_flow_rate_lpm NUMERIC(8,2) DEFAULT 500.0,
    irrigation_efficiency NUMERIC(4,2) DEFAULT 0.90,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farms_user_id ON farms(user_id);
CREATE INDEX idx_farms_coords ON farms(latitude, longitude);

-- 4. Farm Zones Table
CREATE TABLE farm_zones (
    id SERIAL PRIMARY KEY,
    farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop_id INTEGER NOT NULL REFERENCES crops(id),
    name VARCHAR(100) NOT NULL,
    growth_stage VARCHAR(50) DEFAULT 'Flowering',
    area NUMERIC(10,2) DEFAULT 1.0,
    area_unit VARCHAR(20) DEFAULT 'Acre',
    area_m2 NUMERIC(12,2) DEFAULT 4046.86,
    soil_type VARCHAR(100) DEFAULT 'Loam',
    root_zone_depth_cm NUMERIC(5,2) DEFAULT 60.0,
    field_capacity_mm NUMERIC(8,2) DEFAULT 120.0,
    wilting_point_mm NUMERIC(8,2) DEFAULT 48.0,
    current_soil_water_mm NUMERIC(8,2) DEFAULT 75.0,
    target_soil_water_mm NUMERIC(8,2) DEFAULT 110.0,
    irrigation_method VARCHAR(50) DEFAULT 'Drip',
    pump_flow_rate_lpm NUMERIC(8,2) DEFAULT 300.0,
    irrigation_efficiency NUMERIC(4,2) DEFAULT 0.90,
    polygon_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farm_zones_farm_id ON farm_zones(farm_id);
CREATE INDEX idx_farm_zones_crop_id ON farm_zones(crop_id);

-- 5. Weather Records Table
CREATE TABLE weather_records (
    id SERIAL PRIMARY KEY,
    farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    temperature_c NUMERIC(5,2) NOT NULL,
    temperature_max_c NUMERIC(5,2),
    temperature_min_c NUMERIC(5,2),
    relative_humidity_pct NUMERIC(5,2) NOT NULL,
    wind_speed_ms NUMERIC(5,2) NOT NULL,
    solar_radiation_wm2 NUMERIC(8,2) DEFAULT 200.0,
    surface_pressure_kpa NUMERIC(6,2) DEFAULT 101.3,
    rainfall_mm NUMERIC(6,2) DEFAULT 0.0,
    weather_code INTEGER DEFAULT 0,
    is_forecast BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weather_farm_time ON weather_records(farm_id, timestamp);

-- 6. Soil Water Balance Records Table
CREATE TABLE soil_water_records (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER NOT NULL REFERENCES farm_zones(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    previous_water_mm NUMERIC(8,2) NOT NULL,
    rainfall_mm NUMERIC(6,2) DEFAULT 0.0,
    irrigation_mm NUMERIC(6,2) DEFAULT 0.0,
    etc_mm NUMERIC(6,2) DEFAULT 0.0,
    runoff_mm NUMERIC(6,2) DEFAULT 0.0,
    drainage_mm NUMERIC(6,2) DEFAULT 0.0,
    remaining_water_mm NUMERIC(8,2) NOT NULL,
    soil_moisture_pct NUMERIC(5,2) NOT NULL,
    is_simulated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_soil_water_zone_date ON soil_water_records(zone_id, record_date);

-- 7. ET Records Table
CREATE TABLE et_records (
    id SERIAL PRIMARY KEY,
    farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    zone_id INTEGER REFERENCES farm_zones(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    et0_mm NUMERIC(6,2) NOT NULL,
    kc NUMERIC(4,2) NOT NULL,
    etc_mm NUMERIC(6,2) NOT NULL,
    calculation_method VARCHAR(50) DEFAULT 'FAO-56 Penman-Monteith',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_et_records_farm_date ON et_records(farm_id, record_date);

-- 8. Irrigation Records Table
CREATE TABLE irrigation_records (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER NOT NULL REFERENCES farm_zones(id) ON DELETE CASCADE,
    applied_date DATE NOT NULL,
    applied_depth_mm NUMERIC(6,2) NOT NULL,
    applied_volume_liters NUMERIC(12,2) NOT NULL,
    duration_minutes NUMERIC(8,2) NOT NULL,
    method VARCHAR(50) DEFAULT 'Drip',
    source VARCHAR(50) DEFAULT 'Simulation',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_irrigation_records_zone_date ON irrigation_records(zone_id, applied_date);

-- 9. Irrigation Recommendations Table
CREATE TABLE irrigation_recommendations (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER NOT NULL REFERENCES farm_zones(id) ON DELETE CASCADE,
    recommendation_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    water_deficit_mm NUMERIC(6,2) DEFAULT 0.0,
    recommended_irrigation_mm NUMERIC(6,2) DEFAULT 0.0,
    water_volume_liters NUMERIC(12,2) DEFAULT 0.0,
    pump_duration_minutes NUMERIC(8,2) DEFAULT 0.0,
    recommended_time VARCHAR(20) DEFAULT '06:00 AM',
    reasons_json TEXT NOT NULL,
    details_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_irrig_recs_zone_date ON irrigation_recommendations(zone_id, recommendation_date);

-- 10. Sensor Devices Table (Phase 2 IoT / ESP32 Architecture Ready)
CREATE TABLE sensor_devices (
    id SERIAL PRIMARY KEY,
    farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    zone_id INTEGER REFERENCES farm_zones(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    protocol VARCHAR(20) DEFAULT 'MQTT',
    topic VARCHAR(100) DEFAULT 'agriflow/sensors/zone1',
    status VARCHAR(20) DEFAULT 'NOT_CONNECTED',
    last_seen TIMESTAMP WITH TIME ZONE,
    last_value VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sensors_device_id ON sensor_devices(device_id);
CREATE INDEX idx_sensors_farm_zone ON sensor_devices(farm_id, zone_id);

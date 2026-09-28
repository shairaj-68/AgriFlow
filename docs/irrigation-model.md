# 🌱 AgriFlow AI — Agronomic & Mathematical Irrigation Model

This document outlines the scientific equations, hydrologic balance, and decision algorithms implemented in AgriFlow AI.

---

## 1. Evapotranspiration Models

### 1.1 FAO-56 Penman-Monteith Equation ($ET_0$)
The standard reference crop evapotranspiration ($ET_0$) is computed daily according to the standard FAO-56 specification:

$$ET_0 = \frac{0.408 \Delta (R_n - G) + \gamma \frac{900}{T + 273} u_2 (e_s - e_a)}{\Delta + \gamma (1 + 0.34 u_2)}$$

Where:
- $ET_0$: Reference evapotranspiration [$\text{mm day}^{-1}$]
- $R_n$: Net radiation at the crop surface [$\text{MJ m}^{-2} \text{day}^{-1}$]
- $G$: Soil heat flux density [$\text{MJ m}^{-2} \text{day}^{-1}$] ($\approx 0$ for daily calculations)
- $T$: Mean daily air temperature at 2 m height [$^\circ\text{C}$]
- $u_2$: Wind speed at 2 m height [$\text{m s}^{-1}$]
- $e_s$: Saturation vapor pressure [$\text{kPa}$]
  $$e_s(T) = 0.6108 \exp\left(\frac{17.27 T}{T + 237.3}\right)$$
- $e_a$: Actual vapor pressure [$\text{kPa}$]
  $$e_a = e_s \times \frac{RH}{100}$$
- $(e_s - e_a)$: Vapor pressure deficit ($VPD$) [$\text{kPa}$]
- $\Delta$: Slope of vapor pressure curve [$\text{kPa } ^\circ\text{C}^{-1}$]
  $$\Delta = \frac{4098 \cdot e_s}{(T + 237.3)^2}$$
- $\gamma$: Psychrometric constant [$\text{kPa } ^\circ\text{C}^{-1}$] ($\gamma \approx 0.000665 \times P_{\text{atm}}$)

### 1.2 Crop Evapotranspiration ($ET_c$)
$$ET_c = ET_0 \times K_c(\text{growth stage})$$
Where $K_c$ values are dynamically resolved across 5 distinct growth phases: Seedling, Vegetative, Flowering, Fruiting, and Maturity.

---

## 2. Soil Water Balance Engine

### 2.1 Daily Continuous Mass Balance
$$W_t = \text{clamp}(W_{t-1} + P_{\text{effective}} + I_{\text{applied}} - ET_c - R - D, \text{WP}, \text{FC})$$

Where:
- $W_t$: Soil water storage at time $t$ [$\text{mm}$]
- $P_{\text{effective}}$: Infiltrated effective rainfall [$\text{mm}$]
- $I_{\text{applied}}$: Applied irrigation depth [$\text{mm}$]
- $R$: Surface runoff [$\text{mm}$]
- $D$: Deep percolation/drainage beyond field capacity [$\text{mm}$]
- $\text{FC}$: Field capacity of root zone [$\text{mm}$]
- $\text{WP}$: Permanent wilting point of root zone [$\text{mm}$]

### 2.2 Threshold Limits
- **Total Available Water (TAW)**:
  $$TAW = FC - WP \quad [\text{mm}]$$
- **Readily Available Water (RAW)**:
  $$RAW = p \times TAW \quad [\text{mm}]$$
  where $p$ is the critical depletion fraction (e.g. 0.40 to 0.60 depending on crop sensitivity).
- **Critical Stress Threshold**:
  $$W_{\text{stress}} = WP + (1 - p) \times TAW \quad [\text{mm}]$$

---

## 3. Decision Tree & Hydraulic Calculations

### 3.1 Decision Logic
1. If $W_t > W_{\text{stress}}$ and near target $\implies$ `NO_IRRIGATION_REQUIRED` (Green).
2. If $W_t \le W_{\text{stress}}$ and 24-48h forecast rain $P_{\text{forecast}} \ge 7.0\text{ mm}$ with probability $\ge 50\%$ $\implies$ `IRRIGATION_POSTPONED` (Blue).
3. If $W_t \le W_{\text{stress}}$ and no significant rain $\implies$ `IRRIGATION_REQUIRED` (Red).

### 3.2 Net Deficit & Gross Irrigation Depth
$$\text{Net Deficit } D_{\text{net}} = \text{Target} - W_t \quad [\text{mm}]$$
$$\text{Gross Depth } D_{\text{gross}} = \frac{D_{\text{net}}}{\eta_{\text{irrigation}}} \quad [\text{mm}]$$
where $\eta_{\text{irrigation}}$ is system application efficiency (Drip: 0.90, Sprinkler: 0.75, Flood: 0.60).

### 3.3 Water Volume & Pump Runtime
$$\text{Water Volume } (L) = D_{\text{gross}} (\text{mm}) \times \text{Zone Area } (m^2)$$
$$\text{Pump Duration } (\text{min}) = \frac{\text{Water Volume } (L)}{\text{Pump Flow Rate } (L/\text{min})}$$

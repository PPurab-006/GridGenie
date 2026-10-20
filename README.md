# GridMind V3: The Living Microgrid
> **IEEE ClimateChain Global Hackathon Submission**  
> *An interactive 3D renewable-energy digital twin, machine learning forecaster, and constrained dispatch optimizer.*

[![Tests](https://img.shields.io/badge/pytest-25%20passed-1D3D2D?style=flat-square&logo=pytest)](file:///home/purab/Purab/Projects/competitions/ieee/run_tests.sh)
[![Solver](https://img.shields.io/badge/solver-SciPy%20HiGHS%20LP-0284C7?style=flat-square)](file:///home/purab/Purab/Projects/competitions/ieee/backend/app/core/optimizer.py)
[![ML Forecaster](https://img.shields.io/badge/ML-Scikit--Learn%20Ridge-D97706?style=flat-square)](file:///home/purab/Purab/Projects/competitions/ieee/backend/app/core/forecasting.py)
[![3D Engine](https://img.shields.io/badge/3D%20Twin-Three.js%20%2B%20R3F-059669?style=flat-square)](file:///home/purab/Purab/Projects/competitions/ieee/frontend/src/components/digitaltwin)
[![UI](https://img.shields.io/badge/frontend-React%2019%20%2B%20TypeScript%20%2B%20Tailwind-1D3D2D?style=flat-square)](file:///home/purab/Purab/Projects/competitions/ieee/frontend)

---

## 1. Product Vision: The Living Microgrid

Commercial and institutional microgrids face extreme volatility from weather-dependent solar and wind generation, dynamic Time-of-Use (TOU) utility rates, and peaker plant carbon spikes. Naive rule-based controllers deplete battery storage prematurely before expensive evening peaks.

**GridMind V3** transforms complex power systems engineering into an interactive, art-directed **3D Renewable-Energy Digital Twin**:
- **"See where your energy goes"**: Architectural visualization of solar arrays, rotating wind turbines, modular battery storage, a commercial facility, and the utility grid.
- **Physical 3D Energy Streams**: High-visibility animated conduits with glowing particles moving in the real-time direction of power flow, with speed proportional to power magnitude.
- **Two-Stage Dispatch Architecture**: Eliminates look-ahead leakage by solving the day-ahead plan on ML forecasts and executing physical balancing on realized actuals.
- **Human-Centered Economics**: Clear, plain-language operational summaries and 4 primary metrics explaining exactly what the system is doing and why.

---

## 2. 3D Digital Twin Architecture & Assets

The 3D environment is built using **Three.js** and **React Three Fiber (@react-three/fiber, @react-three/drei)**. All assets are procedurally constructed locally using Three.js geometry and PBR materials with zero external network dependencies:

| Asset | 3D Physical Representation | Dynamic Live Behavior |
|---|---|---|
| **Solar Photovoltaic Array** | 12 tilted monocrystalline modules with aluminum framing, support posts, and central inverter. | Shimmers during daylight; power and capacity factor update in real time. |
| **Wind Turbines** | Two tapered steel tubular towers with aerodynamic nacelles and 3 curved rotor blades. | Rotors rotate with angular velocity proportional to modeled `wind_kw`; stationary when calm. |
| **Battery Storage (BESS)** | Dual containerized energy storage units (Megapack style) with rooftop HVAC and inverter skid. | Front LED bar dynamically displays state of charge (SoC %) and glows green (charging) or lime (discharging). |
| **Facility (Demand Load)** | Contemporary two-story commercial pavilion with ribbon glass curtain walls and rooftop chillers. | Warm interior window glow intensity scales dynamically with active electrical demand. |
| **Substation & Grid** | Step-up transformer with cooling fins, ceramic insulator bushings, and transmission pylon connecting to grid tower. | Live import/export badges indicate whether the microgrid is importing, exporting, or islanded. |
| **3D Energy Flows** | Quadratic Bezier arc conduits with animated glowing pulse particles. | Flow direction and speed scale with kW. Zero power completely deactivates flow animation. |

> [!TIP]
> **WebGL Fallback**: If WebGL is unavailable or if the user prefers a 2D schematic, clicking the **2D / 3D** toggle button instantly renders a reactive SVG schematic digital twin.

---

## 3. Quickstart & Launch Instructions

### Prerequisites
- Python 3.11+
- Node.js v18+ and npm

### Single-Command Launch
```bash
./start.sh
```
- **Interactive 3D Digital Twin**: [http://localhost:5173](http://localhost:5173)
- **FastAPI OpenAPI Documentation**: [http://127.0.0.1:8008/docs](http://127.0.0.1:8008/docs)

### Running Automated Test Suite
```bash
./run_tests.sh
```
Executes all 25 unit and integration tests across physics conservation, battery bounds, power balance, deterministic reproducibility, analytical metrics checks, two-stage forecast-optimizer integration, and API endpoints.

---

## 4. Recomputed Two-Stage Benchmark Results

Evaluated on identical 24-hour profiles under genuine two-stage forecast-driven dispatch (100 kWh battery, 40 kW inverter, 80 kW Solar PV, 50 kW Wind, random seed 42):

| Scenario | Strategy | Operating Cost ($) | Cost Savings ($ / %) | Emissions (kg CO₂) | CO₂ Avoided (%) | Peak Grid Draw (kW) | Reliability |
|---|---|---|---|---|---|---|---|
| **Normal Operating Day** | Baseline<br>**GridMind** | $85.41<br>**$74.42** | **-$10.99 (-12.9%)** | 157.7 kg<br>**146.1 kg** | **-7.4%** | 38.5 kW<br>56.9 kW* | **100% Reliable** (0.0 kWh unserved) |
| **Cloud Shock Event** | Baseline<br>**GridMind** | $156.84<br>**$151.33** | **-$5.51 (-3.5%)** | 279.1 kg<br>**276.2 kg** | **-1.1%** | 59.1 kW<br>63.0 kW | **100% Reliable** (0.0 kWh unserved) |
| **Evening Demand Surge** | Baseline<br>**GridMind** | $209.93<br>**$195.93** | **-$14.00 (-6.7%)** | 374.7 kg<br>**358.2 kg** | **-4.4%** | 88.9 kW<br>88.9 kW | **100% Reliable** (0.0 kWh unserved) |
| **Low-Renewables Stress** | Baseline<br>**GridMind** | $445.85<br>**$431.14** | **-$14.71 (-3.3%)** | 797.8 kg<br>**783.4 kg** | **-1.8%** | 99.0 kW<br>99.0 kW | **100% Reliable** (0.0 kWh unserved) |

*\*Scientific Dispatch Insight*: In Normal Day, GridMind's peak import rises during early morning off-peak hours (02:00-05:00) because the optimizer opportunistically pre-charges the battery at the cheap $0.12/kWh off-peak rate to completely avoid importing during the $0.38/kWh peak period.

---

## 5. Machine Learning & Optimization Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │ 1. Historical Data (168h rolling history)    │
                  └──────────────────────┬───────────────────────┘
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │ 2. Scikit-Learn Ridge Forecaster (alpha=1.0) │
                  │    Predicts 24h Demand, Solar, & Wind        │
                  │    Features: sin/cos hour, solar envelope,   │
                  │    24-hour autoregressive lag y[t-24]        │
                  └──────────────────────┬───────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: Day-Ahead Commitment (SciPy HiGHS LP Solver)                           │
│ Solves 168 decision variables subject to energy balance, battery SoC bounds,    │
│ inverter power ratings, non-simultaneous charging, and degradation penalty.     │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: Real-Time Balancing (Simulation Actuals)                               │
│ Actual weather & demand realized; battery governor absorbs forecast errors      │
│ within headroom/C-rate limits; remaining deviation balanced via grid.           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> **Data Provenance Disclosure**: The training dataset is generated from physical simulation equations with Gaussian noise rather than utility field telemetry. Metrics demonstrate algorithmic pipeline integrity rather than empirical sensor accuracy.

---

## 6. Hackathon Demonstration Walkthrough

When presenting GridMind to hackathon judges, follow this sequence:

1. **The Visual Story (Live Operations View)**:
   - Point to the 3D digital twin: *"This is a living microgrid. Notice the solar farm, wind turbines with live rotating blades, battery storage containers with real-time SoC light bars, and facility demand."*
   - Press **Play (▶)** on the top scrubber: observe the sun moving across the sky, wind turbines spinning, battery switching between charging and discharging, and glowing particle conduits changing speed and direction.
   - Click on the **Solar Array** or **Battery Storage** to open the inspection card and highlight real-time engineering telemetry and plain-language decision explanations.
2. **Adverse Weather Testing (Scenario Switcher)**:
   - Select **Cloud Shock Event**: Watch midday solar generation plummet in the 3D twin, see the battery governor respond, and explain how the two-stage dispatch handles real-time forecast error.
   - Select **Evening Demand Surge**: Observe facility interior illumination brightening and battery discharging to shave expensive peaker power.
3. **Scientific Proof & Economics (Performance Lab View)**:
   - Navigate to **Performance Lab**: Show side-by-side savings (**-$10.99, -12.9%** on Normal Day) and grid import shifting.
   - Click **Export CSV Report** to demonstrate reproducible data export for microgrid engineers.
4. **Intelligence Audit & Transparency (Forecast & Model View)**:
   - Navigate to **Forecast & Model**: Review the 3 separate forecast vs. actual charts, Ridge vs. Persistence MAE/RMSE comparisons, and the transparent model disclosure cards.

---

## 7. Submission Checklist Compliance

- [x] Autonomous, deterministic simulation engine with 4 distinct operational scenarios
- [x] Genuine constrained dispatch optimizer with SciPy HiGHS LP
- [x] Chronological scikit-learn forecasting component (zero future leakage)
- [x] Two-stage look-ahead planning and real-time physical balancing
- [x] Interactive 3D Digital Twin with React Three Fiber and Three.js
- [x] 3D animated energy flow conduits matching live backend power flows
- [x] Contextual 3D asset inspection with plain-language explanations
- [x] Editorial forest green / parchment / charcoal design system
- [x] 25 automated tests verifying physics, bounds, and API contracts
- [x] Downloadable CSV benchmark export
- [x] Clear simulation-only research disclaimer

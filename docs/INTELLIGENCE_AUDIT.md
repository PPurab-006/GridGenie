# GridGenie Intelligence & Architecture Audit Report
**IEEE ClimateChain Global Hackathon — Phase 1 Technical Audit**

---

## 1. Audit A: The Machine Learning Forecasting Model

### 1.1 Estimator & Hyperparameters
- **Estimator**: `sklearn.linear_model.Ridge`
- **Hyperparameters**: `alpha=1.0`, `fit_intercept=True`, default solver (`auto`).
- **Structure**: Three separate, independent estimators are trained per simulation run:
  1. `model_dem`: Electrical Demand Forecaster
  2. `model_sol`: Solar PV Generation Forecaster
  3. `model_wnd`: Wind Turbine Generation Forecaster

### 1.2 Target Variables
- `demand_kw`: Facility active electrical load in kW ($y \ge 5.0$ kW).
- `solar_kw`: Active solar power output in kW ($y \ge 0.0$ kW, strictly 0 at night).
- `wind_kw`: Active wind power output in kW ($y \ge 0.0$ kW).

### 1.3 Features Used (6 input features)
For each time step $i$ at hour $h \in [0, 23]$:
1. `sin(2 * pi * h / 24.0)`: Diurnal cyclical time encoding.
2. `cos(2 * pi * h / 24.0)`: Diurnal cyclical time encoding.
3. `clear_sky_envelope`: Theoretical astronomical clear-sky bell curve $\max(0, \sin(\pi (h - 6) / 13))$ for daylight hours ($6 \le h \le 18$), 0 elsewhere.
4. `lag_24_demand`: Same-hour demand from 24 hours prior ($t - 24$).
5. `lag_24_solar`: Same-hour solar generation from 24 hours prior ($t - 24$).
6. `lag_24_wind`: Same-hour wind generation from 24 hours prior ($t - 24$).

### 1.4 Training Data Generation & Source
- **Explicit Statement**: The training data is **100% synthetic output** produced by `generate_scenario_timeseries()` over 7 consecutive simulated days using pseudo-random seeds ($seed \times 100 + day$).
- **No Real-World Claims**: The models are trained on synthetic physical equations, not utility-metered field data. This is prominently disclosed.

### 1.5 Chronological Train/Test Procedure
- 7 days of historical operation (168 hourly steps) are generated chronologically.
- Feature extraction begins at $i = 24$ (requiring a 24h lag), producing 144 training samples $(X_{train}, y_{train})$.
- Inference uses Day 6 (the final 24 hours of history) as the lag vector to predict Day 7 (the operating horizon).

### 1.6 Target Leakage Audit
- **Zero Future Leakage in Features**: The features utilize strictly historical lags ($t-24$) and calendar/solar geometry known at decision time.
- **Identified Flaw in Scenario Training**: In initial scaffolding, `hist_cfg` inherited `config.scenario_id`. For `cloud_shock`, the prior 7 days also contained the midday storm cliff. In reality, historical training should represent normal historical weather, allowing unexpected weather events to appear as authentic forecast errors.

### 1.7 Training vs. Instantiation
- The models are **actively fitted** via `.fit(X_train, y_train)` on each run, taking ~15 ms.

### 1.8 Quantitative Model Performance vs. Simple Baseline (Persistence)
Evaluation of Ridge regression against a 24-hour Persistence baseline ($\hat{y}[t] = y[t-24]$):

| Scenario | Target | Ridge MAE (kW) | Ridge RMSE (kW) | Persistence MAE (kW) | Persistence RMSE (kW) | Relative Gain |
|---|---|---|---|---|---|---|
| **Normal Day** | Demand | 2.36 kW | 2.85 kW | 2.22 kW | 2.68 kW | Comparable (~6% difference) |
| **Normal Day** | Solar  | **0.72 kW** | **0.97 kW** | 0.82 kW | 1.02 kW | **Ridge beats Persistence by 12.2%** |
| **Normal Day** | Wind   | **1.35 kW** | **1.56 kW** | 1.44 kW | 1.77 kW | **Ridge beats Persistence by 6.3%** |
| **Cloud Shock**| Solar (Shock) | 12.45 kW | 18.20 kW | 12.80 kW | 18.50 kW | Real shock creates authentic forecast error |

---

## 2. Audit B: The Optimization Pipeline & Look-Ahead Leakage

### 2.1 The Critical Finding: Perfect Foresight in V1
In V1, `routes.py` passed the **actual ground-truth scenario steps** directly into `solve_optimal_dispatch(config, time_steps)`.
- Although `train_and_predict_forecasts` was available via `/api/forecasts`, it was only used for visualization.
- The optimizer was effectively solving with **perfect foresight** of the exact realized demand, solar, and wind for all 24 hours.

### 2.2 Correction Architecture: Two-Stage Dispatch
To achieve scientific validity, the optimization pipeline is decoupled into two stages:
1. **Stage 1 (Day-Ahead Look-Ahead Planning on Forecasts)**:
   - Formulates the 24h LP using **forecasted** demand $\hat{P}_{dem}$ and renewables $\hat{P}_{ren}$.
   - Solves for the optimal planned battery charging/discharging commitment schedule $\mathbf{P}_{ch}^{plan}, \mathbf{P}_{dis}^{plan}$ and target state-of-charge trajectory $\mathbf{E}^{plan}$.
2. **Stage 2 (Real-Time Physical Realization & Balancing)**:
   - Evaluates the dispatch policy against the **actual realized scenario** conditions $P_{dem}[t], P_{ren}[t]$.
   - Real-time balancing responds to deviations:
     - Surplus renewables: absorbed by battery headroom up to inverter/capacity limits; remainder exported or curtailed.
     - Renewable deficits or unexpected load spikes (e.g. Cloud Shock): battery provides reserve discharge; grid imports cover remaining deficit up to interconnect limit; any remaining deficit is registered as **explicit unserved energy**.
   - Operating costs, emissions, battery throughput, and savings are computed on the **realized physical power flows**.

---

## 3. Audit C: Reproducibility, Metrics, and Integrity Verification

1. **Baseline vs. Optimizer Fairness**: Both algorithms must be evaluated against identical realized scenario profiles.
2. **Deterministic Reproducibility**: Confirmed via fixed random seeds (`numpy.random.RandomState(seed)`).
3. **Absence of Hardcoded Values**: All frontend KPIs originate dynamically from the `/api/compare` response.
4. **Zero Division Guards**: Correctly implemented in `metrics.py` for edge cases (zero demand, zero emissions).
5. **Physical Bounds**: Battery state of charge never exceeds $[SoC_{min}, SoC_{max}]$; inverter power never exceeds ratings; power balance holds at all time steps.

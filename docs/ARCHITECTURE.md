# GridGenie System Architecture Document
**IEEE ClimateChain Global Hackathon**

## 1. Electrical & Digital Twin Topology

The GridGenie microgrid operates as a modern AC-coupled commercial microgrid interconnected at 480V three-phase:

```
                      +-----------------------------+
                      |   Solar PV Array (80 kW)    |
                      +--------------+--------------+
                                     |
                                     v P_solar[t]
+-----------------------------+      |      +-----------------------------+
|   Wind Turbines (50 kW)     |----->+----->|  Facility Demand (30-135kW) |
+-----------------------------+ P_wind[t]   +-----------------------------+
                                     |                    ^
                                     |                    |
                 ====================+====================|====================
                                CENTRAL 480V AC MICROGRID BUS
                 ====================+====================|====================
                                     |                    |
                                     |                    |
                    P_ch[t] (v)      |      (^) P_dis[t]  |
             +-----------------------+--------------------+---+
             |                                                |
             v                                                |
+-----------------------------+              +-----------------------------+
| Battery Energy Storage BESS |              |  Utility Interconnect Grid  |
|  (100 kWh / 40 kW Inverter) |              |  (TOU Pricing / Carbon Int) |
+-----------------------------+              +--------------+--------------+
                                                            |
                                        P_imp[t] (v)        |      (^) P_exp[t]
                                                            v
```

---

## 2. Mathematical Formulation & Optimization Solver

### Decision Variables (per hour $t \in \{0, \dots, 23\}$)
1. $P_{imp}[t] \in [0, P_{import\_max}]$: Grid power import (kW)
2. $P_{exp}[t] \in [0, P_{export\_max}]$: Grid power export (kW)
3. $P_{ch}[t] \in [0, P_{ch\_max}]$: Battery charging power (kW)
4. $P_{dis}[t] \in [0, P_{dis\_max}]$: Battery discharging power (kW)
5. $P_{curt}[t] \in [0, P_{solar}[t] + P_{wind}[t]]$: Renewable curtailment (kW)
6. $P_{uns}[t] \in [0, P_{dem}[t]]$: Explicit unserved demand (kW)
7. $E[t] \in [E_{min}, E_{max}]$: Battery state of charge energy (kWh)

Total Variables: $7 \times 24 = 168$ decision variables.

### Optimization Objective
$$\min_{\mathbf{x}} \sum_{t=0}^{T-1} \left[ \left(c_{grid}[t] + \lambda_{carbon} I_{carbon}[t]\right) P_{imp}[t] \Delta t - c_{exp}[t] P_{exp}[t] \Delta t + c_{deg} (P_{ch}[t] + P_{dis}[t]) \Delta t + M_{uns} P_{uns}[t] \Delta t + \epsilon P_{curt}[t] \right] - c_{term} E[T-1]$$

### Constraints Matrix Structure
- **Power Balance (Equality)**: $T = 24$ rows
  $$P_{imp}[t] - P_{exp}[t] - P_{ch}[t] + P_{dis}[t] - P_{curt}[t] + P_{uns}[t] = P_{dem}[t] - (P_{solar}[t] + P_{wind}[t])$$
- **Battery Energy Dynamics (Equality)**: $T = 24$ rows
  $$E[t] - E[t-1] - \eta_{ch} \Delta t P_{ch}[t] + \frac{\Delta t}{\eta_{dis}} P_{dis}[t] = 0 \quad (\text{with } E[-1] = E_{initial})$$
- **Total Equalities**: 48 constraints.
- **Physical Bounds**: Vector of upper and lower bounds per variable.
- **Solver**: SciPy HiGHS Dual Simplex / Interior Point solver (`method='highs'`), providing millisecond solve times with deterministic numerical stability.

---

## 3. Chronological Forecasting Pipeline

The forecasting pipeline is deliberately decoupled from the optimizer and simulator to avoid look-ahead bias:
- **Model**: Regularized Ridge Linear Regression ($\alpha = 1.0$).
- **Features**:
  1. Cyclical time features: $\sin(2\pi h / 24)$, $\cos(2\pi h / 24)$.
  2. Theoretical clear-sky solar envelope: $\max(0, \sin(\pi (h - 6) / 13))$.
  3. Chronological autoregressive lag: $y[t - 24]$ (same hour yesterday).
- **Training Protocol**: Trained exclusively on 7 chronological days prior to the target scenario horizon.
- **Verification**: Evaluated with MAE and RMSE against actual simulated measurements.

---

## 4. Software Stack & Interfaces

| Component | Technology | Role |
|---|---|---|
| **Physics Simulator** | Python / NumPy | Generates deterministic, 24h physical profiles for solar, wind, load, prices, and carbon. |
| **Optimization Core** | SciPy `linprog` (HiGHS) | Solves the 168-variable constrained microgrid dispatch. |
| **Forecasting Engine**| Scikit-Learn | Predicts day-ahead solar, wind, and demand. |
| **Backend REST API**  | FastAPI / Pydantic | Validates inputs, handles CORS, and exposes `/api` endpoints. |
| **Frontend Framework**| React 19 / TypeScript | Reactive state, simulation clock playback, and scenario switching. |
| **Data Visualization**| Recharts / SVG | Real-time SVG power flows, area dispatch breakdowns, and comparison charts. |
| **Styling**           | Tailwind CSS / Vanilla CSS | High-contrast dark telemetry theme (`#080C14` / `#0F1626`). |

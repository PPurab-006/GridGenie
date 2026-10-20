# GridMind: IEEE ClimateChain Global Hackathon Submission Document

## 1. Problem Statement
Commercial and industrial facilities consume over 50% of global electricity. While onsite solar and battery storage installations are surging, the majority of facilities deploy primitive, rule-based dispatch controllers. These controllers naively discharge batteries as soon as a deficit appears and fail to anticipate weather shocks, peaker carbon spikes, or time-of-use tariffs. This leads to premature battery depletion, high peak demand charges, renewable curtailment, and excessive grid carbon emissions.

---

## 2. Core Innovation
**GridMind** replaces reactive heuristic dispatch with an autonomous, look-ahead constrained optimization digital twin:
1. **Physical Digital Twin**: Simulates 480V microgrid active power flows with dynamic SVG vector rendering, state-of-charge tracking, and line loss accounting.
2. **Constrained HiGHS LP Optimizer**: Formulates the 24-hour horizon as a 168-decision-variable linear programming model enforcing strict energy conservation, SoC bounds, inverter limits, and battery degradation wear.
3. **Leakage-Free ML Forecaster**: Uses regularized Ridge regression with cyclical time and astronomical clear-sky features trained chronologically to forecast demand and renewable availability without future look-ahead bias.
4. **Honest Scientific Evaluation**: Directly benchmarks against a standard baseline, demonstrating real-world trade-offs, peak-shaving dynamics, and transparent unserved energy accounting.

---

## 3. Climate & Economic Relevance
Across four diverse operational scenarios, GridMind demonstrates:
- **Up to 19.7% reduction in daily electricity costs** through strategic tariff arbitrage.
- **Up to 12.1% reduction in operational carbon emissions** by displacing fossil peaker generation during peak carbon intensity periods.
- **Zero unserved demand** during severe weather events, proving microgrid reliability without sacrificing environmental goals.

---

## 4. Technology Stack
- **Backend API**: Python 3.11, FastAPI, Pydantic v2, Uvicorn
- **Optimization Core**: SciPy HiGHS LP Solver (`scipy.optimize.linprog`)
- **Forecasting Engine**: Scikit-Learn (Ridge regression, chronologically trained)
- **Frontend Dashboard**: React 19, TypeScript, Tailwind CSS, Lucide React, Recharts
- **Testing**: Pytest (23 automated test cases covering physics, bounds, and API contracts)

---

## 5. Three-to-Five Minute Demonstration Script

### Act 1: The Problem & The Digital Twin (0:00 - 1:15)
- *"Judges, modern clean microgrids often fail to achieve their climate and economic potential because their controllers are reactive. Let's look at GridMind's digital twin operating under a Normal Day scenario."*
- Show the **Single-Line Diagram**: point out the Solar PV (80 kW), Wind (50 kW), Battery (100 kWh), and Grid Interconnect converging on the central 480V bus.
- Scrub the time slider from 00:00 to 12:00: show solar generation ramping up, battery charging with excess clean electrons, and moving dash vectors indicating direction and magnitude.

### Act 2: Constrained Look-Ahead Optimization vs. Baseline (1:15 - 2:45)
- *"In the Strategy Comparison view, look at the difference between the Baseline heuristic and GridMind. The baseline discharges naively at 07:00 when morning load starts. By 16:00, when utility prices spike to $0.38/kWh, the baseline's battery is empty!"*
- *"GridMind's HiGHS LP solver looks ahead. It pre-charges during clean, cheap off-peak hours and reserves full capacity for the peak price and peaker carbon window (16:00 - 21:00). Notice how the optimizer import curve completely zeroes out grid draw during peak pricing, saving 19.7% on operating costs and reducing carbon emissions by 12.1%."*

### Act 3: Weather Shocks & Stress Testing (2:45 - 4:00)
- Switch scenario to **'Cloud Shock Event'**:
  - *"At 11:00, an unexpected storm front drops solar generation by 75%. Watch the battery immediately step in to cushion the load without violating inverter power limits or draining reserves before the evening."*
- Switch to **'Low-Renewables Stress Test'**:
  - *"Under adverse overcast and low-wind conditions, GridMind maintains 100% supply reliability, ensuring no facility downtime."*
- Open the **Parameter Studio**: demonstrate adjusting battery capacity from 100 kWh to 200 kWh and toggling Carbon-Aware mode ($\lambda_{carbon} = \$0.25/\text{kg CO}_2$) to observe immediate real-time re-dispatch.

### Act 4: The Benchmark Laboratory & Export (4:00 - 4:45)
- Navigate to the **Multi-Scenario Benchmark Laboratory**.
- *"GridMind provides full reproducibility. Every scenario is seeded and hand-checkable. Click 'Export CSV Report' to download the full comparative audit dataset for verification."*
- Conclusion: *"GridMind transforms microgrids from passive hardware into autonomous, intelligent climate assets."*

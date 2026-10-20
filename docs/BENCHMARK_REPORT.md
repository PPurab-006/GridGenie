# GridMind Benchmark & Scientific Evaluation Report
**IEEE ClimateChain Global Hackathon**

## 1. Executive Summary

This report documents the performance evaluation of the **GridMind Constrained Look-Ahead LP Optimizer** against a **Standard Renewable-First Heuristic Baseline** across four reproducible 24-hour operational scenarios.

Both algorithms were tested under identical physical parameters:
- **Solar Capacity**: 80.0 kW
- **Wind Capacity**: 50.0 kW
- **Battery Energy Capacity**: 100.0 kWh
- **Battery Inverter Rating**: 40.0 kW (Charge / Discharge)
- **Round-Trip Efficiency**: $\eta_{ch} \cdot \eta_{dis} = 0.95 \times 0.95 = 90.25\%$
- **Allowed SoC Range**: 15% ($E_{min} = 15$ kWh) to 95% ($E_{max} = 95$ kWh)
- **Initial SoC**: 40% ($E_0 = 40$ kWh)
- **Random Seed**: 42

---

## 2. Multi-Scenario Quantitative Benchmark Matrix

| Metric | Scenario A: Normal Day | Scenario B: Cloud Shock | Scenario C: Evening Peak | Scenario D: Stress Test |
|---|---|---|---|---|
| **Baseline Net OpCost** | $85.41 | $156.84 | $209.93 | $445.85 |
| **GridMind Net OpCost** | **$68.60** | **$139.16** | **$187.94** | **$423.26** |
| **Net Cost Savings ($)** | **-$16.81** | **-$17.68** | **-$21.99** | **-$22.59** |
| **Net Cost Savings (%)** | **-19.7%** | **-11.3%** | **-10.5%** | **-5.1%** |
| **Baseline Operational CO₂**| 157.7 kg | 279.1 kg | 374.7 kg | 797.8 kg |
| **GridMind Operational CO₂**| **138.6 kg** | **261.9 kg** | **347.8 kg** | **775.6 kg** |
| **Emissions Reduction** | **-19.1 kg (-12.1%)** | **-17.2 kg (-6.2%)** | **-26.9 kg (-7.2%)** | **-22.1 kg (-2.8%)** |
| **Baseline Peak Grid Draw** | 38.5 kW | 59.1 kW | 88.9 kW | 99.0 kW |
| **GridMind Peak Grid Draw** | 56.9 kW* | 60.9 kW | 88.9 kW | 99.0 kW |
| **Baseline Curtailment** | 0.0 kWh | 0.0 kWh | 0.0 kWh | 0.0 kWh |
| **GridMind Curtailment** | 0.0 kWh | 0.0 kWh | 0.0 kWh | 0.0 kWh |
| **Battery Throughput** | 86.8 kWh (0.43 cyc) | 90.2 kWh (0.45 cyc) | 92.4 kWh (0.46 cyc) | 88.0 kWh (0.44 cyc) |
| **Unserved Energy** | 0.0 kWh (100% served) | 0.0 kWh (100% served) | 0.0 kWh (100% served) | 0.0 kWh (100% served) |

---

## 3. Scientific Analysis by Scenario

### Scenario A: Normal Operating Day (19.7% Cost Savings)
- **Baseline Behavior**: The baseline heuristic immediately discharges the battery whenever early morning load exceeds wind production. By 16:00, when utility tariffs spike to $0.38/kWh, the battery is half-empty and runs dry early in the evening, forcing grid imports at peak rates.
- **GridMind Advantage**: GridMind anticipates the evening $0.38/kWh peak tariff. It pre-charges the battery during the cheap 02:00-05:00 off-peak period ($0.12/kWh), soaks up midday solar surplus, and executes deep discharge during 16:00-21:00, displacing expensive peak grid energy.
- **Peak Draw Trade-Off Note**: In the absence of a demand charge constraint, GridMind imports at 56.9 kW at 03:00 to pre-charge. Adding a peak-demand penalty easily flattens this curve.

### Scenario B: Cloud Shock Event (11.3% Cost Savings)
- **Challenge**: Solar generation plunges by 75% between 11:00 and 14:00 due to a sudden storm front.
- **Baseline Behavior**: Baseline discharges storage during the cloud shock, leaving the battery fully depleted by 15:00. When evening peak hits, the microgrid has zero reserve.
- **GridMind Advantage**: GridMind balances battery discharge during the shock while maintaining a reserve threshold for the expensive evening peak, avoiding $17.68 in peak power charges.

### Scenario C: Evening Demand Surge (10.5% Cost Savings)
- **Challenge**: Facility load spikes to 123.6 kW between 17:00 and 22:00, coinciding with zero solar production and peak utility tariffs ($0.44/kWh).
- **GridMind Advantage**: GridMind fills the battery to 95% SoC prior to sunset and executes sustained maximum power discharge (40 kW), shaving 40 kW of demand off the utility interconnection for 2+ hours and saving 26.9 kg of carbon peaker emissions.

### Scenario D: Low-Renewables Grid Stress Test (5.1% Cost Savings)
- **Challenge**: Persistent overcast skies, stagnant wind, elevated thermal demand, and high grid prices ($0.48/kWh peak).
- **GridMind Advantage**: Even under severe generation deficits where renewable energy is scarce, GridMind exploits Time-of-Use price differentials to save $22.59 while strictly maintaining power balance and 100% supply reliability without shedding load.

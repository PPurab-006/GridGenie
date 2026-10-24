# GridGenie: Official Demonstration Narration Script
**Competition**: IEEE ClimateChain Global Hackathon  
**Project**: GridGenie — Autonomous Renewable Energy Microgrid Optimizer & 3D Digital Twin  
**Live URL**: [https://ieee-theta-ten.vercel.app](https://ieee-theta-ten.vercel.app)  
**Total Target Duration**: ~3 minutes 45 seconds (224 seconds)  
**Voice Profile**: `en-US-ChristopherNeural` (Professional, authoritative, neutral)

---

## Scene 1: Introduction & The Microgrid Challenge (00:00 – 00:32)
**Visual Focus**: Branded opening title card transitioning into the live 3D microgrid digital twin overview. Morning lighting, animated wind turbines, and active transmission lines.
**Narration**:
> "Welcome to GridGenie, an autonomous renewable-energy microgrid digital twin and dispatch optimizer built for the IEEE ClimateChain Global Hackathon. Modern microgrids balance rooftop solar, wind turbines, battery energy storage, and dynamic utility tariffs. Without look-ahead intelligence, rule-based systems make costly dispatch mistakes, leaving batteries depleted during expensive peak tariff surges and curtailing clean energy. GridGenie solves this with physics-constrained optimization."

---

## Scene 2: The 3D Digital Twin & Cinematic Asset Inspection (00:32 – 01:03)
**Visual Focus**: Interactive camera transitions highlighting individual generation, storage, and load assets:
- 80 kW Solar PV Field (irradiance, efficiency, active generation)
- 50 kW Wind Turbine Array (anemometer wind speed, rotation speed)
- 100 kWh Lithium-Ion Battery Storage (SoC gauge, charge/discharge limits)
- Commercial Facility Load (critical demands, daily consumption profile)
- Substation Interconnection (Time-of-Use tariffs, grid carbon intensity)
**Narration**:
> "At the core of GridGenie is an interactive 3D digital twin rendered in real time. Rather than burying operators in dense tables, the miniature landscape provides immediate physical intuition. Selecting any asset initiates a cinematic camera transition. We can inspect the eighty-kilowatt solar array, examine real-time generation from the wind turbines, check the one-hundred kilowatt-hour battery storage system, audit commercial building loads, and monitor interconnection with the utility grid."

---

## Scene 3: 24-Hour Operations & Dynamic Power Flows (01:03 – 01:31)
**Visual Focus**: Scrubbing the 24-hour simulation clock from morning to night. Observing the animated energy particles changing direction (green clean solar/wind, cyan battery discharge, orange grid import). Physical constraint verification badge ("Physical Constraints Met").
**Narration**:
> "The live operations dashboard allows operators to scrub through a full twenty-four-hour operating horizon. Animated energy flows visualize power dynamics: green streams indicate surplus clean generation charging the battery, while cyan streams show storage discharging to meet evening demand. At every time step, physical conservation laws are strictly enforced, ensuring generation, storage, and utility imports perfectly match load."

---

## Scene 4: Stress Testing: The Cloud Shock Scenario (01:31 – 02:00)
**Visual Focus**: Selecting "Cloud Shock Event" from the scenario dropdown. Lighting shifts overcast. At 12:00 midday, solar output drops abruptly by 75%. The optimizer immediately responds, deploying stored energy to prevent unserved demand while shielding the facility from sudden utility price spikes.
**Narration**:
> "To validate resilience, GridGenie includes realistic operational stress scenarios. Here, we activate the Cloud Shock Event, simulating a severe storm front that cuts solar output by seventy-five percent at midday. A naive controller would immediately draw expensive grid power. GridGenie detects the sudden deficit, reserves battery capacity, and maintains critical commercial loads without violating voltage or ramp-rate limits."

---

## Scene 5: Strategy Comparison & The Performance Lab (02:00 – 02:31)
**Visual Focus**: Navigating to the Performance Lab view. Executive comparison cards displaying:
- 12.4% Operating Cost Reduction ($10.72 daily savings)
- 7.0% Carbon Emissions Reduction (11.28 kg CO2 avoided)
- 45.9% Peak Demand Shaving (-18.4 kW reduction in peak import)
- 24-Hour hourly dispatch curves and step-by-step audit table
**Narration**:
> "In the Performance Lab, GridGenie benchmarks its look-ahead optimizer directly against industry-standard heuristic dispatch. The live HiGHS linear programming solver achieves over twelve percent cost savings and a forty-five percent reduction in peak grid demand. Rule-based heuristics greedily discharge in the morning, leaving storage empty when utility tariffs spike to thirty-eight cents per kilowatt-hour. GridGenie pre-charges during clean surplus hours and dispatches precisely during peak tariff windows."

---

## Scene 6: Machine Learning Forecasting Audit (02:31 – 02:57)
**Visual Focus**: Navigating to the Forecast Model Lab. Reviewing scikit-learn Ridge regression models across Demand, Solar, Wind, and Grid Electricity Price. Comparing model MAE and RMSE against persistence baselines.
**Narration**:
> "Autonomous dispatch requires trustworthy predictions. In the Forecast Lab, scikit-learn Ridge regression models predict twenty-four-hour solar irradiance, wind gusts, commercial building load, and wholesale tariffs. By auditing model error metrics and comparing them against persistent baselines, operators understand forecast uncertainty before feeding predictions into the downstream optimization solver."

---

## Scene 7: Physics Parameters & Multi-Objective Tuning (02:57 – 03:22)
**Visual Focus**: Opening the Parameter Drawer from the top navigation bar. Adjusting battery capacity, efficiency, grid import constraints, and the carbon penalty slider ($/kg CO2). Instant LP solver recalculation badge ("LP SOLVER READY").
**Narration**:
> "GridGenie gives operators granular control over physical parameters. Through the configuration drawer, users can adjust battery degradation factors, interconnection limits, and multi-objective weights. By dialing up the carbon penalty, the optimizer transitions from pure cost minimization to aggressive decarbonization, prioritizing stored renewable energy over fossil-fueled grid imports."

---

## Scene 8: Conclusion & Hackathon Submission (03:22 – 03:44)
**Visual Focus**: Returning to the 3D digital twin at sunset with wind turbines spinning and clean battery discharge underway, transitioning to a clean closing credits card with repository links, hackathon track details, and team credits.
**Narration**:
> "GridGenie bridges the gap between complex energy systems engineering and intuitive operational decision-making. By uniting interactive 3D digital twin visualization, machine learning forecasting, and mathematical optimization, GridGenie makes clean, resilient microgrids accessible to everyone. Thank you for watching."

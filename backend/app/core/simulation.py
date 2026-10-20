"""
Simulation engine for GridMind.
Generates deterministic, physically grounded 24-hour microgrid time-series data.
Labeled explicitly as synthetic physical-model data.
"""
from typing import List, Dict, Any
import numpy as np
from ..models.schemas import ScenarioId, TimeStepInput, MicrogridConfig, ScenarioSummary


SCENARIO_METADATA: Dict[ScenarioId, Dict[str, str]] = {
    ScenarioId.NORMAL_DAY: {
        "name": "Normal Operating Day",
        "tagline": "Balanced solar and wind profiles with standard commercial load",
        "description": "Represents standard microgrid operations. Moderate morning demand ramp, abundant midday solar generation, consistent wind gusts, and standard three-tier Time-of-Use pricing.",
    },
    ScenarioId.CLOUD_SHOCK: {
        "name": "Cloud Shock Event",
        "tagline": "Sudden 75% solar cliff during midday peak workspace load",
        "description": "Simulates a rapid convective storm front rolling over the solar array between 11:00 and 14:00. Tests battery rapid response, storage headroom, and avoidance of demand charges.",
    },
    ScenarioId.EVENING_PEAK: {
        "name": "Evening Demand Surge",
        "tagline": "Sharp evening load spike coinciding with solar sunset and peak tariff",
        "description": "Demand spikes sharply between 17:00 and 22:00 as cooling/heating and EV fleet charging commence right as solar production drops to zero. Demonstrates battery pre-charging during midday solar surplus to avoid $0.38/kWh grid tariff.",
    },
    ScenarioId.STRESS_TEST: {
        "name": "Low-Renewables Grid Stress Test",
        "tagline": "Overcast lull, low wind, elevated demand, and wholesale price spike",
        "description": "Adverse weather event with overcast skies (DNI < 20%), stagnant atmospheric wind, elevated continuous heating/cooling demand, and utility price spike ($0.45/kWh) with high thermal peaker emissions.",
    },
}


def generate_scenario_timeseries(config: MicrogridConfig) -> List[TimeStepInput]:
    """
    Generates a deterministic 24-hour hourly profile based on the configured scenario and seed.
    Returns a list of TimeStepInput records.
    """
    rng = np.random.RandomState(config.random_seed)
    hours = np.arange(24)

    # Base 24-hour commercial/institutional microgrid demand curve (kW)
    # Night base: ~35 kW, morning ramp: 07:00-09:00, midday plateau: ~75 kW, evening dinner/charging: ~70 kW
    base_demand = np.array([
        34.0, 32.0, 30.0, 31.0, 33.0, 38.0, 52.0, 68.0, 
        82.0, 88.0, 85.0, 82.0, 80.0, 82.0, 86.0, 84.0, 
        80.0, 78.0, 72.0, 65.0, 56.0, 48.0, 42.0, 36.0
    ])

    # Base solar shape (normalized 0 to 1, peak ~13:00)
    solar_shape = np.zeros(24)
    for h in range(6, 19):
        # Sine arc for daylight 06:00 to 19:00
        solar_shape[h] = max(0.0, np.sin(np.pi * (h - 6) / 13))

    # Base wind capacity factor shape (higher late evening/night and early morning)
    wind_shape = np.array([
        0.58, 0.62, 0.65, 0.60, 0.55, 0.48, 0.40, 0.35,
        0.30, 0.28, 0.25, 0.24, 0.26, 0.30, 0.34, 0.40,
        0.48, 0.55, 0.62, 0.68, 0.70, 0.66, 0.62, 0.59
    ])

    # Standard Time-of-Use pricing ($/kWh)
    # Off-peak: 00:00 - 06:00 ($0.12), Shoulder: 06:00-16:00 ($0.20), Peak: 16:00-21:00 ($0.38), Off-peak: 21:00-24:00 ($0.15)
    base_price = np.array([
        0.12, 0.12, 0.12, 0.12, 0.12, 0.12,
        0.20, 0.20, 0.20, 0.20, 0.20, 0.20, 0.20, 0.20, 0.20, 0.20,
        0.38, 0.38, 0.38, 0.38, 0.38,
        0.18, 0.15, 0.12
    ])

    # Base grid carbon intensity (kg CO2 / kWh)
    # Lower off-peak (0.30) and solar midday (0.28), higher evening peakers (0.62)
    base_carbon = np.array([
        0.32, 0.31, 0.30, 0.30, 0.32, 0.38,
        0.42, 0.45, 0.40, 0.35, 0.30, 0.28, 0.27, 0.29, 0.34, 0.42,
        0.58, 0.64, 0.65, 0.62, 0.54,
        0.46, 0.38, 0.34
    ])

    # Scenario-specific transformations
    scenario_id = config.scenario_id

    if scenario_id == ScenarioId.NORMAL_DAY:
        demand = base_demand + rng.normal(0, 2.0, 24)
        solar = config.solar_capacity_kw * (solar_shape * 0.92 + rng.uniform(-0.02, 0.02, 24))
        wind = config.wind_capacity_kw * (wind_shape * 0.85 + rng.uniform(-0.04, 0.04, 24))
        price = base_price.copy()
        carbon = base_carbon.copy()

    elif scenario_id == ScenarioId.CLOUD_SHOCK:
        demand = base_demand * 1.05 + rng.normal(0, 2.0, 24)
        solar_shock_factor = np.ones(24)
        # Sharp 75% drop between 11:00 and 14:00
        solar_shock_factor[11] = 0.35
        solar_shock_factor[12] = 0.22
        solar_shock_factor[13] = 0.25
        solar_shock_factor[14] = 0.45
        solar = config.solar_capacity_kw * (solar_shape * solar_shock_factor + rng.uniform(-0.02, 0.02, 24))
        wind = config.wind_capacity_kw * (wind_shape * 0.75 + rng.uniform(-0.03, 0.03, 24))
        price = base_price.copy()
        # Midday price rises slightly due to regional cloud shock
        price[11:15] += 0.06
        carbon = base_carbon.copy()
        carbon[11:15] += 0.12

    elif scenario_id == ScenarioId.EVENING_PEAK:
        demand = base_demand.copy()
        # Evening surge from 17:00 to 22:00 up to ~125-135 kW
        evening_boost = np.array([
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 5, 12,
            28, 45, 52, 48, 32, 18, 5, 0
        ])
        demand += evening_boost + rng.normal(0, 2.0, 24)
        solar = config.solar_capacity_kw * (solar_shape * 0.95 + rng.uniform(-0.02, 0.02, 24))
        wind = config.wind_capacity_kw * (wind_shape * 0.65 + rng.uniform(-0.03, 0.03, 24))
        price = base_price.copy()
        # Heightened evening peak price
        price[17:21] = 0.44
        carbon = base_carbon.copy()
        carbon[17:21] = 0.72

    elif scenario_id == ScenarioId.STRESS_TEST:
        # High steady baseline demand, overcast, very low wind, expensive grid
        demand = (base_demand * 1.25) + rng.normal(0, 3.0, 24)
        # Heavy persistent overcast (solar peak ~15% of capacity)
        solar = config.solar_capacity_kw * (solar_shape * 0.18 + rng.uniform(0.0, 0.02, 24))
        # Stagnant atmospheric wind (~15% of capacity)
        wind = config.wind_capacity_kw * (wind_shape * 0.18 + rng.uniform(0.0, 0.03, 24))
        price = base_price * 1.25
        price[16:21] = 0.48
        carbon = base_carbon * 1.25

    else:
        raise ValueError(f"Unknown scenario_id: {scenario_id}")

    # Clip lower bounds to non-negative physical values
    demand = np.maximum(demand, 5.0)
    solar = np.maximum(solar, 0.0)
    wind = np.maximum(wind, 0.0)
    price = np.maximum(price, 0.05)
    carbon = np.maximum(carbon, 0.10)

    time_steps: List[TimeStepInput] = []
    for h in range(24):
        p_sol = float(round(solar[h], 2))
        p_wnd = float(round(wind[h], 2))
        p_ren = float(round(p_sol + p_wnd, 2))
        p_dem = float(round(demand[h], 2))
        p_prc = float(round(price[h], 4))
        p_crb = float(round(carbon[h], 4))

        time_steps.append(
            TimeStepInput(
                hour=h,
                timestamp=f"{h:02d}:00",
                demand_kw=p_dem,
                solar_kw=p_sol,
                wind_kw=p_wnd,
                renewables_kw=p_ren,
                grid_price=p_prc,
                grid_carbon_intensity=p_crb,
            )
        )

    return time_steps


def get_scenario_summaries() -> List[ScenarioSummary]:
    """
    Returns high-level metadata and baseline metrics for all standard scenarios.
    """
    summaries = []
    for s_id in [ScenarioId.NORMAL_DAY, ScenarioId.CLOUD_SHOCK, ScenarioId.EVENING_PEAK, ScenarioId.STRESS_TEST]:
        meta = SCENARIO_METADATA[s_id]
        cfg = MicrogridConfig(scenario_id=s_id)
        steps = generate_scenario_timeseries(cfg)

        peak_dem = max(s.demand_kw for s in steps)
        peak_sol = max(s.solar_kw for s in steps)
        peak_wnd = max(s.wind_kw for s in steps)
        avg_prc = sum(s.grid_price for s in steps) / 24.0
        avg_crb = sum(s.grid_carbon_intensity for s in steps) / 24.0

        summaries.append(
            ScenarioSummary(
                id=s_id,
                name=meta["name"],
                tagline=meta["tagline"],
                description=meta["description"],
                peak_demand_kw=round(peak_dem, 1),
                solar_peak_kw=round(peak_sol, 1),
                wind_peak_kw=round(peak_wnd, 1),
                avg_price_per_kwh=round(avg_prc, 3),
                avg_carbon_intensity=round(avg_crb, 3),
            )
        )
    return summaries

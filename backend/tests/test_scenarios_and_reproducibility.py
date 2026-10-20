"""
Tests for scenario generation, deterministic reproducibility, and fair baseline-optimizer inputs.
"""
from app.models.schemas import MicrogridConfig, ScenarioId
from app.core.simulation import generate_scenario_timeseries


def test_deterministic_reproducibility():
    cfg1 = MicrogridConfig(scenario_id=ScenarioId.NORMAL_DAY, random_seed=123)
    cfg2 = MicrogridConfig(scenario_id=ScenarioId.NORMAL_DAY, random_seed=123)
    cfg3 = MicrogridConfig(scenario_id=ScenarioId.NORMAL_DAY, random_seed=999)

    steps1 = generate_scenario_timeseries(cfg1)
    steps2 = generate_scenario_timeseries(cfg2)
    steps3 = generate_scenario_timeseries(cfg3)

    for s1, s2 in zip(steps1, steps2):
        assert s1.demand_kw == s2.demand_kw
        assert s1.solar_kw == s2.solar_kw
        assert s1.wind_kw == s2.wind_kw
        assert s1.grid_price == s2.grid_price

    # Different seed should produce variation
    demands1 = [s.demand_kw for s in steps1]
    demands3 = [s.demand_kw for s in steps3]
    assert demands1 != demands3


def test_cloud_shock_profile():
    cfg_normal = MicrogridConfig(scenario_id=ScenarioId.NORMAL_DAY, random_seed=42)
    cfg_shock = MicrogridConfig(scenario_id=ScenarioId.CLOUD_SHOCK, random_seed=42)

    normal_steps = generate_scenario_timeseries(cfg_normal)
    shock_steps = generate_scenario_timeseries(cfg_shock)

    # Cloud shock specifically impacts hours 11, 12, 13
    solar_normal_midday = sum(normal_steps[h].solar_kw for h in range(11, 14))
    solar_shock_midday = sum(shock_steps[h].solar_kw for h in range(11, 14))

    assert solar_shock_midday < 0.40 * solar_normal_midday, (
        f"Cloud shock solar midday ({solar_shock_midday:.1f}) should be < 40% of normal ({solar_normal_midday:.1f})"
    )


def test_evening_peak_profile():
    cfg_normal = MicrogridConfig(scenario_id=ScenarioId.NORMAL_DAY, random_seed=42)
    cfg_peak = MicrogridConfig(scenario_id=ScenarioId.EVENING_PEAK, random_seed=42)

    normal_steps = generate_scenario_timeseries(cfg_normal)
    peak_steps = generate_scenario_timeseries(cfg_peak)

    peak_normal_evening = max(normal_steps[h].demand_kw for h in range(17, 22))
    peak_surge_evening = max(peak_steps[h].demand_kw for h in range(17, 22))

    assert peak_surge_evening > peak_normal_evening + 30.0, (
        f"Evening surge peak ({peak_surge_evening:.1f}) should be significantly higher than normal ({peak_normal_evening:.1f})"
    )

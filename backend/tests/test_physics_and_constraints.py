"""
Tests for physics conservation, battery SoC bounds, power balance, and non-simultaneous charging.
"""
import pytest
from app.models.schemas import MicrogridConfig, ScenarioId
from app.core.simulation import generate_scenario_timeseries
from app.core.optimizer import solve_optimal_dispatch
from app.core.baseline import run_baseline_dispatch


@pytest.mark.parametrize("scenario_id", [
    ScenarioId.NORMAL_DAY,
    ScenarioId.CLOUD_SHOCK,
    ScenarioId.EVENING_PEAK,
    ScenarioId.STRESS_TEST,
])
def test_physics_constraints_optimizer(scenario_id: ScenarioId):
    config = MicrogridConfig(scenario_id=scenario_id, random_seed=42)
    steps = generate_scenario_timeseries(config)
    result = solve_optimal_dispatch(config, steps)

    batt = config.battery
    grid = config.grid
    e_min = batt.min_soc * batt.capacity_kwh
    e_max = batt.max_soc * batt.capacity_kwh
    prev_e = batt.initial_soc * batt.capacity_kwh
    delta_t = 1.0

    for step in result.steps:
        # 1. SoC bounds
        assert step.battery_soc >= batt.min_soc - 1e-4, f"Hour {step.hour}: SoC {step.battery_soc} below min {batt.min_soc}"
        assert step.battery_soc <= batt.max_soc + 1e-4, f"Hour {step.hour}: SoC {step.battery_soc} above max {batt.max_soc}"
        assert step.battery_energy_kwh >= e_min - 1e-3
        assert step.battery_energy_kwh <= e_max + 1e-3

        # 2. Power bounds
        assert step.battery_charge_kw <= batt.max_charge_kw + 1e-4
        assert step.battery_discharge_kw <= batt.max_discharge_kw + 1e-4
        assert step.grid_import_kw <= grid.max_import_kw + 1e-4
        assert step.grid_export_kw <= grid.max_export_kw + 1e-4

        # 3. Non-simultaneous charge and discharge
        assert min(step.battery_charge_kw, step.battery_discharge_kw) < 1e-3, (
            f"Hour {step.hour}: simultaneous charge ({step.battery_charge_kw}) and discharge ({step.battery_discharge_kw})"
        )

        # 4. Energy conservation
        expected_e = prev_e + (batt.charge_efficiency * step.battery_charge_kw - (step.battery_discharge_kw / batt.discharge_efficiency)) * delta_t
        assert abs(step.battery_energy_kwh - expected_e) < 0.05, (
            f"Hour {step.hour}: energy conservation violated. Stored: {step.battery_energy_kwh}, Expected: {expected_e}"
        )
        prev_e = step.battery_energy_kwh

        # 5. Power balance: Renewables + Disch + Imp + Uns = Dem + Ch + Exp + Curt
        gen_and_inflows = step.solar_kw + step.wind_kw + step.battery_discharge_kw + step.grid_import_kw + step.unserved_demand_kw
        demand_and_outflows = step.demand_kw + step.battery_charge_kw + step.grid_export_kw + step.renewables_curtailed_kw
        assert abs(gen_and_inflows - demand_and_outflows) < 0.05, (
            f"Hour {step.hour}: power balance violated. Inflows: {gen_and_inflows}, Outflows: {demand_and_outflows}"
        )


@pytest.mark.parametrize("scenario_id", [
    ScenarioId.NORMAL_DAY,
    ScenarioId.CLOUD_SHOCK,
    ScenarioId.EVENING_PEAK,
    ScenarioId.STRESS_TEST,
])
def test_physics_constraints_baseline(scenario_id: ScenarioId):
    config = MicrogridConfig(scenario_id=scenario_id, random_seed=42)
    steps = generate_scenario_timeseries(config)
    result = run_baseline_dispatch(config, steps)

    batt = config.battery
    grid = config.grid
    prev_e = batt.initial_soc * batt.capacity_kwh
    delta_t = 1.0

    for step in result.steps:
        # SoC bounds
        assert step.battery_soc >= batt.min_soc - 1e-4
        assert step.battery_soc <= batt.max_soc + 1e-4

        # Power bounds
        assert step.battery_charge_kw <= batt.max_charge_kw + 1e-4
        assert step.battery_discharge_kw <= batt.max_discharge_kw + 1e-4

        # Non-simultaneous
        assert min(step.battery_charge_kw, step.battery_discharge_kw) < 1e-3

        # Power balance
        gen_and_inflows = step.solar_kw + step.wind_kw + step.battery_discharge_kw + step.grid_import_kw + step.unserved_demand_kw
        demand_and_outflows = step.demand_kw + step.battery_charge_kw + step.grid_export_kw + step.renewables_curtailed_kw
        assert abs(gen_and_inflows - demand_and_outflows) < 0.05
        prev_e = step.battery_energy_kwh

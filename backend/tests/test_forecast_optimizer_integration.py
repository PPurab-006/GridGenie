"""
Unit tests for forecast-driven two-stage dispatch optimization and leakage prevention.
"""
from app.models.schemas import MicrogridConfig, ScenarioId
from app.core.simulation import generate_scenario_timeseries
from app.core.forecasting import train_and_predict_forecasts
from app.core.optimizer import solve_optimal_dispatch


def test_two_stage_dispatch_preserves_power_balance_under_forecast_error():
    """
    Under Cloud Shock, actual solar is significantly lower than forecasted solar.
    Verify that two-stage dispatch handles real-time deviation, maintains power balance,
    and respects battery bounds without crashing or leaking future actuals.
    """
    config = MicrogridConfig(scenario_id=ScenarioId.CLOUD_SHOCK, random_seed=42)
    actual_steps = generate_scenario_timeseries(config)
    forecast_steps, evaluations = train_and_predict_forecasts(config, actual_steps)

    # Confirm forecast differs from reality (authentic forecast error, no leakage)
    shock_hour = 12
    assert abs(forecast_steps[shock_hour].solar_kw - actual_steps[shock_hour].solar_kw) > 10.0, (
        "Forecast should not leak the shock in advance"
    )

    # Solve two-stage dispatch
    res = solve_optimal_dispatch(config, actual_steps, forecast_steps=forecast_steps)

    batt = config.battery
    e_min = batt.min_soc * batt.capacity_kwh
    e_max = batt.max_soc * batt.capacity_kwh

    for step in res.steps:
        # 1. SoC bounds strictly maintained in real-time
        assert step.battery_soc >= batt.min_soc - 1e-4
        assert step.battery_soc <= batt.max_soc + 1e-4
        assert step.battery_energy_kwh >= e_min - 1e-3
        assert step.battery_energy_kwh <= e_max + 1e-3

        # 2. Power bounds strictly maintained
        assert step.battery_charge_kw <= batt.max_charge_kw + 1e-4
        assert step.battery_discharge_kw <= batt.max_discharge_kw + 1e-4

        # 3. Realized power balance holds
        inflows = step.solar_kw + step.wind_kw + step.battery_discharge_kw + step.grid_import_kw + step.unserved_demand_kw
        outflows = step.demand_kw + step.battery_charge_kw + step.grid_export_kw + step.renewables_curtailed_kw
        assert abs(inflows - outflows) < 0.05, f"Hour {step.hour}: Inflows {inflows} != Outflows {outflows}"


def test_forecast_evaluations_include_persistence_baseline():
    config = MicrogridConfig(scenario_id=ScenarioId.NORMAL_DAY, random_seed=42)
    actual_steps = generate_scenario_timeseries(config)
    _, evaluations = train_and_predict_forecasts(config, actual_steps)

    for target in ["demand", "solar", "wind"]:
        ev = evaluations[target]
        assert ev.metric_mae > 0.0
        assert ev.metric_rmse > 0.0
        assert ev.baseline_mae > 0.0
        assert ev.baseline_rmse > 0.0

"""
Tests for explicit unserved energy reporting and parameter validation error handling.
"""
import pytest
from pydantic import ValidationError
from app.models.schemas import (
    MicrogridConfig,
    BatteryConfig,
    GridConfig,
    TimeStepInput,
    ScenarioId,
)
from app.core.optimizer import solve_optimal_dispatch
from app.core.baseline import run_baseline_dispatch


def test_invalid_battery_soc_bounds():
    with pytest.raises(ValidationError):
        # max_soc <= min_soc must fail
        BatteryConfig(min_soc=0.8, max_soc=0.2)


def test_invalid_initial_soc():
    with pytest.raises(ValidationError):
        # initial_soc outside [min_soc, max_soc] must fail
        BatteryConfig(min_soc=0.2, max_soc=0.8, initial_soc=0.9)


def test_invalid_negative_capacity():
    with pytest.raises(ValidationError):
        BatteryConfig(capacity_kwh=-50.0)


def test_unserved_demand_reported_explicitly():
    """
    Construct a scenario where demand is 100 kW, no renewables exist, battery is at min SoC,
    and grid import is capped at 30 kW. Physical deficit of 70 kW must be explicitly reported as unserved.
    """
    config = MicrogridConfig(
        battery=BatteryConfig(
            capacity_kwh=50.0,
            min_soc=0.2,
            max_soc=0.9,
            initial_soc=0.2,  # fully depleted at min_soc
            max_discharge_kw=0.0,
        ),
        grid=GridConfig(max_import_kw=30.0),
    )

    steps = [
        TimeStepInput(
            hour=0,
            timestamp="00:00",
            demand_kw=100.0,
            solar_kw=0.0,
            wind_kw=0.0,
            renewables_kw=0.0,
            grid_price=0.25,
            grid_carbon_intensity=0.40,
        )
    ]

    # Test baseline
    res_b = run_baseline_dispatch(config, steps)
    assert res_b.steps[0].grid_import_kw == 30.0
    assert res_b.steps[0].unserved_demand_kw == 70.0
    assert res_b.kpis.unserved_energy_kwh == 70.0

    # Test optimizer
    res_o = solve_optimal_dispatch(config, steps)
    assert res_o.steps[0].grid_import_kw == 30.0
    assert res_o.steps[0].unserved_demand_kw == 70.0
    assert res_o.kpis.unserved_energy_kwh == 70.0

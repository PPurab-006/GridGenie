"""
Tests for metrics calculation against hand-checked analytical test cases.
"""
from app.models.schemas import TimeStepDispatch, StrategyResult
from app.core.metrics import calculate_strategy_kpis, compare_strategies


def test_hand_checked_metrics():
    # 2-step mock dispatch with known analytical numbers
    steps = [
        TimeStepDispatch(
            hour=0,
            timestamp="00:00",
            demand_kw=50.0,
            solar_kw=0.0,
            wind_kw=20.0,
            renewables_used_kw=20.0,
            renewables_curtailed_kw=0.0,
            battery_charge_kw=0.0,
            battery_discharge_kw=10.0,
            battery_soc=0.4,
            battery_energy_kwh=40.0,
            grid_import_kw=20.0,
            grid_export_kw=0.0,
            unserved_demand_kw=0.0,
            cost_step=5.0,
            emissions_step=6.0,
            cumulative_cost=5.0,
            cumulative_emissions=6.0,
            grid_price=0.20,
            grid_carbon_intensity=0.30,
            explanation="Test step 1",
        ),
        TimeStepDispatch(
            hour=1,
            timestamp="01:00",
            demand_kw=30.0,
            solar_kw=0.0,
            wind_kw=40.0,
            renewables_used_kw=30.0,
            renewables_curtailed_kw=5.0,
            battery_charge_kw=5.0,
            battery_discharge_kw=0.0,
            battery_soc=0.45,
            battery_energy_kwh=45.0,
            grid_import_kw=0.0,
            grid_export_kw=0.0,
            unserved_demand_kw=0.0,
            cost_step=0.5,
            emissions_step=0.0,
            cumulative_cost=5.5,
            cumulative_emissions=6.0,
            grid_price=0.20,
            grid_carbon_intensity=0.30,
            explanation="Test step 2",
        ),
    ]

    kpis = calculate_strategy_kpis(steps, battery_capacity_kwh=100.0)

    # Hand-checked verification:
    # total cost = 5.0 + 0.5 = 5.5
    assert kpis.total_cost == 5.5
    # total emissions = 6.0 + 0.0 = 6.0
    assert kpis.total_emissions == 6.0
    # total demand = 50 + 30 = 80 kWh
    assert kpis.total_demand_kwh == 80.0
    # total renewable gen = (0+20) + (0+40) = 60 kWh
    assert kpis.total_renewable_gen_kwh == 60.0
    # total renewable used = 20 + 30 = 50 kWh
    assert kpis.total_renewable_used_kwh == 50.0
    # renewable utilization % = 50 / 60 * 100 = 83.3%
    assert kpis.renewable_utilization_pct == 83.3
    # curtailment = 5.0 kWh
    assert kpis.renewable_curtailment_kwh == 5.0
    # curtailment % = 5 / 60 * 100 = 8.3%
    assert kpis.renewable_curtailment_pct == 8.3
    # imported = 20 kWh
    assert kpis.total_grid_imported_kwh == 20.0
    # peak import = 20 kW
    assert kpis.peak_grid_import_kw == 20.0
    # throughput = 10 (disch) + 5 (ch) = 15 kWh
    assert kpis.battery_throughput_kwh == 15.0
    # equivalent cycles = 15 / (2 * 100) = 0.075 -> rounded to 2 decimals
    assert abs(kpis.equivalent_battery_cycles - 0.075) < 0.01


def test_compare_strategies_math():
    b_kpis = calculate_strategy_kpis([], battery_capacity_kwh=100.0)
    b_kpis.total_cost = 200.0
    b_kpis.total_emissions = 500.0
    b_kpis.peak_grid_import_kw = 80.0
    b_kpis.renewable_curtailment_kwh = 40.0

    o_kpis = calculate_strategy_kpis([], battery_capacity_kwh=100.0)
    o_kpis.total_cost = 140.0
    o_kpis.total_emissions = 350.0
    o_kpis.peak_grid_import_kw = 50.0
    o_kpis.renewable_curtailment_kwh = 10.0

    b_res = StrategyResult(strategy_name="Baseline", kpis=b_kpis, steps=[])
    o_res = StrategyResult(strategy_name="Optimized", kpis=o_kpis, steps=[])

    comp = compare_strategies("test", "Test Scenario", "Desc", b_res, o_res)

    # Cost savings: 200 - 140 = 60 (30.0%)
    assert comp.savings_cost_abs == 60.0
    assert comp.savings_cost_pct == 30.0

    # Emissions: 500 - 350 = 150 (30.0%)
    assert comp.emissions_reduction_abs == 150.0
    assert comp.emissions_reduction_pct == 30.0

    # Peak shaving: 80 - 50 = 30 kW (37.5%)
    assert comp.peak_shaving_kw == 30.0
    assert comp.peak_shaving_pct == 37.5

    # Curtailment reduction: 40 - 10 = 30 kWh
    assert comp.curtailment_reduction_kwh == 30.0

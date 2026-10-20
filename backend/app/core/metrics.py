"""
Scientific metrics and performance evaluation module for GridGenie.
Guarantees consistent unit math and graceful handling of edge cases (zero demand, zero emissions, etc.).
"""
from typing import List
from ..models.schemas import TimeStepDispatch, StrategyKPIs, ComparisonResult, StrategyResult


def calculate_strategy_kpis(steps: List[TimeStepDispatch], battery_capacity_kwh: float) -> StrategyKPIs:
    """
    Computes rigorous aggregate KPIs across the 24-hour simulation horizon.
    All time-steps are assumed delta_t = 1.0 hr, so kW * 1 hr = kWh.
    """
    delta_t = 1.0

    total_cost = sum(s.cost_step for s in steps)
    total_emissions = sum(s.emissions_step for s in steps)
    total_demand = sum(s.demand_kw * delta_t for s in steps)
    total_gen = sum((s.solar_kw + s.wind_kw) * delta_t for s in steps)
    total_ren_used = sum(s.renewables_used_kw * delta_t for s in steps)
    total_curtailment = sum(s.renewables_curtailed_kw * delta_t for s in steps)
    total_imported = sum(s.grid_import_kw * delta_t for s in steps)
    total_exported = sum(s.grid_export_kw * delta_t for s in steps)
    peak_import = max((s.grid_import_kw for s in steps), default=0.0)
    total_unserved = sum(s.unserved_demand_kw * delta_t for s in steps)

    # Battery throughput: sum of energy charged + energy discharged
    throughput = sum((s.battery_charge_kw + s.battery_discharge_kw) * delta_t for s in steps)
    # Full equivalent cycle = throughput / (2 * capacity)
    equivalent_cycles = throughput / (2.0 * battery_capacity_kwh) if battery_capacity_kwh > 0 else 0.0

    # Percentages with zero division guard
    ren_util_pct = (total_ren_used / total_gen * 100.0) if total_gen > 0.0 else 0.0
    curt_pct = (total_curtailment / total_gen * 100.0) if total_gen > 0.0 else 0.0
    unserved_pct = (total_unserved / total_demand * 100.0) if total_demand > 0.0 else 0.0

    return StrategyKPIs(
        total_cost=round(total_cost, 2),
        total_emissions=round(total_emissions, 2),
        total_demand_kwh=round(total_demand, 2),
        total_renewable_gen_kwh=round(total_gen, 2),
        total_renewable_used_kwh=round(total_ren_used, 2),
        renewable_utilization_pct=round(ren_util_pct, 1),
        renewable_curtailment_kwh=round(total_curtailment, 2),
        renewable_curtailment_pct=round(curt_pct, 1),
        total_grid_imported_kwh=round(total_imported, 2),
        total_grid_exported_kwh=round(total_exported, 2),
        peak_grid_import_kw=round(peak_import, 2),
        unserved_energy_kwh=round(total_unserved, 2),
        unserved_energy_pct=round(unserved_pct, 2),
        battery_throughput_kwh=round(throughput, 2),
        equivalent_battery_cycles=round(equivalent_cycles, 2),
    )


def compare_strategies(
    scenario_id: str,
    scenario_name: str,
    description: str,
    baseline: StrategyResult,
    optimized: StrategyResult,
) -> ComparisonResult:
    """
    Computes comparative savings and reduction percentages between Baseline and Optimizer.
    Handles edge cases like baseline cost <= 0 safely.
    """
    b_kpi = baseline.kpis
    o_kpi = optimized.kpis

    # Cost savings
    cost_savings_abs = b_kpi.total_cost - o_kpi.total_cost
    if abs(b_kpi.total_cost) > 1e-4:
        cost_savings_pct = (cost_savings_abs / b_kpi.total_cost) * 100.0
    else:
        cost_savings_pct = 0.0

    # Emissions reduction
    emissions_red_abs = b_kpi.total_emissions - o_kpi.total_emissions
    if abs(b_kpi.total_emissions) > 1e-4:
        emissions_red_pct = (emissions_red_abs / b_kpi.total_emissions) * 100.0
    else:
        emissions_red_pct = 0.0

    # Peak shaving
    peak_shave_kw = b_kpi.peak_grid_import_kw - o_kpi.peak_grid_import_kw
    if b_kpi.peak_grid_import_kw > 1e-4:
        peak_shave_pct = (peak_shave_kw / b_kpi.peak_grid_import_kw) * 100.0
    else:
        peak_shave_pct = 0.0

    curt_red_kwh = b_kpi.renewable_curtailment_kwh - o_kpi.renewable_curtailment_kwh

    return ComparisonResult(
        scenario_id=scenario_id,
        scenario_name=scenario_name,
        description=description,
        baseline=baseline,
        optimized=optimized,
        savings_cost_abs=round(cost_savings_abs, 2),
        savings_cost_pct=round(cost_savings_pct, 1),
        emissions_reduction_abs=round(emissions_red_abs, 2),
        emissions_reduction_pct=round(emissions_red_pct, 1),
        peak_shaving_kw=round(peak_shave_kw, 2),
        peak_shaving_pct=round(peak_shave_pct, 1),
        curtailment_reduction_kwh=round(curt_red_kwh, 2),
    )

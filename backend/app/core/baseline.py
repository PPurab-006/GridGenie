"""
Baseline dispatch strategy for GridMind.
Transparent, rule-based, renewable-first heuristic without look-ahead optimization.
Serves as the benchmark to evaluate the economic and ecological value of optimization.
"""
from typing import List
from ..models.schemas import (
    MicrogridConfig,
    TimeStepInput,
    TimeStepDispatch,
    StrategyResult,
)
from .metrics import calculate_strategy_kpis


def run_baseline_dispatch(
    config: MicrogridConfig,
    time_steps: List[TimeStepInput],
) -> StrategyResult:
    """
    Executes greedy renewable-first heuristic dispatch over 24 hours.
    Surplus renewables charge battery; deficits discharge battery; grid import covers remainder.
    """
    batt = config.battery
    grid = config.grid
    opt = config.optimization

    e_min = batt.min_soc * batt.capacity_kwh
    e_max = batt.max_soc * batt.capacity_kwh
    current_e = batt.initial_soc * batt.capacity_kwh
    delta_t = 1.0  # 1 hour steps

    dispatches: List[TimeStepDispatch] = []
    cumulative_cost = 0.0
    cumulative_emissions = 0.0

    for step in time_steps:
        p_ren = step.solar_kw + step.wind_kw
        p_dem = step.demand_kw
        p_prc = step.grid_price
        p_crb = step.grid_carbon_intensity

        p_net = p_ren - p_dem

        p_ch = 0.0
        p_dis = 0.0
        p_imp = 0.0
        p_exp = 0.0
        p_curt = 0.0
        p_unserved = 0.0
        p_ren_used = 0.0
        explanation_parts = []

        if p_net >= 0.0:
            # Renewable surplus
            p_ren_used = p_dem
            surplus = p_net
            explanation_parts.append(f"Renewables ({p_ren:.1f} kW) fully supply load ({p_dem:.1f} kW).")

            # Try to charge battery
            headroom = max(0.0, e_max - current_e)
            max_possible_charge = headroom / (batt.charge_efficiency * delta_t)
            p_ch = min(surplus, batt.max_charge_kw, max_possible_charge)

            if p_ch > 0.01:
                explanation_parts.append(f"Charged battery at {p_ch:.1f} kW.")

            rem_surplus = surplus - p_ch

            # Try to export remaining surplus
            p_exp = min(rem_surplus, grid.max_export_kw)
            if p_exp > 0.01:
                explanation_parts.append(f"Exported {p_exp:.1f} kW to grid.")

            # Remaining beyond export limit is curtailed
            p_curt = max(0.0, rem_surplus - p_exp)
            if p_curt > 0.01:
                explanation_parts.append(f"Curtailed {p_curt:.1f} kW surplus.")

            # Update battery energy
            current_e += batt.charge_efficiency * p_ch * delta_t

        else:
            # Renewable deficit
            p_ren_used = p_ren
            deficit = p_dem - p_ren
            explanation_parts.append(f"Renewables ({p_ren:.1f} kW) cover partial load. Deficit: {deficit:.1f} kW.")

            # Try to discharge battery
            stored_available = max(0.0, current_e - e_min)
            max_possible_discharge = (stored_available * batt.discharge_efficiency) / delta_t
            p_dis = min(deficit, batt.max_discharge_kw, max_possible_discharge)

            if p_dis > 0.01:
                explanation_parts.append(f"Discharged battery at {p_dis:.1f} kW.")

            rem_deficit = deficit - p_dis

            # Grid import for remaining deficit
            p_imp = min(rem_deficit, grid.max_import_kw)
            if p_imp > 0.01:
                explanation_parts.append(f"Imported {p_imp:.1f} kW from grid at ${p_prc:.2f}/kWh.")

            # Check unserved energy
            p_unserved = max(0.0, rem_deficit - p_imp)
            if p_unserved > 0.01:
                explanation_parts.append(f"CRITICAL: {p_unserved:.1f} kW unserved demand (grid limit reached).")

            # Update battery energy
            current_e -= (p_dis / batt.discharge_efficiency) * delta_t

        # Ensure floating point bounds compliance
        current_e = min(max(current_e, e_min), e_max)
        current_soc = current_e / batt.capacity_kwh

        # Economic accounting:
        # Import cost - export revenue + battery degradation wear
        export_price = p_prc * grid.export_rate_factor
        import_cost = p_imp * p_prc * delta_t
        export_rev = p_exp * export_price * delta_t
        deg_cost = (p_ch + p_dis) * batt.degradation_cost_per_kwh * delta_t
        unserved_cost = p_unserved * opt.unserved_energy_penalty * delta_t

        step_cost = import_cost - export_rev + deg_cost + unserved_cost
        step_emissions = p_imp * p_crb * delta_t

        cumulative_cost += step_cost
        cumulative_emissions += step_emissions

        dispatches.append(
            TimeStepDispatch(
                hour=step.hour,
                timestamp=step.timestamp,
                demand_kw=round(p_dem, 2),
                solar_kw=round(step.solar_kw, 2),
                wind_kw=round(step.wind_kw, 2),
                renewables_used_kw=round(p_ren_used, 2),
                renewables_curtailed_kw=round(p_curt, 2),
                battery_charge_kw=round(p_ch, 2),
                battery_discharge_kw=round(p_dis, 2),
                battery_soc=round(current_soc, 4),
                battery_energy_kwh=round(current_e, 2),
                grid_import_kw=round(p_imp, 2),
                grid_export_kw=round(p_exp, 2),
                unserved_demand_kw=round(p_unserved, 2),
                cost_step=round(step_cost, 3),
                emissions_step=round(step_emissions, 3),
                cumulative_cost=round(cumulative_cost, 2),
                cumulative_emissions=round(cumulative_emissions, 2),
                grid_price=p_prc,
                grid_carbon_intensity=p_crb,
                explanation=" ".join(explanation_parts),
            )
        )

    kpis = calculate_strategy_kpis(dispatches, batt.capacity_kwh)
    return StrategyResult(
        strategy_name="Baseline (Heuristic Dispatch)",
        kpis=kpis,
        steps=dispatches,
    )

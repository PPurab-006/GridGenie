"""
Constrained dispatch optimization engine for GridGenie.
Formulates and solves the look-ahead microgrid dispatch problem using SciPy HiGHS LP solver.
Implements genuine two-stage dispatch:
  Stage 1: Day-Ahead Look-Ahead Optimization solved on Forecasts (no future actual leakage).
  Stage 2: Real-Time Physical Realization & Balancing executed on Actual realized conditions.
"""
from typing import List, Optional
import numpy as np
from scipy.optimize import linprog

from ..models.schemas import (
    MicrogridConfig,
    TimeStepInput,
    TimeStepDispatch,
    StrategyResult,
)
from .metrics import calculate_strategy_kpis


def solve_optimal_dispatch(
    config: MicrogridConfig,
    actual_steps: List[TimeStepInput],
    forecast_steps: Optional[List[TimeStepInput]] = None,
) -> StrategyResult:
    """
    Solves the 24-hour constrained dispatch optimization problem using SciPy linprog (HiGHS).
    When forecast_steps is provided, optimization plans the dispatch schedule using the forecasts
    available at decision time, and then evaluates real-time physical realization against actual_steps.
    """
    plan_inputs = forecast_steps if forecast_steps is not None else actual_steps
    T = len(plan_inputs)
    batt = config.battery
    grid = config.grid
    opt = config.optimization
    delta_t = 1.0

    e_min = batt.min_soc * batt.capacity_kwh
    e_max = batt.max_soc * batt.capacity_kwh
    e_init = batt.initial_soc * batt.capacity_kwh

    # Off-peak price average for terminal valuation
    offpeak_prices = [s.grid_price for s in plan_inputs if s.hour < 6 or s.hour >= 22]
    c_terminal = np.mean(offpeak_prices) if offpeak_prices else 0.12

    # Variables per hour t: 0:P_imp, 1:P_exp, 2:P_ch, 3:P_dis, 4:P_curt, 5:P_uns, 6:E
    n_vars = 7 * T

    def idx_imp(t: int) -> int: return t
    def idx_exp(t: int) -> int: return T + t
    def idx_ch(t: int) -> int: return 2 * T + t
    def idx_dis(t: int) -> int: return 3 * T + t
    def idx_curt(t: int) -> int: return 4 * T + t
    def idx_uns(t: int) -> int: return 5 * T + t
    def idx_e(t: int) -> int: return 6 * T + t

    # 1. Objective vector c (evaluated on decision-time inputs)
    c = np.zeros(n_vars)
    for t, step in enumerate(plan_inputs):
        c[idx_imp(t)] = (step.grid_price + (opt.carbon_weight * step.grid_carbon_intensity)) * delta_t
        export_price = step.grid_price * grid.export_rate_factor
        c[idx_exp(t)] = -export_price * delta_t
        c[idx_ch(t)] = batt.degradation_cost_per_kwh * delta_t
        c[idx_dis(t)] = batt.degradation_cost_per_kwh * delta_t
        c[idx_curt(t)] = 1e-4
        c[idx_uns(t)] = opt.unserved_energy_penalty * delta_t
        if t == T - 1:
            c[idx_e(t)] = -c_terminal

    # 2. Equality constraints: A_eq @ x = b_eq
    num_eq = 2 * T
    A_eq = np.zeros((num_eq, n_vars))
    b_eq = np.zeros(num_eq)

    # Power balance: P_imp - P_exp - P_ch + P_dis - P_curt + P_uns = P_dem - P_ren
    for t, step in enumerate(plan_inputs):
        row = t
        p_ren = step.solar_kw + step.wind_kw
        p_dem = step.demand_kw
        A_eq[row, idx_imp(t)] = 1.0
        A_eq[row, idx_exp(t)] = -1.0
        A_eq[row, idx_ch(t)] = -1.0
        A_eq[row, idx_dis(t)] = 1.0
        A_eq[row, idx_curt(t)] = -1.0
        A_eq[row, idx_uns(t)] = 1.0
        b_eq[row] = p_dem - p_ren

    # Battery Dynamics: E[t] - E[t-1] - eta_ch*dt*P_ch + (dt/eta_dis)*P_dis = 0
    for t in range(T):
        row = T + t
        A_eq[row, idx_e(t)] = 1.0
        if t > 0:
            A_eq[row, idx_e(t - 1)] = -1.0
        A_eq[row, idx_ch(t)] = -batt.charge_efficiency * delta_t
        A_eq[row, idx_dis(t)] = (delta_t / batt.discharge_efficiency)
        b_eq[row] = e_init if t == 0 else 0.0

    # 3. Variable bounds
    bounds = [None] * n_vars
    for t, step in enumerate(plan_inputs):
        p_ren = step.solar_kw + step.wind_kw
        p_dem = step.demand_kw
        bounds[idx_imp(t)] = (0.0, grid.max_import_kw)
        bounds[idx_exp(t)] = (0.0, grid.max_export_kw)
        bounds[idx_ch(t)] = (0.0, batt.max_charge_kw)
        bounds[idx_dis(t)] = (0.0, batt.max_discharge_kw)
        bounds[idx_curt(t)] = (0.0, max(0.0, p_ren))
        bounds[idx_uns(t)] = (0.0, p_dem)
        bounds[idx_e(t)] = (e_min, e_max)

    # 4. Solve with HiGHS
    res = linprog(c=c, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method="highs")
    if not res.success:
        raise RuntimeError(f"Microgrid optimization solver failed: {res.message}")

    x = res.x

    # 5. Real-Time Physical Realization
    dispatches: List[TimeStepDispatch] = []
    cumulative_cost = 0.0
    cumulative_emissions = 0.0
    current_e = e_init

    for t, step in enumerate(actual_steps):
        # Planned policy from look-ahead forecast optimization
        plan_ch = float(max(0.0, x[idx_ch(t)]))
        plan_dis = float(max(0.0, x[idx_dis(t)]))

        p_ren = step.solar_kw + step.wind_kw
        p_dem = step.demand_kw
        net_surplus = p_ren - p_dem

        # Real-time battery execution with physical state bounds
        headroom = max(0.0, e_max - current_e)
        max_ch_capacity = headroom / (batt.charge_efficiency * delta_t)

        stored_available = max(0.0, current_e - e_min)
        max_dis_capacity = (stored_available * batt.discharge_efficiency) / delta_t

        if forecast_steps is None:
            # Direct optimal solution when no forecast decoupling requested
            p_ch = plan_ch
            p_dis = plan_dis
            p_imp = float(max(0.0, x[idx_imp(t)]))
            p_exp = float(max(0.0, x[idx_exp(t)]))
            p_curt = float(max(0.0, x[idx_curt(t)]))
            p_uns = float(max(0.0, x[idx_uns(t)]))
        else:
            # Two-stage realization:
            # Execute planned battery commitment, adapting real-time to forecast errors
            p_ch = 0.0
            p_dis = 0.0
            p_imp = 0.0
            p_exp = 0.0
            p_curt = 0.0
            p_uns = 0.0

            if plan_ch > 0.01:
                # Planned charge: if renewables surplus exists, soak it up; if off-peak grid was planned, charge up to headroom
                p_ch = min(plan_ch, batt.max_charge_kw, max_ch_capacity)
                remaining_net = net_surplus - p_ch
                if remaining_net >= 0.0:
                    p_exp = min(remaining_net, grid.max_export_kw)
                    p_curt = max(0.0, remaining_net - p_exp)
                else:
                    needed_deficit = -remaining_net
                    p_imp = min(needed_deficit, grid.max_import_kw)
                    p_uns = max(0.0, needed_deficit - p_imp)

            elif plan_dis > 0.01:
                # Planned discharge: provide planned discharge up to available stored energy
                # If unexpected weather deficit occurs (e.g. cloud shock), battery can provide real-time reserve up to max_discharge_kw
                deficit_to_cover = max(0.0, -net_surplus)
                desired_dis = max(plan_dis, min(deficit_to_cover, batt.max_discharge_kw))
                p_dis = min(desired_dis, batt.max_discharge_kw, max_dis_capacity)

                remaining_deficit = deficit_to_cover - p_dis
                p_imp = min(remaining_deficit, grid.max_import_kw)
                p_uns = max(0.0, remaining_deficit - p_imp)

            else:
                # Planned idle: if real-time surplus exists, export or charge if headroom exists
                if net_surplus >= 0.0:
                    p_exp = min(net_surplus, grid.max_export_kw)
                    p_curt = max(0.0, net_surplus - p_exp)
                else:
                    deficit = -net_surplus
                    p_imp = min(deficit, grid.max_import_kw)
                    p_uns = max(0.0, deficit - p_imp)

        # Update physical battery energy
        current_e += (batt.charge_efficiency * p_ch - (p_dis / batt.discharge_efficiency)) * delta_t
        current_e = min(max(current_e, e_min), e_max)
        soc_val = current_e / batt.capacity_kwh

        p_ren_used = max(0.0, p_ren - p_curt)

        # Economic accounting on realized flows
        export_price = step.grid_price * grid.export_rate_factor
        import_cost = p_imp * step.grid_price * delta_t
        export_rev = p_exp * export_price * delta_t
        deg_cost = (p_ch + p_dis) * batt.degradation_cost_per_kwh * delta_t
        unserved_cost = p_uns * opt.unserved_energy_penalty * delta_t

        step_cost = import_cost - export_rev + deg_cost + unserved_cost
        step_emissions = p_imp * step.grid_carbon_intensity * delta_t

        cumulative_cost += step_cost
        cumulative_emissions += step_emissions

        # Generate intelligent decision explanation
        explanation = _generate_dispatch_explanation(
            step=step,
            p_ch=p_ch,
            p_dis=p_dis,
            p_imp=p_imp,
            p_exp=p_exp,
            p_curt=p_curt,
            p_uns=p_uns,
            soc=soc_val,
            carbon_weight=opt.carbon_weight,
            is_two_stage=forecast_steps is not None,
        )

        dispatches.append(
            TimeStepDispatch(
                hour=step.hour,
                timestamp=step.timestamp,
                demand_kw=round(step.demand_kw, 2),
                solar_kw=round(step.solar_kw, 2),
                wind_kw=round(step.wind_kw, 2),
                renewables_used_kw=round(p_ren_used, 2),
                renewables_curtailed_kw=round(p_curt, 2),
                battery_charge_kw=round(p_ch, 2),
                battery_discharge_kw=round(p_dis, 2),
                battery_soc=round(soc_val, 4),
                battery_energy_kwh=round(current_e, 2),
                grid_import_kw=round(p_imp, 2),
                grid_export_kw=round(p_exp, 2),
                unserved_demand_kw=round(p_uns, 2),
                cost_step=round(step_cost, 3),
                emissions_step=round(step_emissions, 3),
                cumulative_cost=round(cumulative_cost, 2),
                cumulative_emissions=round(cumulative_emissions, 2),
                grid_price=step.grid_price,
                grid_carbon_intensity=step.grid_carbon_intensity,
                explanation=explanation,
            )
        )

    kpis = calculate_strategy_kpis(dispatches, batt.capacity_kwh)
    return StrategyResult(
        strategy_name="GridGenie Optimizer (Two-Stage LP)",
        kpis=kpis,
        steps=dispatches,
    )


def _generate_dispatch_explanation(
    step: TimeStepInput,
    p_ch: float,
    p_dis: float,
    p_imp: float,
    p_exp: float,
    p_curt: float,
    p_uns: float,
    soc: float,
    carbon_weight: float,
    is_two_stage: bool = True,
) -> str:
    """
    Produces transparent, engineering-grade narrative rationale for the dispatch decision.
    """
    reasons = []

    if p_uns > 0.05:
        reasons.append(f"UNSERVED DEMAND ({p_uns:.1f} kW): Physical capacity deficit exceeds grid interconnection limit.")

    if p_ch > 0.5:
        if step.grid_price <= 0.15:
            reasons.append(f"Pre-charging ({p_ch:.1f} kW) during low off-peak tariff (${step.grid_price:.2f}/kWh) to buffer upcoming peak.")
        else:
            reasons.append(f"Soaking up surplus renewables ({p_ch:.1f} kW) into battery (SoC {soc*100:.0f}%).")

    if p_dis > 0.5:
        if step.grid_price >= 0.30:
            reasons.append(f"Discharging ({p_dis:.1f} kW) during peak price (${step.grid_price:.2f}/kWh) to shave expensive utility import.")
        elif carbon_weight > 0.0 and step.grid_carbon_intensity >= 0.50:
            reasons.append(f"Discharging ({p_dis:.1f} kW) to displace high-carbon grid peaker generation ({step.grid_carbon_intensity:.2f} kg/kWh).")
        else:
            reasons.append(f"Discharging ({p_dis:.1f} kW) to balance deficit while preserving minimal cycle degradation.")

    if p_imp > 0.5:
        if p_dis < 0.5 and p_ch < 0.5:
            reasons.append(f"Direct grid import ({p_imp:.1f} kW) at ${step.grid_price:.2f}/kWh; battery held in reserve.")
        elif p_ch > 0.5:
            reasons.append(f"Importing ({p_imp:.1f} kW) to supply load and charge storage ahead of forecasted deficit.")

    if p_exp > 0.5:
        reasons.append(f"Exporting surplus generation ({p_exp:.1f} kW) to earn feed-in credits.")

    if p_curt > 0.5:
        reasons.append(f"Curtailed ({p_curt:.1f} kW) as battery and grid export headroom were both fully saturated.")

    if not reasons:
        reasons.append(f"Balanced state: Renewables directly meet microgrid demand (SoC {soc*100:.0f}%).")

    return " ".join(reasons)

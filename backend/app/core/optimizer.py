"""
Constrained dispatch optimization engine for GridMind.
Formulates and solves the look-ahead microgrid dispatch problem using SciPy HiGHS LP solver.
Enforces physical conservation, power limits, battery efficiency, SoC bounds, and explicit unserved energy.
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
    time_steps: List[TimeStepInput],
) -> StrategyResult:
    """
    Solves the 24-hour constrained dispatch optimization problem using SciPy linprog (HiGHS).
    Decision variables per hour t:
      0: P_imp[t] (Grid import kW)
      1: P_exp[t] (Grid export kW)
      2: P_ch[t]  (Battery charge kW)
      3: P_dis[t] (Battery discharge kW)
      4: P_curt[t](Curtailment kW)
      5: P_uns[t] (Unserved demand kW)
      6: E[t]     (Battery energy kWh)
    """
    T = len(time_steps)  # 24
    batt = config.battery
    grid = config.grid
    opt = config.optimization
    delta_t = 1.0

    e_min = batt.min_soc * batt.capacity_kwh
    e_max = batt.max_soc * batt.capacity_kwh
    e_init = batt.initial_soc * batt.capacity_kwh

    # Off-peak price average for terminal valuation
    offpeak_prices = [s.grid_price for s in time_steps if s.hour < 6 or s.hour >= 22]
    c_terminal = np.mean(offpeak_prices) if offpeak_prices else 0.12

    # Number of variables = 7 * T
    n_vars = 7 * T

    def idx_imp(t: int) -> int:
        return t

    def idx_exp(t: int) -> int:
        return T + t

    def idx_ch(t: int) -> int:
        return 2 * T + t

    def idx_dis(t: int) -> int:
        return 3 * T + t

    def idx_curt(t: int) -> int:
        return 4 * T + t

    def idx_uns(t: int) -> int:
        return 5 * T + t

    def idx_e(t: int) -> int:
        return 6 * T + t

    # 1. Objective vector c
    c = np.zeros(n_vars)
    for t, step in enumerate(time_steps):
        # Grid import: electricity tariff + optional carbon weight
        c[idx_imp(t)] = (step.grid_price + (opt.carbon_weight * step.grid_carbon_intensity)) * delta_t
        # Grid export: negative cost (revenue)
        export_price = step.grid_price * grid.export_rate_factor
        c[idx_exp(t)] = -export_price * delta_t
        # Battery cycling wear penalty
        c[idx_ch(t)] = batt.degradation_cost_per_kwh * delta_t
        c[idx_dis(t)] = batt.degradation_cost_per_kwh * delta_t
        # Curtailment micro-penalty (avoids arbitrary curtailment when storage/export is free)
        c[idx_curt(t)] = 1e-4
        # Value of Lost Load penalty for unserved energy
        c[idx_uns(t)] = opt.unserved_energy_penalty * delta_t
        # Terminal state of charge credit at t = T-1
        if t == T - 1:
            c[idx_e(t)] = -c_terminal

    # 2. Equality constraints: A_eq @ x = b_eq
    # - T constraints for Power Balance
    # - T constraints for Battery SoC Dynamics
    num_eq = 2 * T
    A_eq = np.zeros((num_eq, n_vars))
    b_eq = np.zeros(num_eq)

    # Power balance: P_imp - P_exp - P_ch + P_dis - P_curt + P_uns = P_dem - P_ren
    for t, step in enumerate(time_steps):
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

    # Battery Dynamics:
    # E[t] - E[t-1] - eta_ch * delta_t * P_ch[t] + (delta_t / eta_dis) * P_dis[t] = 0 (or E_init for t=0)
    for t in range(T):
        row = T + t
        A_eq[row, idx_e(t)] = 1.0
        if t > 0:
            A_eq[row, idx_e(t - 1)] = -1.0

        A_eq[row, idx_ch(t)] = -batt.charge_efficiency * delta_t
        A_eq[row, idx_dis(t)] = (delta_t / batt.discharge_efficiency)

        if t == 0:
            b_eq[row] = e_init
        else:
            b_eq[row] = 0.0

    # 3. Variable bounds
    bounds = [None] * n_vars
    for t, step in enumerate(time_steps):
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
    res = linprog(
        c=c,
        A_eq=A_eq,
        b_eq=b_eq,
        bounds=bounds,
        method="highs",
    )

    if not res.success:
        raise RuntimeError(f"Microgrid optimization solver failed: {res.message}")

    x = res.x

    # 5. Build TimeStepDispatch records
    dispatches: List[TimeStepDispatch] = []
    cumulative_cost = 0.0
    cumulative_emissions = 0.0

    for t, step in enumerate(time_steps):
        p_imp = float(max(0.0, x[idx_imp(t)]))
        p_exp = float(max(0.0, x[idx_exp(t)]))
        p_ch = float(max(0.0, x[idx_ch(t)]))
        p_dis = float(max(0.0, x[idx_dis(t)]))
        p_curt = float(max(0.0, x[idx_curt(t)]))
        p_uns = float(max(0.0, x[idx_uns(t)]))
        e_val = float(min(max(x[idx_e(t)], e_min), e_max))
        soc_val = e_val / batt.capacity_kwh

        p_ren = step.solar_kw + step.wind_kw
        p_ren_used = max(0.0, p_ren - p_curt)

        # Economic calculation (excluding terminal credit from real operating cost)
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
                battery_energy_kwh=round(e_val, 2),
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
        strategy_name="GridMind Optimizer (Look-Ahead LP)",
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

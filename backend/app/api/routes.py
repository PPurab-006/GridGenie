"""
FastAPI router endpoints for GridMind.
Provides REST APIs for simulation, forecasting, dispatch optimization, strategy comparison, and benchmarks.
"""
from datetime import datetime, timezone
from typing import Dict, List
from fastapi import APIRouter, HTTPException

from ..models.schemas import (
    MicrogridConfig,
    ScenarioId,
    ScenarioSummary,
    TimeStepInput,
    ForecastEvaluation,
    StrategyResult,
    ComparisonResult,
    BenchmarkTableResponse,
)
from ..core.simulation import generate_scenario_timeseries, get_scenario_summaries, SCENARIO_METADATA
from ..core.forecasting import train_and_predict_forecasts
from ..core.baseline import run_baseline_dispatch
from ..core.optimizer import solve_optimal_dispatch
from ..core.metrics import compare_strategies

router = APIRouter(prefix="/api", tags=["Microgrid Operations"])


@router.get("/health")
def health_check() -> Dict[str, str]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "system": "GridMind Microgrid Digital Twin",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }


@router.get("/scenarios", response_model=List[ScenarioSummary])
def list_scenarios() -> List[ScenarioSummary]:
    """Lists available pre-configured operational scenarios with summary metrics."""
    return get_scenario_summaries()


@router.post("/simulate", response_model=List[TimeStepInput])
def simulate_scenario(config: MicrogridConfig) -> List[TimeStepInput]:
    """Generates the 24-hour physical time-series for the specified scenario and parameters."""
    return generate_scenario_timeseries(config)


@router.post("/forecasts", response_model=Dict[str, ForecastEvaluation])
def get_forecasts(config: MicrogridConfig) -> Dict[str, ForecastEvaluation]:
    """
    Executes the chronological forecasting models (Ridge regression)
    for demand, solar, and wind, returning 24-hour predictions with MAE and RMSE metrics.
    """
    actual_steps = generate_scenario_timeseries(config)
    return train_and_predict_forecasts(config, actual_steps)


@router.post("/dispatch/baseline", response_model=StrategyResult)
def dispatch_baseline(config: MicrogridConfig) -> StrategyResult:
    """Executes rule-based heuristic dispatch on the configured scenario."""
    time_steps = generate_scenario_timeseries(config)
    return run_baseline_dispatch(config, time_steps)


@router.post("/dispatch/optimize", response_model=StrategyResult)
def dispatch_optimize(config: MicrogridConfig) -> StrategyResult:
    """Executes constrained look-ahead LP optimization on the configured scenario."""
    time_steps = generate_scenario_timeseries(config)
    return solve_optimal_dispatch(config, time_steps)


@router.post("/compare", response_model=ComparisonResult)
def compare_dispatch_strategies(config: MicrogridConfig) -> ComparisonResult:
    """
    Runs both Baseline and GridMind Optimizer on identical scenario inputs and parameters,
    computing side-by-side KPIs, cost savings, carbon reduction, and peak shaving.
    """
    time_steps = generate_scenario_timeseries(config)
    baseline_res = run_baseline_dispatch(config, time_steps)
    optimized_res = solve_optimal_dispatch(config, time_steps)

    meta = SCENARIO_METADATA.get(config.scenario_id, {
        "name": config.scenario_id.value,
        "description": "Custom Microgrid Scenario",
    })

    return compare_strategies(
        scenario_id=config.scenario_id.value,
        scenario_name=meta["name"],
        description=meta["description"],
        baseline=baseline_res,
        optimized=optimized_res,
    )


@router.get("/benchmarks", response_model=BenchmarkTableResponse)
def get_benchmarks(seed: int = 42) -> BenchmarkTableResponse:
    """
    Runs both Baseline and GridMind Optimizer across all 4 operational scenarios:
    1. Normal Day
    2. Cloud Shock
    3. Evening Peak
    4. Low-Renewables Stress Test
    Returns full comparative metrics for scientific benchmarking.
    """
    results: List[ComparisonResult] = []

    for s_id in [ScenarioId.NORMAL_DAY, ScenarioId.CLOUD_SHOCK, ScenarioId.EVENING_PEAK, ScenarioId.STRESS_TEST]:
        cfg = MicrogridConfig(scenario_id=s_id, random_seed=seed)
        steps = generate_scenario_timeseries(cfg)
        b_res = run_baseline_dispatch(cfg, steps)
        o_res = solve_optimal_dispatch(cfg, steps)
        meta = SCENARIO_METADATA[s_id]

        comp = compare_strategies(
            scenario_id=s_id.value,
            scenario_name=meta["name"],
            description=meta["description"],
            baseline=b_res,
            optimized=o_res,
        )
        results.append(comp)

    return BenchmarkTableResponse(
        scenarios=results,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )

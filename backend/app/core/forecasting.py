"""
Forecasting module for GridMind.
Provides transparent, reproducible day-ahead predictions for demand, solar, and wind.
Uses scikit-learn linear/ridge regression with cyclical time features, solar geometry proxy,
and lagged autoregressive inputs. Strictly adheres to chronological training without future data leakage.
"""
from typing import Dict, List, Tuple
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

from ..models.schemas import (
    ForecastEvaluation,
    ForecastPoint,
    MicrogridConfig,
    TimeStepInput,
)
from .simulation import generate_scenario_timeseries


def _build_features(
    history: List[TimeStepInput],
    target_len: int = 24,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Constructs feature matrices (X) and targets (y_demand, y_solar, y_wind)
    from a chronological historical time-series.
    Features:
      - sin(2*pi*hour/24), cos(2*pi*hour/24)
      - solar_geometry_factor (theoretical clear-sky bell curve)
      - lag_24_demand, lag_24_solar, lag_24_wind (same hour yesterday)
    """
    total_steps = len(history)
    X, y_dem, y_sol, y_wnd = [], [], [], []

    for i in range(24, total_steps):
        step = history[i]
        h = step.hour
        sin_h = np.sin(2 * np.pi * h / 24.0)
        cos_h = np.cos(2 * np.pi * h / 24.0)
        
        # Clear sky theoretical envelope for hour
        clear_sky = max(0.0, np.sin(np.pi * (h - 6) / 13)) if 6 <= h <= 18 else 0.0

        # Lagged values exactly 24 hours prior
        lag_dem = history[i - 24].demand_kw
        lag_sol = history[i - 24].solar_kw
        lag_wnd = history[i - 24].wind_kw

        X.append([sin_h, cos_h, clear_sky, lag_dem, lag_sol, lag_wnd])
        y_dem.append(step.demand_kw)
        y_sol.append(step.solar_kw)
        y_wnd.append(step.wind_kw)

    return np.array(X), np.array(y_dem), np.array(y_sol), np.array(y_wnd)


def train_and_predict_forecasts(
    config: MicrogridConfig,
    actual_day_steps: List[TimeStepInput],
) -> Dict[str, ForecastEvaluation]:
    """
    Generates a 7-day chronological historical training sequence ending right before
    the target evaluation day. Trains independent models for demand, solar, and wind,
    and returns 24-hour predictions alongside MAE and RMSE metrics.
    """
    # Generate 7 days of training data preceding the scenario day
    history_steps: List[TimeStepInput] = []
    base_seed = config.random_seed * 100

    for day in range(7):
        hist_cfg = config.model_copy(update={"random_seed": base_seed + day})
        day_steps = generate_scenario_timeseries(hist_cfg)
        for s in day_steps:
            history_steps.append(s)

    # Features and targets from chronological history
    X_train, y_dem_train, y_sol_train, y_wnd_train = _build_features(history_steps)

    # Fit lightweight Ridge models
    model_dem = Ridge(alpha=1.0).fit(X_train, y_dem_train)
    model_sol = Ridge(alpha=1.0).fit(X_train, y_sol_train)
    model_wnd = Ridge(alpha=1.0).fit(X_train, y_wnd_train)

    # Build inference features for the target day using day 6 (yesterday) as lag
    yesterday_steps = history_steps[-24:]
    X_test = []
    for h in range(24):
        sin_h = np.sin(2 * np.pi * h / 24.0)
        cos_h = np.cos(2 * np.pi * h / 24.0)
        clear_sky = max(0.0, np.sin(np.pi * (h - 6) / 13)) if 6 <= h <= 18 else 0.0

        lag_dem = yesterday_steps[h].demand_kw
        lag_sol = yesterday_steps[h].solar_kw
        lag_wnd = yesterday_steps[h].wind_kw

        X_test.append([sin_h, cos_h, clear_sky, lag_dem, lag_sol, lag_wnd])

    X_test = np.array(X_test)

    # Predict
    pred_dem = np.maximum(model_dem.predict(X_test), 5.0)
    pred_sol = np.maximum(model_sol.predict(X_test), 0.0)
    pred_wnd = np.maximum(model_wnd.predict(X_test), 0.0)

    # Zero out solar at nighttime (physics constraint)
    for h in range(24):
        if h < 6 or h > 18:
            pred_sol[h] = 0.0

    # Package results
    results: Dict[str, ForecastEvaluation] = {}

    for series_name, actuals, preds in [
        ("demand", [s.demand_kw for s in actual_day_steps], pred_dem),
        ("solar", [s.solar_kw for s in actual_day_steps], pred_sol),
        ("wind", [s.wind_kw for s in actual_day_steps], pred_wnd),
    ]:
        points = []
        for h in range(24):
            act = float(actuals[h])
            prd = float(round(preds[h], 2))
            err = float(round(prd - act, 2))
            points.append(
                ForecastPoint(
                    hour=h,
                    timestamp=f"{h:02d}:00",
                    actual=act,
                    forecast=prd,
                    error=err,
                )
            )

        mae = float(round(mean_absolute_error(actuals, preds), 2))
        rmse = float(round(root_mean_squared_error(actuals, preds), 2))

        results[series_name] = ForecastEvaluation(
            metric_mae=mae,
            metric_rmse=rmse,
            points=points,
        )

    return results

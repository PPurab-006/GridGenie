"""
Integration tests for FastAPI endpoints.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "GridGenie" in data["system"]


def test_scenarios_endpoint():
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) == 4
    ids = [s["id"] for s in scenarios]
    assert "normal_day" in ids
    assert "cloud_shock" in ids
    assert "evening_peak" in ids
    assert "stress_test" in ids


def test_simulate_endpoint():
    payload = {"scenario_id": "normal_day", "random_seed": 42}
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    steps = response.json()
    assert len(steps) == 24
    assert steps[0]["hour"] == 0
    assert steps[23]["hour"] == 23


def test_forecasts_endpoint():
    payload = {"scenario_id": "normal_day", "random_seed": 42}
    response = client.post("/api/forecasts", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "demand" in data
    assert "solar" in data
    assert "wind" in data
    assert "metric_mae" in data["demand"]
    assert "metric_rmse" in data["demand"]
    assert len(data["demand"]["points"]) == 24


def test_compare_endpoint():
    payload = {
        "scenario_id": "cloud_shock",
        "battery": {
            "capacity_kwh": 100.0,
            "max_charge_kw": 40.0,
            "max_discharge_kw": 40.0,
            "min_soc": 0.15,
            "max_soc": 0.95,
            "initial_soc": 0.40,
        },
        "random_seed": 42,
    }
    response = client.post("/api/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert "optimized" in data
    assert "savings_cost_abs" in data
    assert "emissions_reduction_abs" in data
    assert len(data["baseline"]["steps"]) == 24
    assert len(data["optimized"]["steps"]) == 24


def test_benchmarks_endpoint():
    response = client.get("/api/benchmarks?seed=42")
    assert response.status_code == 200
    data = response.json()
    assert len(data["scenarios"]) == 4
    for sc in data["scenarios"]:
        assert sc["baseline"]["kpis"]["total_cost"] > 0
        assert sc["optimized"]["kpis"]["total_cost"] > 0

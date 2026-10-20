"""
GridMind Pydantic data models and schemas.
"""
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class ScenarioId(str, Enum):
    NORMAL_DAY = "normal_day"
    CLOUD_SHOCK = "cloud_shock"
    EVENING_PEAK = "evening_peak"
    STRESS_TEST = "stress_test"


class BatteryConfig(BaseModel):
    capacity_kwh: float = Field(100.0, gt=0, description="Nominal battery storage capacity in kWh")
    max_charge_kw: float = Field(40.0, ge=0, description="Maximum charging rate in kW")
    max_discharge_kw: float = Field(40.0, ge=0, description="Maximum discharging rate in kW")
    charge_efficiency: float = Field(0.95, gt=0, le=1.0, description="One-way charging efficiency (0-1)")
    discharge_efficiency: float = Field(0.95, gt=0, le=1.0, description="One-way discharging efficiency (0-1)")
    min_soc: float = Field(0.15, ge=0.0, lt=1.0, description="Minimum allowable battery State of Charge")
    max_soc: float = Field(0.95, gt=0.0, le=1.0, description="Maximum allowable battery State of Charge")
    initial_soc: float = Field(0.40, ge=0.0, le=1.0, description="Starting battery State of Charge")
    degradation_cost_per_kwh: float = Field(0.015, ge=0.0, description="Battery wear penalty per kWh throughput ($/kWh)")

    @field_validator("max_soc")
    @classmethod
    def validate_soc_bounds(cls, v: float, info):
        min_val = info.data.get("min_soc", 0.0)
        if v <= min_val:
            raise ValueError(f"max_soc ({v}) must be greater than min_soc ({min_val})")
        return v

    @field_validator("initial_soc")
    @classmethod
    def validate_initial_soc(cls, v: float, info):
        min_soc = info.data.get("min_soc", 0.0)
        max_soc = info.data.get("max_soc", 1.0)
        if not (min_soc <= v <= max_soc):
            raise ValueError(f"initial_soc ({v}) must be within [min_soc ({min_soc}), max_soc ({max_soc})]")
        return v


class GridConfig(BaseModel):
    max_import_kw: float = Field(150.0, ge=0, description="Utility interconnect maximum import power (kW)")
    max_export_kw: float = Field(50.0, ge=0, description="Utility interconnect maximum export power (kW)")
    export_rate_factor: float = Field(0.50, ge=0.0, le=1.0, description="Export feed-in tariff ratio relative to retail price")


class OptimizationConfig(BaseModel):
    carbon_weight: float = Field(0.0, ge=0.0, description="Carbon emission penalty ($/kg CO2). 0 = pure cost minimization")
    unserved_energy_penalty: float = Field(50.0, gt=0, description="Value of Lost Load penalty for unserved energy ($/kWh)")


class MicrogridConfig(BaseModel):
    scenario_id: ScenarioId = Field(ScenarioId.NORMAL_DAY, description="Active scenario identifier")
    battery: BatteryConfig = Field(default_factory=BatteryConfig)
    grid: GridConfig = Field(default_factory=GridConfig)
    optimization: OptimizationConfig = Field(default_factory=OptimizationConfig)
    solar_capacity_kw: float = Field(80.0, gt=0, description="Installed solar PV peak rating (kW)")
    wind_capacity_kw: float = Field(50.0, gt=0, description="Installed wind turbine rating (kW)")
    random_seed: int = Field(42, description="Random seed for deterministic scenario reproducibility")


class TimeStepInput(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    timestamp: str
    demand_kw: float
    solar_kw: float
    wind_kw: float
    renewables_kw: float
    grid_price: float  # $/kWh
    grid_carbon_intensity: float  # kg CO2/kWh


class ForecastPoint(BaseModel):
    hour: int
    timestamp: str
    actual: float
    forecast: float
    error: float


class ForecastEvaluation(BaseModel):
    metric_mae: float
    metric_rmse: float
    points: List[ForecastPoint]


class TimeStepDispatch(BaseModel):
    hour: int
    timestamp: str
    demand_kw: float
    solar_kw: float
    wind_kw: float
    renewables_used_kw: float
    renewables_curtailed_kw: float
    battery_charge_kw: float
    battery_discharge_kw: float
    battery_soc: float
    battery_energy_kwh: float
    grid_import_kw: float
    grid_export_kw: float
    unserved_demand_kw: float
    cost_step: float
    emissions_step: float
    cumulative_cost: float
    cumulative_emissions: float
    grid_price: float
    grid_carbon_intensity: float
    explanation: str


class StrategyKPIs(BaseModel):
    total_cost: float
    total_emissions: float
    total_demand_kwh: float
    total_renewable_gen_kwh: float
    total_renewable_used_kwh: float
    renewable_utilization_pct: float
    renewable_curtailment_kwh: float
    renewable_curtailment_pct: float
    total_grid_imported_kwh: float
    total_grid_exported_kwh: float
    peak_grid_import_kw: float
    unserved_energy_kwh: float
    unserved_energy_pct: float
    battery_throughput_kwh: float
    equivalent_battery_cycles: float


class StrategyResult(BaseModel):
    strategy_name: str
    kpis: StrategyKPIs
    steps: List[TimeStepDispatch]


class ComparisonResult(BaseModel):
    scenario_id: str
    scenario_name: str
    description: str
    baseline: StrategyResult
    optimized: StrategyResult
    savings_cost_abs: float
    savings_cost_pct: float
    emissions_reduction_abs: float
    emissions_reduction_pct: float
    peak_shaving_kw: float
    peak_shaving_pct: float
    curtailment_reduction_kwh: float


class ScenarioSummary(BaseModel):
    id: ScenarioId
    name: str
    tagline: str
    description: str
    peak_demand_kw: float
    solar_peak_kw: float
    wind_peak_kw: float
    avg_price_per_kwh: float
    avg_carbon_intensity: float


class BenchmarkTableResponse(BaseModel):
    scenarios: List[ComparisonResult]
    generated_at: str

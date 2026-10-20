/**
 * GridMind API TypeScript definitions
 */

export type ScenarioId = 'normal_day' | 'cloud_shock' | 'evening_peak' | 'stress_test';

export interface BatteryConfig {
  capacity_kwh: number;
  max_charge_kw: number;
  max_discharge_kw: number;
  charge_efficiency: number;
  discharge_efficiency: number;
  min_soc: number;
  max_soc: number;
  initial_soc: number;
  degradation_cost_per_kwh: number;
}

export interface GridConfig {
  max_import_kw: number;
  max_export_kw: number;
  export_rate_factor: number;
}

export interface OptimizationConfig {
  carbon_weight: number;
  unserved_energy_penalty: number;
}

export interface MicrogridConfig {
  scenario_id: ScenarioId;
  battery: BatteryConfig;
  grid: GridConfig;
  optimization: OptimizationConfig;
  solar_capacity_kw: number;
  wind_capacity_kw: number;
  random_seed: number;
}

export interface TimeStepInput {
  hour: number;
  timestamp: string;
  demand_kw: number;
  solar_kw: number;
  wind_kw: number;
  renewables_kw: number;
  grid_price: number;
  grid_carbon_intensity: number;
}

export interface ForecastPoint {
  hour: number;
  timestamp: string;
  actual: number;
  forecast: number;
  error: number;
}

export interface ForecastEvaluation {
  metric_mae: number;
  metric_rmse: number;
  baseline_mae: number;
  baseline_rmse: number;
  points: ForecastPoint[];
}

export interface TimeStepDispatch {
  hour: number;
  timestamp: string;
  demand_kw: number;
  solar_kw: number;
  wind_kw: number;
  renewables_used_kw: number;
  renewables_curtailed_kw: number;
  battery_charge_kw: number;
  battery_discharge_kw: number;
  battery_soc: number;
  battery_energy_kwh: number;
  grid_import_kw: number;
  grid_export_kw: number;
  unserved_demand_kw: number;
  cost_step: number;
  emissions_step: number;
  cumulative_cost: number;
  cumulative_emissions: number;
  grid_price: number;
  grid_carbon_intensity: number;
  explanation: string;
}

export interface StrategyKPIs {
  total_cost: number;
  total_emissions: number;
  total_demand_kwh: number;
  total_renewable_gen_kwh: number;
  total_renewable_used_kwh: number;
  renewable_utilization_pct: number;
  renewable_curtailment_kwh: number;
  renewable_curtailment_pct: number;
  total_grid_imported_kwh: number;
  total_grid_exported_kwh: number;
  peak_grid_import_kw: number;
  unserved_energy_kwh: number;
  unserved_energy_pct: number;
  battery_throughput_kwh: number;
  equivalent_battery_cycles: number;
}

export interface StrategyResult {
  strategy_name: string;
  kpis: StrategyKPIs;
  steps: TimeStepDispatch[];
}

export interface ComparisonResult {
  scenario_id: string;
  scenario_name: string;
  description: string;
  baseline: StrategyResult;
  optimized: StrategyResult;
  savings_cost_abs: number;
  savings_cost_pct: number;
  emissions_reduction_abs: number;
  emissions_reduction_pct: number;
  peak_shaving_kw: number;
  peak_shaving_pct: number;
  curtailment_reduction_kwh: number;
}

export interface ScenarioSummary {
  id: ScenarioId;
  name: string;
  tagline: string;
  description: string;
  peak_demand_kw: number;
  solar_peak_kw: number;
  wind_peak_kw: number;
  avg_price_per_kwh: number;
  avg_carbon_intensity: number;
}

export interface BenchmarkTableResponse {
  scenarios: ComparisonResult[];
  generated_at: string;
}

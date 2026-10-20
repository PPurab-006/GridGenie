import {
  MicrogridConfig,
  ScenarioSummary,
  ComparisonResult,
  ForecastEvaluation,
  BenchmarkTableResponse,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

export async function fetchHealth(): Promise<{ status: string; system: string }> {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchScenarios(): Promise<ScenarioSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/scenarios`);
  if (!res.ok) throw new Error(`Failed to load scenarios: ${res.statusText}`);
  return res.json();
}

export async function fetchCompare(config: MicrogridConfig): Promise<ComparisonResult> {
  const res = await fetch(`${API_BASE_URL}/api/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Dispatch optimization failed (${res.status}): ${errorBody}`);
  }
  return res.json();
}

export async function fetchForecasts(
  config: MicrogridConfig
): Promise<Record<string, ForecastEvaluation>> {
  const res = await fetch(`${API_BASE_URL}/api/forecasts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Forecasting failed (${res.status}): ${errorBody}`);
  }
  return res.json();
}

export async function fetchBenchmarks(seed: number = 42): Promise<BenchmarkTableResponse> {
  const res = await fetch(`${API_BASE_URL}/api/benchmarks?seed=${seed}`);
  if (!res.ok) throw new Error(`Failed to load benchmarks: ${res.statusText}`);
  return res.json();
}

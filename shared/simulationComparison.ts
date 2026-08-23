export type SimulationChecks = { energySafe: boolean; moistureSafe: boolean; conductivitySafe: boolean };
export type SimulationResultSummary = { outcome: "estable" | "requiere_revision"; checks: SimulationChecks };

export function summarizeSimulationThresholds(result: SimulationResultSummary) {
  const failed = Object.entries(result.checks)
    .filter(([, value]) => !value)
    .map(([key]) => key === "energySafe" ? "energía" : key === "moistureSafe" ? "humedad" : "conductividad");
  return {
    state: result.outcome,
    label: result.outcome === "estable" ? "Dentro de umbrales" : "Requiere revisión",
    detail: failed.length ? `Revisar: ${failed.join(", ")}.` : "Energía, humedad y conductividad dentro de referencia.",
  };
}

import { describe, expect, it } from "vitest";
import { summarizeSimulationThresholds } from "../shared/simulationComparison";

describe("veredictos de comparación de simulaciones", () => {
  it("resume un escenario estable y uno que requiere revisión", () => {
    expect(summarizeSimulationThresholds({ outcome: "estable", checks: { energySafe: true, moistureSafe: true, conductivitySafe: true } })).toMatchObject({ label: "Dentro de umbrales" });
    expect(summarizeSimulationThresholds({ outcome: "requiere_revision", checks: { energySafe: false, moistureSafe: true, conductivitySafe: false } })).toMatchObject({ label: "Requiere revisión", detail: "Revisar: energía, conductividad." });
  });
});

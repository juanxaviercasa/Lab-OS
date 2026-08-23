import { describe, expect, it } from "vitest";
import { getDefaultKitchenScenarios } from "./kitchenSimulation";

describe("escenarios de cocina simulada", () => {
  it("define recetas configurables con ingredientes, etapas y una barrera de seguridad", () => {
    const scenarios = getDefaultKitchenScenarios();
    expect(scenarios).toHaveLength(3);
    expect(scenarios.every((scenario) => JSON.parse(scenario.ingredientsJson).length > 0 && JSON.parse(scenario.stagesJson).length > 0)).toBe(true);
    expect(scenarios.every((scenario) => /bloqueado|No hay|No se envían/.test(scenario.safetyNotes))).toBe(true);
  });
});

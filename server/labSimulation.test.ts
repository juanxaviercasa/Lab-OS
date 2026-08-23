import { describe, expect, it } from "vitest";
import { runSimulationProjection } from "./labSimulation";

describe("proyecciones de LabOS", () => {
  it("genera una proyección de riego sin habilitar ejecución física", () => {
    const simulation = runSimulationProjection({
      scenario: "riego",
      durationHours: 8,
      targetZone: "Bancal Hidropónico A",
      energyThresholdPct: 25,
    });

    expect(simulation.title).toContain("Ventana de riego");
    expect(simulation.result.physicalExecution).toBe("disabled");
    expect(simulation.result.points).toHaveLength(7);
    expect(simulation.result.projected.humedad).toBeGreaterThan(61);
  });

  it("marca para revisión una proyección que no cumple el umbral energético", () => {
    const simulation = runSimulationProjection({
      scenario: "luz",
      durationHours: 72,
      targetZone: "Germinación",
      energyThresholdPct: 70,
    });

    expect(simulation.result.outcome).toBe("requiere_revision");
    expect(simulation.result.checks.energySafe).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { getDefaultCleaningScenarios, verifyCleaningScenario } from "./cleaningSimulation";

describe("escenarios de limpieza simulada", () => {
  it("incluye vajilla, sala, encerado, vehículo y residuos con métricas comprobables", () => {
    const scenarios = getDefaultCleaningScenarios();
    expect(scenarios).toHaveLength(5);
    expect(scenarios.map((scenario) => scenario.taskType)).toEqual(["vajilla", "superficies", "encerado", "vehiculo", "residuos_reciclaje"]);
    scenarios.forEach((scenario) => expect(verifyCleaningScenario(scenario.metrics, scenario.riskLevel)).toMatchObject({ state: "verificado", physicalExecution: "disabled" }));
  });

  it("solicita revisión cuando las métricas sobrepasan el umbral o el riesgo es alto", () => {
    const result = verifyCleaningScenario({ waterLiters: 70, energyKwh: 1.3, wasteKg: 0.2, recyclingKg: 0.1, exposureMinutes: 12 }, "alto");
    expect(result.state).toBe("requiere_revision");
    expect(result.checks.some((check) => !check.passed)).toBe(true);
  });

  it("recalcula el veredicto con umbrales personalizados de agua, energía y reciclaje", () => {
    const result = verifyCleaningScenario({ waterLiters: 14, energyKwh: 0.55, wasteKg: 0.08, recyclingKg: 0.18, exposureMinutes: 18 }, "medio", { maxWaterLiters: 10, maxEnergyKwh: 0.4, minRecyclingKg: 0.3 });
    expect(result.state).toBe("requiere_revision");
    expect(result.checks.find((check) => check.label === "Meta de reciclaje")?.passed).toBe(false);
    expect(result.checks.find((check) => check.label === "Uso de recursos")?.passed).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { compareCleaningMetrics } from "@shared/cleaningComparison";

describe("comparación de escenarios de limpieza", () => {
  it("identifica diferencias de recursos y conserva el límite de ejecución física", () => {
    const comparison = compareCleaningMetrics(
      { waterLiters: 48, energyKwh: 0.35, wasteKg: 0.16, recyclingKg: 0.08, exposureMinutes: 35 },
      { waterLiters: 14, energyKwh: 0.55, wasteKg: 0.08, recyclingKg: 0.18, exposureMinutes: 18 },
    );
    expect(comparison.physicalExecution).toBe("disabled");
    expect(comparison.rows.find((row) => row.key === "waterLiters")).toMatchObject({ delta: -34, better: "derecha" });
    expect(comparison.preferred).toBe("derecha");
  });
});

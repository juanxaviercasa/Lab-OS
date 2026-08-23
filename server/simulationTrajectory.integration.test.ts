import { describe, expect, it } from "vitest";
import { buildSimulationTrajectory } from "../shared/simulationTrajectory";

describe("trayectoria consumible por la interfaz", () => {
  it("deriva una serie de dos registros de simulación serializados", () => {
    const runs = [
      { resultsJson: JSON.stringify({ projected: { humedad: 58, energia: 70, conductividad: 1.8 } }) },
      { resultsJson: JSON.stringify({ projected: { humedad: 66, energia: 64, conductividad: 2.0 } }) },
    ];
    const trajectory = buildSimulationTrajectory(JSON.parse(runs[0].resultsJson), JSON.parse(runs[1].resultsJson), "humedad");
    expect(trajectory.map((point) => point.step)).toEqual(["Inicio", "H+2", "H+4", "H+6", "H+8", "H+10", "H+12"]);
    expect(trajectory.at(-1)).toMatchObject({ escenarioA: 58, escenarioB: 66 });
  });
});

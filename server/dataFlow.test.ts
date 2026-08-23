import { describe, expect, it } from "vitest";
import { dataFlowNodes, resolveDataFlowNode } from "../shared/dataFlow";

describe("flujo de datos de LabOS", () => {
  it("mantiene una ruta trazable de telemetría hacia auditoría", () => {
    expect(dataFlowNodes.map((node) => node.id)).toEqual(["origen", "validacion", "gemelo", "simulacion", "auditoria"]);
    expect(resolveDataFlowNode("simulacion")).toMatchObject({ title: "Simulación", kind: "simulacion" });
    expect(resolveDataFlowNode("desconocido")).toEqual(dataFlowNodes[0]);
  });
});

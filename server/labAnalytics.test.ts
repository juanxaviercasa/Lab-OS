import { describe, expect, it } from "vitest";
import { selectTelemetryMetric, selectTelemetryWindow } from "./labAnalytics";

describe("ventanas históricas de telemetría", () => {
  const now = new Date("2026-08-23T18:00:00.000Z");
  const rows = [
    { recordedAt: new Date("2026-08-23T17:00:00.000Z"), id: "reciente" },
    { recordedAt: new Date("2026-08-22T17:00:00.000Z"), id: "24h" },
    { recordedAt: new Date("2026-08-19T17:00:00.000Z"), id: "72h" },
    { recordedAt: new Date("2026-08-15T17:00:00.000Z"), id: "fuera" },
  ];

  it("selecciona solo los puntos comprendidos en el periodo solicitado", () => {
    expect(selectTelemetryWindow(rows, 24, now).map((row) => row.id)).toEqual(["reciente"]);
    expect(selectTelemetryWindow(rows, 72, now).map((row) => row.id)).toEqual(["reciente", "24h"]);
    expect(selectTelemetryWindow(rows, 168, now).map((row) => row.id)).toEqual(["reciente", "24h", "72h"]);
  });

  it("filtra métricas explícitas y conserva todas cuando no se solicita filtro", () => {
    const metrics = [{ metric: "Humedad", id: 1 }, { metric: "Temperatura", id: 2 }, { metric: "Humedad", id: 3 }];
    expect(selectTelemetryMetric(metrics, "Humedad").map((row) => row.id)).toEqual([1, 3]);
    expect(selectTelemetryMetric(metrics).map((row) => row.id)).toEqual([1, 2, 3]);
  });
});

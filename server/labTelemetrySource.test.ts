import { describe, expect, it } from "vitest";
import { normalizeTelemetryPayload, validatePublicTelemetryUrl } from "./labTelemetrySource";

describe("adaptador de telemetría de solo lectura", () => {
  it("acepta un endpoint HTTPS público y bloquea destinos locales o no cifrados", () => {
    expect(validatePublicTelemetryUrl("https://telemetry.example.org/readings")).toBe("https://telemetry.example.org/readings");
    expect(() => validatePublicTelemetryUrl("http://telemetry.example.org/readings")).toThrow("HTTPS");
    expect(() => validatePublicTelemetryUrl("https://127.0.0.1/readings")).toThrow("locales o privadas");
  });

  it("normaliza únicamente lecturas JSON válidas", () => {
    const readings = normalizeTelemetryPayload({ readings: [
      { metric: "Humedad del sustrato", value: 61.2, unit: "%" },
      { metric: "Temperatura ambiente", value: "23.4", unit: "°C", status: "atencion" },
      { metric: "Inválida", value: "sin valor", unit: "%" },
    ] });
    expect(readings).toEqual([
      { metric: "Humedad del sustrato", value: 61.2, unit: "%", status: "normal" },
      { metric: "Temperatura ambiente", value: 23.4, unit: "°C", status: "atencion" },
    ]);
    expect(() => normalizeTelemetryPayload({ readings: [{ metric: "Sin unidad", value: 1 }] })).toThrow("readings");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { __setDbForTesting, createTelemetrySource, previewTelemetrySource } from "./db";

const lab = { id: 8, ownerId: 42, name: "Lab", location: "X", mode: "simulation", safetyState: "nominal", energyReservePct: "72", energyThresholdPct: "25", integrationNotice: null, createdAt: new Date(), updatedAt: new Date() };
const source = { id: 5, labId: 8, name: "Fuente", kind: "http_json", endpointUrl: "https://telemetry.example.org/readings", authMode: "none", credentialReference: null, status: "preparada", schemaJson: "{}", lastCheckedAt: null, createdAt: new Date(), updatedAt: new Date() };
const sensor = { id: 13, labId: 8, zoneId: 1, name: "Sensor", type: "sensor", adapter: "sim", connectivity: "simulado", riskLevel: "bajo", enabled: false, capabilitiesJson: "[]", createdAt: new Date(), updatedAt: new Date() };

function createFakeDb(options: { authMode?: "none" | "bearer_placeholder"; httpStatus?: number } = {}) {
  const inserts: Array<{ table: unknown; values: unknown }> = [];
  const updates: Array<{ table: unknown; values: unknown }> = [];
  const db = {
    select: () => ({ from: (table: any) => ({ where: () => ({ limit: () => {
      if (table?.[Symbol.for("drizzle:Name")] === "labs") return Promise.resolve([lab]);
      if (table?.[Symbol.for("drizzle:Name")] === "telemetrySources") return Promise.resolve([{ ...source, authMode: options.authMode ?? "none" }]);
      if (table?.[Symbol.for("drizzle:Name")] === "devices") return Promise.resolve([sensor]);
      return Promise.resolve([]);
    } }) }) }),
    insert: (table: unknown) => ({ values: (values: unknown) => { inserts.push({ table, values }); return Promise.resolve(); } }),
    update: (table: unknown) => ({ set: (values: unknown) => ({ where: () => { updates.push({ table, values }); return Promise.resolve(); } }) }),
  };
  return { db, inserts, updates };
}

describe("persistencia del adaptador de telemetría", () => {
  const originalFetch = global.fetch;
  afterEach(() => { __setDbForTesting(null); global.fetch = originalFetch; vi.restoreAllMocks(); });

  it("guarda una fuente pública como solo lectura y registra auditoría", async () => {
    const fake = createFakeDb(); __setDbForTesting(fake.db);
    await createTelemetrySource(42, { name: "Fuente externa", endpointUrl: "https://telemetry.example.org/readings", authMode: "none" });
    expect(fake.inserts).toHaveLength(3);
    expect(fake.inserts[0]?.values).toMatchObject({ labId: 8, name: "Fuente externa", status: "preparada", authMode: "none" });
    expect(fake.inserts[1]?.values).toMatchObject({ eventType: "telemetry.source_created", metadataJson: expect.stringContaining("physicalExecution") });
    expect(fake.inserts[2]?.values).toMatchObject({ kind: "sistema", title: "Fuente de telemetría preparada", unread: true });
    await expect(createTelemetrySource(42, { name: "Insegura", endpointUrl: "http://telemetry.example.org/readings", authMode: "none" })).rejects.toThrow("HTTPS");
  });

  it("importa lecturas válidas, actualiza el estado y no permite fuentes con credencial pendiente", async () => {
    const fake = createFakeDb(); __setDbForTesting(fake.db);
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ readings: [{ metric: "Humedad", value: 61, unit: "%" }] }) }) as typeof fetch;
    const readings = await previewTelemetrySource(42, 5);
    expect(readings).toHaveLength(1);
    expect(fake.inserts.some((entry) => Array.isArray(entry.values))).toBe(true);
    expect(fake.updates[0]?.values).toMatchObject({ status: "conectada" });

    const guarded = createFakeDb({ authMode: "bearer_placeholder" }); __setDbForTesting(guarded.db);
    await expect(previewTelemetrySource(42, 5)).rejects.toThrow("credencial segura");
  });
});

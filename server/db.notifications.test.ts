import { afterEach, describe, expect, it } from "vitest";
import { __setDbForTesting, getLabDashboard, markNotificationsRead, registerBlockedPhysicalAttempt, resolveOperationPlan } from "./db";

const lab = { id: 8, ownerId: 42, name: "Lab", location: "X", mode: "simulation", safetyState: "nominal", energyReservePct: "72", energyThresholdPct: "25", integrationNotice: null, createdAt: new Date(), updatedAt: new Date() };
const device = { id: 13, labId: 8, zoneId: 1, name: "Sensor", type: "sensor", adapter: "sim", connectivity: "simulado", riskLevel: "bajo", enabled: false, capabilitiesJson: "[]", createdAt: new Date(), updatedAt: new Date() };
const plan = { id: 7, labId: 8, title: "Plan de riego", objective: "Simular", mode: "simulacion", riskLevel: "medio", status: "pendiente_aprobacion", preconditionsJson: "[]", safeguardsJson: "[]", approvalRequired: true, approvedBy: null, approvedAt: null, decidedBy: null, decidedAt: null, decisionNote: null, createdAt: new Date(), updatedAt: new Date() };

function tableName(table: any) { return table?.[Symbol.for("drizzle:Name")]; }

function createDb(rows: Record<string, any[]>) {
  const inserts: unknown[] = []; const updates: unknown[] = [];
  const db = {
    select: () => ({ from: (table: any) => {
      const result = rows[tableName(table)] ?? [];
      const ordered = { limit: () => Promise.resolve(result), then: (resolve: (value: any[]) => unknown) => Promise.resolve(result).then(resolve) };
      const filtered = { limit: () => Promise.resolve(result), orderBy: () => ordered, then: (resolve: (value: any[]) => unknown) => Promise.resolve(result).then(resolve) };
      return { where: () => filtered, orderBy: () => ordered };
    } }),
    insert: () => ({ values: (value: unknown) => { inserts.push(value); return Promise.resolve(); } }),
    update: () => ({ set: (value: unknown) => ({ where: () => { updates.push(value); return Promise.resolve(); } }) }),
  };
  return { db, inserts, updates };
}

describe("persistencia de notificaciones y entrega de panel", () => {
  afterEach(() => __setDbForTesting(null));

  it("registra notificaciones para bloqueos, decisiones y marcado como leído", async () => {
    const fake = createDb({ labs: [lab], operationPlans: [plan], labNotifications: [{ id: 3, labId: 8, unread: true }, { id: 4, labId: 8, unread: true }] });
    __setDbForTesting(fake.db);
    await registerBlockedPhysicalAttempt(42, "Abrir válvula física");
    await resolveOperationPlan(42, 7, "rechazar", "Falta evidencia de umbrales.");
    const result = await markNotificationsRead(42, [3, 4]);
    expect(fake.inserts.some((value: any) => value?.title === "Acción física bloqueada")).toBe(true);
    expect(fake.inserts.some((value: any) => value?.title === "Plan rechazado")).toBe(true);
    expect(result).toEqual({ updated: 2 });
    expect(fake.updates).toHaveLength(3);
  });

  it("entrega módulos educativos y notificaciones persistidas en el dashboard", async () => {
    const telemetry = Array.from({ length: 28 }, (_, id) => ({ id, deviceId: 13, metric: "Humedad", unit: "%", value: "61", status: "normal", recordedAt: new Date() }));
    const modules = [{ id: 1, labId: 8, name: "Diálogo", capability: "Tutoría", mode: "dialogo", readiness: "prototipo", safetyBoundary: "Sin control físico.", progressPct: 62 }];
    const notifications = [{ id: 2, labId: 8, kind: "telemetria", severity: "info", title: "Lectura nueva", detail: "Humedad disponible", unread: true, createdAt: new Date() }];
    const fake = createDb({ labs: [lab], devices: [device], sensorReadings: telemetry, telemetrySources: [{ id: 1, labId: 8 }], innovationInitiatives: [{ id: 1, labId: 8 }], robotLearningModules: modules, labNotifications: notifications, zones: [], labTasks: [], inventoryItems: [], experiments: [], operationPlans: [], auditLogs: [], integrationAdapters: [], simulationRuns: [] });
    __setDbForTesting(fake.db);
    const dashboard = await getLabDashboard(42);
    expect(dashboard.robotLearningModules).toEqual(modules);
    expect(dashboard.notifications).toEqual(notifications);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { __setDbForTesting, createClinicalApprovalRecord, evaluateCleaningScenario, getLabDashboard } from "./db";

const lab = { id: 8, ownerId: 42, name: "Lab", location: "X", mode: "simulation", safetyState: "nominal", energyReservePct: "72", energyThresholdPct: "25", integrationNotice: null, createdAt: new Date(), updatedAt: new Date() };
const template = { id: 21, labId: 8, name: "Plantilla", scope: "movilidad", version: "1.0", status: "lista", requiredRolesJson: "[]", checklistJson: "[]", consentStatement: "Consentimiento", safetyBoundary: "Solo simulación", active: true, createdAt: new Date(), updatedAt: new Date() };
const scenario = { id: 31, labId: 8, name: "Vajilla", area: "cocina", taskType: "vajilla", riskLevel: "medio", metricsJson: JSON.stringify({ waterLiters: 14, energyKwh: 0.55, wasteKg: 0.08, recyclingKg: 0.18, exposureMinutes: 18 }), safeguardsJson: "[]", verificationJson: null, status: "borrador", createdAt: new Date(), updatedAt: new Date() };
const check = { id: 11, labId: 8, sourceId: 5, outcome: "success", httpStatus: 200, readingCount: 2, summary: "Lecturas válidas", checkedAt: new Date() };
const record = { id: 22, labId: 8, templateId: 21, scenarioTitle: "Escenario", reviewerRole: "Profesional", reviewerName: "Revisor", evidenceJson: "[]", consentConfirmed: true, decision: "aprobada_simulacion", decisionNote: "Nota de decisión suficientemente explicativa.", decidedBy: 42, decidedAt: new Date(), createdAt: new Date() };

function tableName(table: any) { return table?.[Symbol.for("drizzle:Name")]; }

function createFakeDb() {
  const inserts: Array<{ table: unknown; values: unknown }> = [];
  const updates: Array<{ table: unknown; values: unknown }> = [];
  const rows: Record<string, any[]> = {
    labs: [lab], telemetrySources: [{ id: 5, labId: 8 }], innovationInitiatives: [{ slug: "cerebro-robotico" }, { slug: "cultivo-autonomo" }, { slug: "cocina-automatizada" }, { slug: "tecnologia-asistiva" }, { slug: "automata-limpieza" }], robotLearningModules: [{ id: 1 }], labNotifications: [{ id: 1 }], learningProfiles: [{ id: 1 }], kitchenScenarios: [{ id: 1 }], kitchenStations: [{ id: 1 }], voiceProviderConfigs: [{ id: 1 }], clinicalApprovalTemplates: [template], clinicalApprovalRecords: [record], cleaningScenarios: [scenario], telemetrySourceChecks: [check], devices: [], zones: [], sensorReadings: [], labTasks: [], inventoryItems: [], experiments: [], operationPlans: [], auditLogs: [], integrationAdapters: [], simulationRuns: [], voicePracticeSessions: [],
  };
  const query = (table: unknown) => {
    const result = rows[tableName(table)] ?? [];
    const executable = Object.assign(Promise.resolve(result), { limit: () => Promise.resolve(result) }) as any;
    executable.orderBy = () => executable;
    return { where: () => executable, orderBy: () => executable };
  };
  return {
    inserts, updates,
    db: {
      select: () => ({ from: query }),
      insert: (table: unknown) => ({ values: (values: unknown) => { inserts.push({ table, values }); return Promise.resolve([{ insertId: 1 }]); } }),
      update: (table: unknown) => ({ set: (values: unknown) => { updates.push({ table, values }); return { where: () => Promise.resolve() }; } }),
    },
  };
}

afterEach(() => __setDbForTesting(null));

describe("persistencia de expansión segura", () => {
  it("registra una aprobación clínica solo para simulación y verifica un escenario de limpieza", async () => {
    const fake = createFakeDb(); __setDbForTesting(fake.db);
    const approval = await createClinicalApprovalRecord(42, { templateId: 21, scenarioTitle: "Movilidad guiada", reviewerRole: "Profesional clínico", reviewerName: "Revisor", evidence: ["Contexto", "Riesgos"], consentConfirmed: true, decision: "aprobar", decisionNote: "La evidencia y los límites de simulación fueron revisados." });
    expect(approval).toMatchObject({ decision: "aprobada_simulacion", review: { physicalExecution: "disabled" } });
    expect(fake.inserts.some((entry) => tableName(entry.table) === "clinicalApprovalRecords")).toBe(true);
    const verification = await evaluateCleaningScenario(42, 31);
    expect(verification).toMatchObject({ state: "verificado", physicalExecution: "disabled" });
    expect(fake.updates[0]?.values).toMatchObject({ status: "evaluado" });
  });

  it("entrega al panel las comprobaciones HTTPS, plantillas, registros y escenarios persistentes", async () => {
    const fake = createFakeDb(); __setDbForTesting(fake.db);
    const dashboard = await getLabDashboard(42);
    expect(dashboard.telemetrySourceChecks).toEqual([check]);
    expect(dashboard.clinicalApprovalTemplates).toEqual([template]);
    expect(dashboard.clinicalApprovalRecords).toEqual([record]);
    expect(dashboard.cleaningScenarios).toEqual([scenario]);
  });
});

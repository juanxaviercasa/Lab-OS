import { asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  devices,
  experiments,
  integrationAdapters,
  innovationInitiatives,
  inventoryItems,
  kitchenScenarios,
  kitchenStations,
  labNotifications,
  learningProfiles,
  labs,
  labTasks,
  operationPlans,
  robotLearningModules,
  sensorReadings,
  simulationRuns,
  telemetrySources,
  type InsertUser,
  users,
  voicePracticeSessions,
  voiceProviderConfigs,
  zones,
} from "../drizzle/schema";
import { buildBlockedPhysicalAttemptAudit, buildPlanDecisionPersistence, physicalExecutionStatus } from "./labSafety";
import { runSimulationProjection, type SimulationScenario } from "./labSimulation";
import { selectTelemetryMetric, selectTelemetryWindow } from "./labAnalytics";
import { normalizeTelemetryPayload, validatePublicTelemetryUrl } from "./labTelemetrySource";
import { getDefaultInitiatives } from "./labPortfolio";
import { blockedPhysicalNotification, planDecisionNotification } from "./labNotifications";
import { getDefaultRobotLearningModules } from "./robotLearning";
import { getDefaultKitchenScenarios } from "./kitchenSimulation";
import { storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";

let _db: ReturnType<typeof drizzle> | null = null;

/** Solo para pruebas unitarias de persistencia; no se expone al cliente. */
export function __setDbForTesting(instance: unknown | null) {
  _db = instance as ReturnType<typeof drizzle> | null;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  await db
    .insert(users)
    .values({
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? "user",
      lastSignedIn: user.lastSignedIn ?? new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        lastSignedIn: user.lastSignedIn ?? new Date(),
      },
    });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

type InsertResult = [{ insertId: number }];

async function appendAudit(
  labId: number,
  actorId: number | null,
  eventType: string,
  message: string,
  severity: "info" | "atencion" | "critico" = "info",
  metadata?: Record<string, unknown>,
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({
    labId,
    actorId: actorId ?? null,
    eventType,
    severity,
    message,
    metadataJson: metadata ? JSON.stringify(metadata) : null,
  });
}

async function createLabNotification(labId: number, kind: "telemetria" | "simulacion" | "seguridad" | "sistema", severity: "info" | "atencion" | "critico", title: string, detail: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(labNotifications).values({ labId, kind, severity, title, detail, unread: true });
}

async function ensureHistoricalTelemetry(labId: number, deviceIds: number[]) {
  const db = await getDb();
  if (!db || deviceIds.length === 0) return;
  const existing = await db.select().from(sensorReadings).where(inArray(sensorReadings.deviceId, deviceIds));
  if (existing.length >= 28) return;

  const deviceId = deviceIds[0];
  const now = Date.now();
  const definitions = [
    { metric: "Humedad del sustrato", unit: "%", values: [55, 57, 59, 58, 60, 63, 62, 61], low: "45.000", high: "75.000" },
    { metric: "Temperatura ambiente", unit: "°C", values: [21.6, 22.1, 22.7, 23.1, 23.8, 24.2, 23.7, 23.4], low: "18.000", high: "28.000" },
    { metric: "Conductividad del depósito", unit: "mS/cm", values: [1.62, 1.68, 1.71, 1.77, 1.82, 1.88, 1.86, 1.84], low: "1.200", high: "2.200" },
    { metric: "Reserva energética", unit: "%", values: [78, 77, 75, 74, 73, 72, 71, 72], low: "25.000", high: "100.000" },
  ];
  const rows = definitions.flatMap((definition) => definition.values.map((value, index) => ({
    deviceId,
    metric: definition.metric,
    unit: definition.unit,
    value: value.toFixed(3),
    thresholdLow: definition.low,
    thresholdHigh: definition.high,
    status: definition.metric === "Conductividad del depósito" && index === definition.values.length - 1 ? "atencion" as const : "normal" as const,
    source: "simulacion" as const,
    recordedAt: new Date(now - (definition.values.length - index) * 3 * 60 * 60 * 1000),
  })));
  await db.insert(sensorReadings).values(rows);
  await appendAudit(labId, null, "telemetry.history_seeded", "Se inicializaron series históricas simuladas para el panel analítico.", "info", { samples: rows.length });
}

async function ensureLabCatalog(labId: number, ownerId?: number) {
  const db = await getDb();
  if (!db) return;
  const [sources, initiatives, learningModules, notifications, profiles, kitchenRows, stationRows, voiceProviderRows] = await Promise.all([
    db.select().from(telemetrySources).where(eq(telemetrySources.labId, labId)).limit(1),
    db.select().from(innovationInitiatives).where(eq(innovationInitiatives.labId, labId)),
    db.select().from(robotLearningModules).where(eq(robotLearningModules.labId, labId)).limit(1),
    db.select().from(labNotifications).where(eq(labNotifications.labId, labId)).limit(1),
    db.select().from(learningProfiles).where(eq(learningProfiles.labId, labId)).limit(1),
    db.select().from(kitchenScenarios).where(eq(kitchenScenarios.labId, labId)).limit(1),
    db.select().from(kitchenStations).where(eq(kitchenStations.labId, labId)).limit(1),
    db.select().from(voiceProviderConfigs).where(eq(voiceProviderConfigs.labId, labId)).limit(1),
  ]);
  if (!sources.length) {
    await db.insert(telemetrySources).values({ labId, name: "Fuente HTTP de telemetría · Placeholder", kind: "http_json", endpointUrl: "https://telemetry.example.invalid/readings", authMode: "none", credentialReference: null, status: "preparada", schemaJson: JSON.stringify({ expected: "{ readings: [{ metric, value, unit, status? }] }", mode: "solo_lectura", commands: "disabled" }) });
  }
  const existingInitiativeSlugs = new Set(initiatives.map((initiative) => initiative.slug));
  const missingInitiatives = getDefaultInitiatives().filter((initiative) => !existingInitiativeSlugs.has(initiative.slug));
  if (missingInitiatives.length) await db.insert(innovationInitiatives).values(missingInitiatives.map((initiative) => ({ labId, ...initiative })));
  if (!learningModules.length) {
    await db.insert(robotLearningModules).values(getDefaultRobotLearningModules().map((module) => ({ labId, ...module })));
  }
  if (!notifications.length) await createLabNotification(labId, "sistema", "info", "Centro de notificaciones listo", "LabOS avisará sobre lecturas nuevas, resultados de simulación y eventos de seguridad.");
  if (!profiles.length && ownerId) await db.insert(learningProfiles).values({ labId, ownerId, displayName: "Perfil de aprendizaje · Placeholder", preferredLanguage: "es", targetLanguage: "en", proficiency: "inicial", learningGoal: "Definir objetivo de práctica e idioma meta.", pace: "constante", privacyAcknowledged: false, active: true });
  if (!kitchenRows.length) await db.insert(kitchenScenarios).values(getDefaultKitchenScenarios().map((scenario) => ({ labId, ...scenario })));
  if (!stationRows.length) await db.insert(kitchenStations).values([
    { labId, name: "Despensa", type: "despensa", status: "modelada", description: "Inventario digital de ingredientes y alérgenos.", safetyMode: "sin_dispensado", active: true },
    { labId, name: "Preparación", type: "preparacion", status: "aislada", description: "Orden de mise en place y porciones en el gemelo digital.", safetyMode: "sin_corte", active: true },
    { labId, name: "Cocción", type: "coccion", status: "bloqueada", description: "Proyección térmica sin conexión a calor, gas o inducción.", safetyMode: "sin_calor", active: true },
    { labId, name: "Seguridad", type: "seguridad", status: "activa", description: "Verificación de dieta, alergias y límites de simulación.", safetyMode: "revision_humana", active: true },
  ]);
  if (!voiceProviderRows.length) await db.insert(voiceProviderConfigs).values({ labId, provider: "Transcripción integrada · Placeholder", endpointPlaceholder: "BUILT_IN_FORGE_API_URL", credentialPlaceholder: "BUILT_IN_FORGE_API_KEY", maxAudioMb: 16, enabled: true });
}

export async function ensureLabForUser(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");

  const existing = await db.select().from(labs).where(eq(labs.ownerId, ownerId)).limit(1);
  if (existing[0]) return existing[0];

  const result = (await db.insert(labs).values({
    ownerId,
    name: "Laboratorio Aurora · Placeholder",
    location: "Ubicación por definir",
    mode: "simulation",
    safetyState: "attention",
    energyReservePct: "72.00",
    energyThresholdPct: "25.00",
    integrationNotice:
      "Fase actual: gemelo digital. ROS 2, cámaras, sensores y controladores permanecen desconectados y requieren adaptadores con permisos.",
  })) as unknown as InsertResult;
  const labId = Number(result[0].insertId);

  const zoneResult = (await db.insert(zones).values([
    {
      labId,
      name: "Bancal Hidropónico A",
      code: "CULT-A",
      type: "cultivo",
      status: "normal",
      description: "Zona simulada de hojas verdes con sensores ambientales.",
    },
    {
      labId,
      name: "Germinación",
      code: "GERM-1",
      type: "germinacion",
      status: "atencion",
      description: "Zona simulada de humedad y luz controlada.",
    },
    {
      labId,
      name: "Reserva energética",
      code: "ENER-1",
      type: "energia",
      status: "normal",
      description: "Panel y batería representados solamente en simulación.",
    },
  ])) as unknown as InsertResult;
  const firstZoneId = Number(zoneResult[0].insertId);

  const deviceResult = (await db.insert(devices).values([
    {
      labId,
      zoneId: firstZoneId,
      name: "Sonda de humedad del sustrato",
      type: "sensor",
      adapter: "simulador.local",
      connectivity: "simulado",
      riskLevel: "bajo",
      enabled: false,
      capabilitiesJson: JSON.stringify(["lectura_humedad", "sin_control_fisico"]),
    },
    {
      labId,
      zoneId: firstZoneId,
      name: "Válvula de riego · Simulada",
      type: "actuador",
      adapter: "simulador.local",
      connectivity: "simulado",
      riskLevel: "medio",
      enabled: false,
      capabilitiesJson: JSON.stringify(["estado_simulado", "requiere_aprobacion", "sin_control_fisico"]),
    },
    {
      labId,
      zoneId: null,
      name: "Cámara de canopia · Placeholder",
      type: "camara",
      adapter: "camera.adapter.placeholder",
      connectivity: "preparado",
      riskLevel: "bajo",
      enabled: false,
      capabilitiesJson: JSON.stringify(["placeholder_endpoint", "lectura_futura"]),
    },
  ])) as unknown as InsertResult;
  const humidityDeviceId = Number(deviceResult[0].insertId);

  await db.insert(sensorReadings).values([
    {
      deviceId: humidityDeviceId,
      metric: "Humedad del sustrato",
      unit: "%",
      value: "61.000",
      thresholdLow: "45.000",
      thresholdHigh: "75.000",
      status: "normal",
      source: "simulacion",
    },
    {
      deviceId: humidityDeviceId,
      metric: "Temperatura ambiente",
      unit: "°C",
      value: "23.400",
      thresholdLow: "18.000",
      thresholdHigh: "28.000",
      status: "normal",
      source: "simulacion",
    },
    {
      deviceId: humidityDeviceId,
      metric: "Conductividad del depósito",
      unit: "mS/cm",
      value: "1.840",
      thresholdLow: "1.200",
      thresholdHigh: "2.200",
      status: "atencion",
      source: "simulacion",
    },
  ]);

  await db.insert(inventoryItems).values([
    { labId, name: "Semillas de lechuga", category: "Cultivo", quantity: "24.00", unit: "sobres", reorderPoint: "5.00", location: "Gaveta A" },
    { labId, name: "Solución nutritiva A", category: "Nutrientes", quantity: "1.20", unit: "L", reorderPoint: "1.00", location: "Estante húmedo" },
    { labId, name: "Fusible de repuesto", category: "Seguridad", quantity: "2.00", unit: "unidades", reorderPoint: "2.00", location: "Gabinete eléctrico" },
  ]);

  await db.insert(labTasks).values([
    { labId, title: "Definir ubicación real del laboratorio", description: "Completa el placeholder de ubicación antes de conectar adaptadores.", priority: "alta", status: "pendiente" },
    { labId, title: "Validar umbrales de conductividad", description: "Revisar con datos y especie de cultivo reales.", priority: "media", status: "pendiente" },
    { labId, title: "Revisar el protocolo de parada", description: "Confirmar que toda futura integración conserva la parada independiente.", priority: "alta", status: "en_progreso" },
  ]);

  await db.insert(experiments).values({
    labId,
    title: "Curva de humedad · Simulación inicial",
    hypothesis: "Una ventana de humedad de 45–75 % mantendrá la estabilidad del sustrato en el modelo inicial.",
    status: "borrador",
    variablesJson: JSON.stringify(["humedad", "temperatura", "horas_de_luz"]),
    notes: "Placeholder: sustituir por la especie, sustrato y objetivo reales.",
  });

  await db.insert(operationPlans).values({
    labId,
    title: "Plan de riego de prueba",
    objective: "Simular la evaluación de una ventana de riego para el Bancal Hidropónico A.",
    mode: "simulacion",
    riskLevel: "medio",
    status: "pendiente_aprobacion",
    preconditionsJson: JSON.stringify([
      "La lectura simulada de humedad está disponible.",
      "La reserva energética simulada supera el umbral.",
      "El modo de LabOS permanece en simulación.",
    ]),
    safeguardsJson: JSON.stringify([
      "Sin control físico directo.",
      "No se transmite ninguna orden a controladores.",
      "Aprobación humana requerida antes de marcar el plan como aprobado.",
    ]),
    approvalRequired: true,
  });

  await db.insert(integrationAdapters).values([
    { labId, name: "Puente ROS 2", kind: "ros2", endpointPlaceholder: "ROS2_BRIDGE_URL", credentialPlaceholder: "ROS2_BRIDGE_TOKEN", permissionsJson: JSON.stringify(["lectura_estado", "sin_comandos"]), status: "bloqueado" },
    { labId, name: "Gateway de sensores", kind: "sensor", endpointPlaceholder: "SENSOR_GATEWAY_URL", credentialPlaceholder: "SENSOR_GATEWAY_TOKEN", permissionsJson: JSON.stringify(["lectura_telemetria", "sin_escritura"]), status: "bloqueado" },
    { labId, name: "Adaptador de cámara", kind: "camara", endpointPlaceholder: "CAMERA_STREAM_URL", credentialPlaceholder: "CAMERA_API_KEY", permissionsJson: JSON.stringify(["lectura_imagen", "sin_actuacion"]), status: "bloqueado" },
  ]);

  await appendAudit(labId, ownerId, "lab.bootstrap", "Se creó el laboratorio simulado y sus placeholders de configuración.");
  const created = await db.select().from(labs).where(eq(labs.id, labId)).limit(1);
  return created[0];
}

export async function getLabDashboard(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  await ensureLabCatalog(lab.id, ownerId);
  const deviceRows = await db.select().from(devices).where(eq(devices.labId, lab.id));
  const sensorDeviceIds = deviceRows.filter((item) => item.type === "sensor").map((item) => item.id);
  await ensureHistoricalTelemetry(lab.id, sensorDeviceIds);
  const deviceIds = deviceRows.map((item) => item.id);
  const [zoneRows, readingRows, taskRows, inventoryRows, experimentRows, planRows, auditRows, adapterRows, simulationRows, sourceRows, initiativeRows, moduleRows, notificationRows, profileRows, voiceRows, kitchenScenarioRows, kitchenStationRows, voiceProviderConfigRows] = await Promise.all([
    db.select().from(zones).where(eq(zones.labId, lab.id)),
    deviceIds.length ? db.select().from(sensorReadings).where(inArray(sensorReadings.deviceId, deviceIds)).orderBy(desc(sensorReadings.recordedAt)).limit(16) : Promise.resolve([]),
    db.select().from(labTasks).where(eq(labTasks.labId, lab.id)).orderBy(desc(labTasks.updatedAt)),
    db.select().from(inventoryItems).where(eq(inventoryItems.labId, lab.id)).orderBy(desc(inventoryItems.updatedAt)),
    db.select().from(experiments).where(eq(experiments.labId, lab.id)).orderBy(desc(experiments.updatedAt)),
    db.select().from(operationPlans).where(eq(operationPlans.labId, lab.id)).orderBy(desc(operationPlans.updatedAt)),
    db.select().from(auditLogs).where(eq(auditLogs.labId, lab.id)).orderBy(desc(auditLogs.createdAt)).limit(20),
    db.select().from(integrationAdapters).where(eq(integrationAdapters.labId, lab.id)),
    db.select().from(simulationRuns).where(eq(simulationRuns.labId, lab.id)).orderBy(desc(simulationRuns.createdAt)).limit(12),
    db.select().from(telemetrySources).where(eq(telemetrySources.labId, lab.id)).orderBy(desc(telemetrySources.updatedAt)),
    db.select().from(innovationInitiatives).where(eq(innovationInitiatives.labId, lab.id)).orderBy(desc(innovationInitiatives.updatedAt)),
    db.select().from(robotLearningModules).where(eq(robotLearningModules.labId, lab.id)).orderBy(desc(robotLearningModules.progressPct)),
    db.select().from(labNotifications).where(eq(labNotifications.labId, lab.id)).orderBy(desc(labNotifications.createdAt)).limit(24),
    db.select().from(learningProfiles).where(eq(learningProfiles.labId, lab.id)).orderBy(desc(learningProfiles.updatedAt)),
    db.select().from(voicePracticeSessions).where(eq(voicePracticeSessions.labId, lab.id)).orderBy(desc(voicePracticeSessions.createdAt)).limit(12),
    db.select().from(kitchenScenarios).where(eq(kitchenScenarios.labId, lab.id)).orderBy(desc(kitchenScenarios.updatedAt)),
    db.select().from(kitchenStations).where(eq(kitchenStations.labId, lab.id)).orderBy(desc(kitchenStations.updatedAt)),
    db.select().from(voiceProviderConfigs).where(eq(voiceProviderConfigs.labId, lab.id)).orderBy(desc(voiceProviderConfigs.updatedAt)),
  ]);

  return { lab, zones: zoneRows, devices: deviceRows, readings: readingRows, tasks: taskRows, inventory: inventoryRows, experiments: experimentRows, plans: planRows, audit: auditRows, adapters: adapterRows, simulations: simulationRows, telemetrySources: sourceRows, initiatives: initiativeRows, robotLearningModules: moduleRows, notifications: notificationRows, learningProfiles: profileRows, voiceSessions: voiceRows, kitchenScenarios: kitchenScenarioRows, kitchenStations: kitchenStationRows, voiceProviderConfigs: voiceProviderConfigRows };
}

export async function getTelemetryHistory(ownerId: number, metric?: string, periodHours = 24) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  const deviceRows = await db.select().from(devices).where(eq(devices.labId, lab.id));
  const deviceIds = deviceRows.map((item) => item.id);
  await ensureHistoricalTelemetry(lab.id, deviceRows.filter((item) => item.type === "sensor").map((item) => item.id));
  if (!deviceIds.length) return [];
  const rows = await db.select().from(sensorReadings).where(inArray(sensorReadings.deviceId, deviceIds)).orderBy(asc(sensorReadings.recordedAt));
  const selectedMetric = selectTelemetryMetric(rows, metric);
  return selectTelemetryWindow(selectedMetric, periodHours);
}

export async function createLabTask(ownerId: number, input: { title: string; description?: string; priority: "baja" | "media" | "alta" }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  await db.insert(labTasks).values({ labId: lab.id, title: input.title, description: input.description ?? null, priority: input.priority, status: "pendiente" });
  await appendAudit(lab.id, ownerId, "task.created", `Se registró la tarea: ${input.title}`);
}

export async function createInventoryItem(ownerId: number, input: { name: string; category: string; quantity: string; unit: string; location: string; reorderPoint: string }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  await db.insert(inventoryItems).values({ labId: lab.id, ...input });
  await appendAudit(lab.id, ownerId, "inventory.created", `Se registró inventario: ${input.name}`);
}

export async function createSimulatedDevice(ownerId: number, input: { name: string; type: "sensor" | "actuador" | "camara" | "controlador" | "gateway"; zoneId?: number; riskLevel: "bajo" | "medio" | "alto"; adapter: string }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  await db.insert(devices).values({
    labId: lab.id,
    zoneId: input.zoneId ?? null,
    name: input.name,
    type: input.type,
    adapter: input.adapter,
    connectivity: "simulado",
    riskLevel: input.riskLevel,
    enabled: false,
    capabilitiesJson: JSON.stringify(["simulado", "sin_control_fisico", "requiere_adaptador_revisado"]),
  });
  await appendAudit(lab.id, ownerId, "device.simulated_created", `Se registró el dispositivo simulado: ${input.name}`, "info", { type: input.type, adapter: input.adapter });
}

export async function createExperiment(ownerId: number, input: { title: string; hypothesis: string; variables: string[] }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  await db.insert(experiments).values({ labId: lab.id, title: input.title, hypothesis: input.hypothesis, status: "borrador", variablesJson: JSON.stringify(input.variables), notes: "Creado desde el panel LabOS." });
  await appendAudit(lab.id, ownerId, "experiment.created", `Se registró el experimento: ${input.title}`);
}

export async function createOperationPlan(ownerId: number, input: { title: string; objective: string; mode: "observacion" | "simulacion"; riskLevel: "bajo" | "medio" | "alto"; preconditions: string[]; safeguards: string[]; approvalRequired: boolean; status: "borrador" | "pendiente_aprobacion" | "bloqueado" }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  await db.insert(operationPlans).values({
    labId: lab.id,
    title: input.title,
    objective: input.objective,
    mode: input.mode,
    riskLevel: input.riskLevel,
    status: input.status,
    preconditionsJson: JSON.stringify(input.preconditions),
    safeguardsJson: JSON.stringify(input.safeguards),
    approvalRequired: input.approvalRequired,
  });
  await appendAudit(lab.id, ownerId, "plan.prepared", `Se preparó un plan sin ejecución física: ${input.title}`, input.riskLevel === "alto" ? "atencion" : "info", { mode: input.mode, risk: input.riskLevel });
}

export async function updateLabConfiguration(ownerId: number, input: { name: string; location: string; energyThresholdPct: string; integrationNotice: string }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  await db.update(labs).set(input).where(eq(labs.id, lab.id));
  await appendAudit(lab.id, ownerId, "lab.configured", "Se actualizaron placeholders de configuración.");
}

export async function registerBlockedPhysicalAttempt(ownerId: number, intent: string) {
  const lab = await ensureLabForUser(ownerId);
  const status = physicalExecutionStatus();
  const audit = buildBlockedPhysicalAttemptAudit(intent);
  await appendAudit(lab.id, ownerId, audit.eventType, audit.message, audit.severity, audit.metadata);
  const notification = blockedPhysicalNotification(intent);
  await createLabNotification(lab.id, notification.kind, notification.severity, notification.title, notification.detail);
  return status;
}

export async function resolveOperationPlan(ownerId: number, planId: number, decision: "aprobar" | "rechazar", decisionNote: string) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  const selected = await db.select().from(operationPlans).where(eq(operationPlans.id, planId)).limit(1);
  const plan = selected[0];
  if (!plan || plan.labId !== lab.id) throw new Error("El plan no pertenece a este laboratorio.");

  const persistence = buildPlanDecisionPersistence(plan.status, planId, ownerId, plan.title, decision, decisionNote);
  await db
    .update(operationPlans)
    .set(persistence.planUpdate)
    .where(eq(operationPlans.id, planId));
  await appendAudit(lab.id, ownerId, persistence.audit.eventType, persistence.audit.message, persistence.audit.severity, persistence.audit.metadata);
  const notification = planDecisionNotification(decision, plan.title);
  await createLabNotification(lab.id, notification.kind, notification.severity, notification.title, notification.detail);
  return { status: persistence.planUpdate.status, physicalExecution: physicalExecutionStatus() };
}

export async function createSimulationRun(ownerId: number, input: { scenario: SimulationScenario; durationHours: number; targetZone: string }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  const projection = runSimulationProjection({ ...input, energyThresholdPct: Number(lab.energyThresholdPct) });
  await db.insert(simulationRuns).values({
    labId: lab.id,
    createdBy: ownerId,
    title: projection.title,
    scenario: input.scenario,
    targetZone: input.targetZone,
    durationHours: input.durationHours,
    assumptionsJson: JSON.stringify(projection.assumptions),
    inputsJson: JSON.stringify(projection.inputs),
    resultsJson: JSON.stringify(projection.result),
    status: "completada",
  });
  await appendAudit(lab.id, ownerId, "simulation.completed", `Se completó una proyección de ${input.scenario} sin control físico.`, "info", { scenario: input.scenario, durationHours: input.durationHours, targetZone: input.targetZone, outcome: projection.result.outcome, physicalExecution: "disabled" });
  await createLabNotification(lab.id, "simulacion", projection.result.outcome === "estable" ? "info" : "atencion", "Nueva proyección disponible", `${projection.title} quedó disponible para revisión y comparación.`);
  return projection;
}

export async function createTelemetrySource(ownerId: number, input: { name: string; endpointUrl: string; authMode: "none" | "bearer_placeholder"; credentialReference?: string }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  const endpointUrl = validatePublicTelemetryUrl(input.endpointUrl);
  await db.insert(telemetrySources).values({ labId: lab.id, name: input.name, kind: "http_json", endpointUrl, authMode: input.authMode, credentialReference: input.credentialReference?.trim() || null, status: "preparada", schemaJson: JSON.stringify({ expected: "{ readings: [{ metric, value, unit, status? }] }", mode: "solo_lectura", commands: "disabled" }) });
  await appendAudit(lab.id, ownerId, "telemetry.source_created", `Se registró una fuente de telemetría de solo lectura: ${input.name}`, "info", { endpointUrl, authMode: input.authMode, physicalExecution: "disabled" });
  await createLabNotification(lab.id, "sistema", "info", "Fuente de telemetría preparada", `${input.name} permanece en modo de solo lectura y sin control físico.`);
}

export async function previewTelemetrySource(ownerId: number, sourceId: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  const source = (await db.select().from(telemetrySources).where(eq(telemetrySources.id, sourceId)).limit(1))[0];
  if (!source || source.labId !== lab.id) throw new Error("La fuente no pertenece a este laboratorio.");
  if (source.authMode !== "none") throw new Error("Esta fuente requiere una credencial segura. Completa la referencia de credencial antes de probarla.");
  const endpointUrl = validatePublicTelemetryUrl(source.endpointUrl);
  const response = await fetch(endpointUrl, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`La fuente respondió con HTTP ${response.status}.`);
  const points = normalizeTelemetryPayload(await response.json());
  const sensor = (await db.select().from(devices).where(eq(devices.labId, lab.id)).limit(1))[0];
  if (!sensor) throw new Error("No existe un dispositivo simulado para asociar la telemetría.");
  await db.insert(sensorReadings).values(points.map((point) => ({ deviceId: sensor.id, metric: point.metric, unit: point.unit, value: point.value.toFixed(3), thresholdLow: null, thresholdHigh: null, status: point.status, source: "adaptador" as const })));
  await db.update(telemetrySources).set({ status: "conectada", lastCheckedAt: new Date() }).where(eq(telemetrySources.id, source.id));
  await appendAudit(lab.id, ownerId, "telemetry.source_previewed", `Se importaron ${points.length} lecturas desde una fuente de solo lectura.`, "info", { sourceId, readings: points.length, physicalExecution: "disabled" });
  await createLabNotification(lab.id, "telemetria", points.some((point) => point.status !== "normal") ? "atencion" : "info", "Nuevas lecturas recibidas", `${points.length} lecturas nuevas se incorporaron desde ${source.name}.`);
  return points;
}

export async function markNotificationsRead(ownerId: number, notificationIds?: number[]) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  const rows = await db.select().from(labNotifications).where(eq(labNotifications.labId, lab.id));
  const accepted = notificationIds?.length ? rows.filter((item) => notificationIds.includes(item.id)) : rows;
  if (!accepted.length) return { updated: 0 };
  await Promise.all(accepted.map((item) => db.update(labNotifications).set({ unread: false }).where(eq(labNotifications.id, item.id))));
  return { updated: accepted.length };
}

export async function createLearningProfile(ownerId: number, input: { displayName: string; preferredLanguage: string; targetLanguage: string; proficiency: "inicial" | "intermedio" | "avanzado"; learningGoal: string; pace: "pausado" | "constante" | "intensivo"; privacyAcknowledged: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  if (!input.privacyAcknowledged) throw new Error("Debes confirmar el límite de privacidad antes de guardar un perfil.");
  const lab = await ensureLabForUser(ownerId);
  await db.insert(learningProfiles).values({ labId: lab.id, ownerId, ...input, active: true });
  await appendAudit(lab.id, ownerId, "learning.profile_created", `Se creó el perfil de aprendizaje: ${input.displayName}.`, "info", { targetLanguage: input.targetLanguage, physicalExecution: "disabled" });
  await createLabNotification(lab.id, "sistema", "info", "Perfil de aprendizaje creado", `${input.displayName} quedó listo para práctica guiada con consentimiento explícito.`);
}

export async function saveVoicePractice(ownerId: number, input: { profileId: number; promptText: string; transcript: string; detectedLanguage?: string; audioStorageKey?: string; audioUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  const profile = (await db.select().from(learningProfiles).where(eq(learningProfiles.id, input.profileId)).limit(1))[0];
  if (!profile || profile.labId !== lab.id || !profile.privacyAcknowledged) throw new Error("El perfil no está autorizado para guardar práctica de voz.");
  await db.insert(voicePracticeSessions).values({ labId: lab.id, profileId: input.profileId, promptText: input.promptText, transcript: input.transcript, detectedLanguage: input.detectedLanguage ?? null, audioStorageKey: input.audioStorageKey ?? null, audioUrl: input.audioUrl ?? null, status: "guardada" });
  await appendAudit(lab.id, ownerId, "learning.voice_saved", "Se guardó una práctica de voz con consentimiento del perfil.", "info", { profileId: input.profileId, physicalExecution: "disabled" });
  await createLabNotification(lab.id, "sistema", "info", "Práctica de voz guardada", "La transcripción se añadió al historial del perfil autorizado.");
}

export async function transcribeVoiceAudio(ownerId: number, input: { profileId: number; promptText: string; audioBase64: string; mimeType: string; language?: string }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const lab = await ensureLabForUser(ownerId);
  const profile = (await db.select().from(learningProfiles).where(eq(learningProfiles.id, input.profileId)).limit(1))[0];
  const provider = (await db.select().from(voiceProviderConfigs).where(eq(voiceProviderConfigs.labId, lab.id)).limit(1))[0];
  if (!profile || profile.labId !== lab.id || !profile.privacyAcknowledged) throw new Error("El perfil no está autorizado para transcribir audio.");
  if (!provider || !provider.enabled) throw new Error("El proveedor de transcripción no está habilitado para este laboratorio.");
  if (!input.mimeType.startsWith("audio/")) throw new Error("Solo se aceptan archivos de audio para transcripción.");
  const bytes = Buffer.from(input.audioBase64, "base64");
  if (!bytes.length || bytes.length > provider.maxAudioMb * 1024 * 1024) throw new Error(`El audio debe tener un tamaño entre 1 byte y ${provider.maxAudioMb} MB.`);
  const extension = input.mimeType.includes("ogg") ? "ogg" : input.mimeType.includes("mpeg") ? "mp3" : input.mimeType.includes("wav") ? "wav" : "webm";
  const stored = await storagePut(`voice-practice/${ownerId}/${Date.now()}.${extension}`, bytes, input.mimeType);
  const result = await transcribeAudio({ audioUrl: stored.url, language: input.language, prompt: input.promptText });
  if ("error" in result) throw new Error(result.error);
  await appendAudit(lab.id, ownerId, "learning.voice_transcribed", "Se transcribió un audio de práctica en un perfil autorizado.", "info", { profileId: input.profileId, storageKey: stored.key, provider: provider.provider, physicalExecution: "disabled" });
  return { transcript: result.text, detectedLanguage: result.language ?? input.language ?? null, audioStorageKey: stored.key, audioUrl: stored.url };
}

import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const labs = mysqlTable("labs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  location: varchar("location", { length: 180 }).notNull(),
  mode: mysqlEnum("mode", ["observation", "simulation"]).default("simulation").notNull(),
  safetyState: mysqlEnum("safetyState", ["nominal", "attention", "hold"]).default("nominal").notNull(),
  energyReservePct: decimal("energyReservePct", { precision: 5, scale: 2 }).default("72.00").notNull(),
  energyThresholdPct: decimal("energyThresholdPct", { precision: 5, scale: 2 }).default("25.00").notNull(),
  integrationNotice: text("integrationNotice"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const zones = mysqlTable("zones", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 24 }).notNull(),
  type: mysqlEnum("type", ["cultivo", "germinacion", "agua", "energia", "cuarentena"]).notNull(),
  status: mysqlEnum("status", ["normal", "atencion", "en_pausa"]).default("normal").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  zoneId: int("zoneId"),
  name: varchar("name", { length: 120 }).notNull(),
  type: mysqlEnum("type", ["sensor", "actuador", "camara", "controlador", "gateway"]).notNull(),
  adapter: varchar("adapter", { length: 80 }).default("placeholder").notNull(),
  connectivity: mysqlEnum("connectivity", ["simulado", "desconectado", "preparado"]).default("simulado").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["bajo", "medio", "alto"]).default("bajo").notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  capabilitiesJson: text("capabilitiesJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sensorReadings = mysqlTable("sensorReadings", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  metric: varchar("metric", { length: 80 }).notNull(),
  unit: varchar("unit", { length: 24 }).notNull(),
  value: decimal("value", { precision: 10, scale: 3 }).notNull(),
  thresholdLow: decimal("thresholdLow", { precision: 10, scale: 3 }),
  thresholdHigh: decimal("thresholdHigh", { precision: 10, scale: 3 }),
  status: mysqlEnum("status", ["normal", "atencion", "critico"]).default("normal").notNull(),
  source: mysqlEnum("source", ["simulacion", "adaptador"]).default("simulacion").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export const inventoryItems = mysqlTable("inventoryItems", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 24 }).notNull(),
  reorderPoint: decimal("reorderPoint", { precision: 10, scale: 2 }).default("0.00").notNull(),
  location: varchar("location", { length: 120 }).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const labTasks = mysqlTable("labTasks", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["baja", "media", "alta"]).default("media").notNull(),
  status: mysqlEnum("status", ["pendiente", "en_progreso", "hecha"]).default("pendiente").notNull(),
  dueAt: timestamp("dueAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const experiments = mysqlTable("experiments", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  hypothesis: text("hypothesis").notNull(),
  status: mysqlEnum("status", ["borrador", "activo", "cerrado"]).default("borrador").notNull(),
  variablesJson: text("variablesJson"),
  notes: text("notes"),
  startedAt: timestamp("startedAt"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const operationPlans = mysqlTable("operationPlans", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  objective: text("objective").notNull(),
  mode: mysqlEnum("mode", ["observacion", "simulacion"]).default("simulacion").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["bajo", "medio", "alto"]).default("bajo").notNull(),
  status: mysqlEnum("status", ["borrador", "pendiente_aprobacion", "aprobado", "bloqueado", "completado"]).default("borrador").notNull(),
  preconditionsJson: text("preconditionsJson").notNull(),
  safeguardsJson: text("safeguardsJson").notNull(),
  approvalRequired: boolean("approvalRequired").default(true).notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  decidedBy: int("decidedBy"),
  decidedAt: timestamp("decidedAt"),
  decisionNote: text("decisionNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  actorId: int("actorId"),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  severity: mysqlEnum("severity", ["info", "atencion", "critico"]).default("info").notNull(),
  message: text("message").notNull(),
  metadataJson: text("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const simulationRuns = mysqlTable("simulationRuns", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  createdBy: int("createdBy").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  scenario: mysqlEnum("scenario", ["riego", "luz", "nutrientes", "energia"]).notNull(),
  targetZone: varchar("targetZone", { length: 120 }).notNull(),
  durationHours: int("durationHours").notNull(),
  assumptionsJson: text("assumptionsJson").notNull(),
  inputsJson: text("inputsJson").notNull(),
  resultsJson: text("resultsJson").notNull(),
  status: mysqlEnum("status", ["completada", "bloqueada"]).default("completada").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const telemetrySources = mysqlTable("telemetrySources", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  name: varchar("name", { length: 140 }).notNull(),
  kind: mysqlEnum("kind", ["http_json", "manual_payload"]).default("http_json").notNull(),
  endpointUrl: varchar("endpointUrl", { length: 500 }).notNull(),
  authMode: mysqlEnum("authMode", ["none", "bearer_placeholder"]).default("none").notNull(),
  credentialReference: varchar("credentialReference", { length: 140 }),
  status: mysqlEnum("status", ["preparada", "conectada", "bloqueada"]).default("preparada").notNull(),
  schemaJson: text("schemaJson").notNull(),
  lastCheckedAt: timestamp("lastCheckedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const innovationInitiatives = mysqlTable("innovationInitiatives", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  slug: varchar("slug", { length: 80 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  category: mysqlEnum("category", ["ia_robotica", "agrotech", "food_automation", "assistive_tech"]).notNull(),
  status: mysqlEnum("status", ["vision", "diseno", "prototipo", "piloto"]).default("vision").notNull(),
  safetyScope: varchar("safetyScope", { length: 180 }).notNull(),
  objective: text("objective").notNull(),
  nextMilestone: text("nextMilestone").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const robotLearningModules = mysqlTable("robotLearningModules", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  initiativeSlug: varchar("initiativeSlug", { length: 80 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  capability: varchar("capability", { length: 120 }).notNull(),
  mode: mysqlEnum("mode", ["dialogo", "simulacion", "evaluacion", "planificacion"]).notNull(),
  readiness: mysqlEnum("readiness", ["concepto", "diseno", "prototipo"]).default("concepto").notNull(),
  safetyBoundary: text("safetyBoundary").notNull(),
  progressPct: int("progressPct").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const labNotifications = mysqlTable("labNotifications", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  kind: mysqlEnum("kind", ["telemetria", "simulacion", "seguridad", "sistema"]).notNull(),
  severity: mysqlEnum("severity", ["info", "atencion", "critico"]).default("info").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  detail: text("detail").notNull(),
  unread: boolean("unread").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const learningProfiles = mysqlTable("learningProfiles", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  ownerId: int("ownerId").notNull(),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  preferredLanguage: varchar("preferredLanguage", { length: 12 }).notNull(),
  targetLanguage: varchar("targetLanguage", { length: 12 }).notNull(),
  proficiency: mysqlEnum("proficiency", ["inicial", "intermedio", "avanzado"]).default("inicial").notNull(),
  learningGoal: text("learningGoal").notNull(),
  pace: mysqlEnum("pace", ["pausado", "constante", "intensivo"]).default("constante").notNull(),
  privacyAcknowledged: boolean("privacyAcknowledged").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const voicePracticeSessions = mysqlTable("voicePracticeSessions", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  profileId: int("profileId").notNull(),
  promptText: text("promptText").notNull(),
  transcript: text("transcript").notNull(),
  detectedLanguage: varchar("detectedLanguage", { length: 12 }),
  audioStorageKey: varchar("audioStorageKey", { length: 360 }),
  audioUrl: varchar("audioUrl", { length: 500 }),
  status: mysqlEnum("status", ["borrador", "guardada"]).default("borrador").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const kitchenScenarios = mysqlTable("kitchenScenarios", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  culture: varchar("culture", { length: 100 }).notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  ingredientsJson: text("ingredientsJson").notNull(),
  stagesJson: text("stagesJson").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["bajo", "medio", "alto"]).default("bajo").notNull(),
  safetyNotes: text("safetyNotes").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const kitchenStations = mysqlTable("kitchenStations", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  type: mysqlEnum("type", ["despensa", "preparacion", "coccion", "seguridad"]).notNull(),
  status: mysqlEnum("status", ["modelada", "aislada", "bloqueada", "activa"]).notNull(),
  description: text("description").notNull(),
  safetyMode: varchar("safetyMode", { length: 100 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const voiceProviderConfigs = mysqlTable("voiceProviderConfigs", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  provider: varchar("provider", { length: 80 }).notNull(),
  endpointPlaceholder: varchar("endpointPlaceholder", { length: 180 }).notNull(),
  credentialPlaceholder: varchar("credentialPlaceholder", { length: 180 }).notNull(),
  maxAudioMb: int("maxAudioMb").default(16).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const integrationAdapters = mysqlTable("integrationAdapters", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  kind: mysqlEnum("kind", ["ros2", "sensor", "camara", "controlador"]).notNull(),
  endpointPlaceholder: varchar("endpointPlaceholder", { length: 255 }).notNull(),
  credentialPlaceholder: varchar("credentialPlaceholder", { length: 120 }).notNull(),
  permissionsJson: text("permissionsJson").notNull(),
  status: mysqlEnum("status", ["pendiente", "bloqueado"]).default("bloqueado").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Lab = typeof labs.$inferSelect;
export type Zone = typeof zones.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type OperationPlan = typeof operationPlans.$inferSelect;
export type SimulationRun = typeof simulationRuns.$inferSelect;
export type TelemetrySource = typeof telemetrySources.$inferSelect;
export type InnovationInitiative = typeof innovationInitiatives.$inferSelect;
export type RobotLearningModule = typeof robotLearningModules.$inferSelect;
export type LabNotification = typeof labNotifications.$inferSelect;
export type LearningProfile = typeof learningProfiles.$inferSelect;
export type VoicePracticeSession = typeof voicePracticeSessions.$inferSelect;
export type KitchenScenario = typeof kitchenScenarios.$inferSelect;
export type KitchenStation = typeof kitchenStations.$inferSelect;
export type VoiceProviderConfig = typeof voiceProviderConfigs.$inferSelect;

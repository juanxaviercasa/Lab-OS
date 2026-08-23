import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  createExperiment: vi.fn(),
  createInventoryItem: vi.fn(),
  createLabTask: vi.fn(),
  createLearningProfile: vi.fn(),
  createOperationPlan: vi.fn(),
  createSimulatedDevice: vi.fn(),
  createTelemetrySource: vi.fn(),
  getLabDashboard: vi.fn(),
  getTelemetryHistory: vi.fn(),
  markNotificationsRead: vi.fn(),
  previewTelemetrySource: vi.fn(),
  registerBlockedPhysicalAttempt: vi.fn(),
  resolveOperationPlan: vi.fn(),
  saveVoicePractice: vi.fn(),
  transcribeVoiceAudio: vi.fn(),
  updateLabConfiguration: vi.fn(),
}));

import { createLearningProfile, createOperationPlan, createTelemetrySource, getTelemetryHistory, markNotificationsRead, previewTelemetrySource, registerBlockedPhysicalAttempt, resolveOperationPlan, saveVoicePractice, transcribeVoiceAudio } from "./db";
import { appRouter } from "./routers";

const user = {
  id: 42,
  openId: "labos-test-user",
  name: "Operador de prueba",
  email: "operador@example.com",
  loginMethod: "manus",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createContext(): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("procedimientos de LabOS", () => {
  beforeEach(() => vi.clearAllMocks());

  it("prepara un plan seguro de riesgo medio para aprobación humana", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.lab.preparePlan({
      title: "Simular ventana de riego",
      objective: "Evaluar una ventana de riego con información simulada.",
      mode: "simulacion",
      riskLevel: "medio",
      preconditions: ["La telemetría simulada está disponible."],
      safeguards: ["Sin control físico directo.", "No se transmiten órdenes."],
    });

    expect(result).toMatchObject({ canBePrepared: true, approvalRequired: true, execution: "blocked" });
    expect(createOperationPlan).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ status: "pendiente_aprobacion", approvalRequired: true, mode: "simulacion" }),
    );
  });

  it("rechaza un plan que intenta omitir la salvaguarda de control físico", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.lab.preparePlan({
        title: "Plan incompleto",
        objective: "Esta propuesta no describe la salvaguarda requerida.",
        mode: "simulacion",
        riskLevel: "bajo",
        preconditions: ["Existe una lectura."],
        safeguards: ["Aprobación humana."],
      }),
    ).rejects.toThrow("control físico directo");
    expect(createOperationPlan).not.toHaveBeenCalled();
  });

  it("delega la decisión humana de un plan y conserva el bloqueo físico", async () => {
    vi.mocked(resolveOperationPlan).mockResolvedValue({
      status: "aprobado",
      physicalExecution: { allowed: false, code: "PHYSICAL_CONTROL_DISABLED", message: "Bloqueado" },
    });
    const caller = appRouter.createCaller(createContext());
    const result = await caller.lab.resolvePlan({ planId: 7, decision: "aprobar", decisionNote: "Se revisaron los umbrales simulados." });

    expect(resolveOperationPlan).toHaveBeenCalledWith(user.id, 7, "aprobar", "Se revisaron los umbrales simulados.");
    expect(result.physicalExecution.allowed).toBe(false);
  });

  it("registra un intento de acción física como bloqueado", async () => {
    vi.mocked(registerBlockedPhysicalAttempt).mockResolvedValue({
      allowed: false,
      code: "PHYSICAL_CONTROL_DISABLED",
      message: "Bloqueado y auditado",
    });
    const caller = appRouter.createCaller(createContext());
    const result = await caller.lab.recordBlockedPhysicalAttempt({ intent: "Abrir válvula real" });

    expect(registerBlockedPhysicalAttempt).toHaveBeenCalledWith(user.id, "Abrir válvula real");
    expect(result).toMatchObject({ allowed: false, code: "PHYSICAL_CONTROL_DISABLED" });
  });

  it("consulta telemetría por métrica y periodo, incluido un historial vacío", async () => {
    vi.mocked(getTelemetryHistory).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const caller = appRouter.createCaller(createContext());
    await expect(caller.lab.telemetryHistory({ metric: "Humedad del sustrato", periodHours: 72 })).resolves.toEqual([]);
    await expect(caller.lab.telemetryHistory({ periodHours: 24 })).resolves.toEqual([]);
    expect(getTelemetryHistory).toHaveBeenNthCalledWith(1, user.id, "Humedad del sustrato", 72);
    expect(getTelemetryHistory).toHaveBeenNthCalledWith(2, user.id, undefined, 24);
  });

  it("registra y previsualiza una fuente de telemetría solo de lectura", async () => {
    vi.mocked(createTelemetrySource).mockResolvedValue(undefined);
    vi.mocked(previewTelemetrySource).mockResolvedValue([{ metric: "Humedad", value: 61, unit: "%", status: "normal" }]);
    const caller = appRouter.createCaller(createContext());
    await caller.lab.createTelemetrySource({ name: "Fuente pública", endpointUrl: "https://telemetry.example.org/readings", authMode: "none" });
    const preview = await caller.lab.previewTelemetrySource({ sourceId: 9 });
    expect(createTelemetrySource).toHaveBeenCalledWith(user.id, { name: "Fuente pública", endpointUrl: "https://telemetry.example.org/readings", authMode: "none" });
    expect(previewTelemetrySource).toHaveBeenCalledWith(user.id, 9);
    expect(preview).toEqual([{ metric: "Humedad", value: 61, unit: "%", status: "normal" }]);
  });

  it("marca las notificaciones indicadas como leídas", async () => {
    vi.mocked(markNotificationsRead).mockResolvedValue({ updated: 2 });
    const caller = appRouter.createCaller(createContext());
    const result = await caller.lab.markNotificationsRead({ notificationIds: [3, 4] });
    expect(markNotificationsRead).toHaveBeenCalledWith(user.id, [3, 4]);
    expect(result).toEqual({ updated: 2 });
  });

  it("crea un perfil con consentimiento y guarda una práctica de voz revisada", async () => {
    vi.mocked(createLearningProfile).mockResolvedValue(undefined);
    vi.mocked(saveVoicePractice).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext());
    const profile = { displayName: "Perfil inglés", preferredLanguage: "es", targetLanguage: "en", proficiency: "inicial" as const, learningGoal: "Conversación cotidiana.", pace: "constante" as const, privacyAcknowledged: true as const };
    await caller.lab.createLearningProfile(profile);
    await caller.lab.saveVoicePractice({ profileId: 4, promptText: "Preséntate.", transcript: "Hello, I am learning English.", detectedLanguage: "en" });
    expect(createLearningProfile).toHaveBeenCalledWith(user.id, profile);
    expect(saveVoicePractice).toHaveBeenCalledWith(user.id, { profileId: 4, promptText: "Preséntate.", transcript: "Hello, I am learning English.", detectedLanguage: "en" });
  });

  it("delega audio autorizado al proveedor de transcripción seguro", async () => {
    vi.mocked(transcribeVoiceAudio).mockResolvedValue({ transcript: "Hola", detectedLanguage: "es", audioStorageKey: "voice/practice.webm", audioUrl: "/manus-storage/voice/practice.webm" });
    const caller = appRouter.createCaller(createContext());
    const result = await caller.lab.transcribeVoiceAudio({ profileId: 4, promptText: "Saluda.", audioBase64: "YWJjZA==", mimeType: "audio/webm", language: "es" });
    expect(transcribeVoiceAudio).toHaveBeenCalledWith(user.id, { profileId: 4, promptText: "Saluda.", audioBase64: "YWJjZA==", mimeType: "audio/webm", language: "es" });
    expect(result).toMatchObject({ transcript: "Hola", detectedLanguage: "es" });
  });
});

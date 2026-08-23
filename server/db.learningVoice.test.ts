import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({ storagePut: vi.fn(async () => ({ key: "voice-practice/42/sample.webm", url: "/manus-storage/voice-practice/42/sample.webm" })) }));
vi.mock("./_core/voiceTranscription", () => ({ transcribeAudio: vi.fn(async () => ({ text: "Hola, estoy practicando.", language: "es", task: "transcribe", duration: 1, segments: [] })) }));

import { __setDbForTesting, createLearningProfile, saveVoicePractice, transcribeVoiceAudio } from "./db";
import { storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";

const lab = { id: 8, ownerId: 42, name: "Lab", location: "X", mode: "simulation", safetyState: "nominal", energyReservePct: "72", energyThresholdPct: "25", integrationNotice: null, createdAt: new Date(), updatedAt: new Date() };
const profile = { id: 3, labId: 8, ownerId: 42, displayName: "Perfil", preferredLanguage: "es", targetLanguage: "en", proficiency: "inicial", learningGoal: "Conversar", pace: "constante", privacyAcknowledged: true, active: true };
const provider = { id: 7, labId: 8, provider: "Transcripción integrada", endpointPlaceholder: "BUILT_IN_FORGE_API_URL", credentialPlaceholder: "BUILT_IN_FORGE_API_KEY", maxAudioMb: 16, enabled: true };

function tableName(table: any) { return table?.[Symbol.for("drizzle:Name")]; }
function createDb(rows: Record<string, any[]>) {
  const inserts: unknown[] = [];
  const db = { select: () => ({ from: (table: any) => { const result = rows[tableName(table)] ?? []; const chain = { limit: () => Promise.resolve(result), orderBy: () => chain, then: (resolve: (value: any[]) => unknown) => Promise.resolve(result).then(resolve) }; return { where: () => chain, orderBy: () => chain }; } }), insert: () => ({ values: (value: unknown) => { inserts.push(value); return Promise.resolve(); } }), update: () => ({ set: () => ({ where: () => Promise.resolve() }) }) };
  return { db, inserts };
}

describe("persistencia de aprendizaje y voz", () => {
  afterEach(() => { __setDbForTesting(null); vi.clearAllMocks(); });

  it("inserta un perfil consentido y genera su auditoría y notificación", async () => {
    const fake = createDb({ labs: [lab] }); __setDbForTesting(fake.db);
    await createLearningProfile(42, { displayName: "Perfil francés", preferredLanguage: "es", targetLanguage: "fr", proficiency: "inicial", learningGoal: "Practicar saludos.", pace: "pausado", privacyAcknowledged: true });
    expect(fake.inserts[0]).toMatchObject({ labId: 8, ownerId: 42, displayName: "Perfil francés", privacyAcknowledged: true });
    expect(fake.inserts.some((value: any) => value?.eventType === "learning.profile_created")).toBe(true);
    expect(fake.inserts.some((value: any) => value?.title === "Perfil de aprendizaje creado")).toBe(true);
  });

  it("guarda práctica y usa el proveedor autorizado para transcribir con metadatos", async () => {
    const fake = createDb({ labs: [lab], learningProfiles: [profile], voiceProviderConfigs: [provider] }); __setDbForTesting(fake.db);
    await saveVoicePractice(42, { profileId: 3, promptText: "Saluda", transcript: "Bonjour", detectedLanguage: "fr", audioStorageKey: "voice/bonjour.webm", audioUrl: "/manus-storage/voice/bonjour.webm" });
    expect(fake.inserts[0]).toMatchObject({ profileId: 3, transcript: "Bonjour", audioStorageKey: "voice/bonjour.webm" });
    expect(fake.inserts.some((value: any) => value?.eventType === "learning.voice_saved")).toBe(true);
    expect(fake.inserts.some((value: any) => value?.title === "Práctica de voz guardada")).toBe(true);
    const result = await transcribeVoiceAudio(42, { profileId: 3, promptText: "Di hola", audioBase64: Buffer.from("audio").toString("base64"), mimeType: "audio/webm", language: "es" });
    expect(storagePut).toHaveBeenCalled();
    expect(transcribeAudio).toHaveBeenCalledWith(expect.objectContaining({ language: "es", prompt: "Di hola" }));
    expect(result).toMatchObject({ transcript: "Hola, estoy practicando.", audioStorageKey: "voice-practice/42/sample.webm" });
  });

  it("respeta la activación y el límite de audio definidos por el proveedor", async () => {
    const disabled = createDb({ labs: [lab], learningProfiles: [profile], voiceProviderConfigs: [{ ...provider, enabled: false }] }); __setDbForTesting(disabled.db);
    await expect(transcribeVoiceAudio(42, { profileId: 3, promptText: "Di hola", audioBase64: "YWJjZA==", mimeType: "audio/webm" })).rejects.toThrow("no está habilitado");
    const limited = createDb({ labs: [lab], learningProfiles: [profile], voiceProviderConfigs: [{ ...provider, maxAudioMb: 0 }] }); __setDbForTesting(limited.db);
    await expect(transcribeVoiceAudio(42, { profileId: 3, promptText: "Di hola", audioBase64: "YWJjZA==", mimeType: "audio/webm" })).rejects.toThrow("0 MB");
  });
});

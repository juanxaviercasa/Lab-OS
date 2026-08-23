import { describe, expect, it } from "vitest";
import { createLearningProfile } from "./db";

describe("perfiles de aprendizaje", () => {
  it("rechaza un perfil cuando no existe consentimiento de privacidad", async () => {
    await expect(createLearningProfile(42, {
      displayName: "Perfil sin consentimiento",
      preferredLanguage: "es",
      targetLanguage: "en",
      proficiency: "inicial",
      learningGoal: "Practicar conversaciones cotidianas.",
      pace: "constante",
      privacyAcknowledged: false,
    })).rejects.toThrow("límite de privacidad");
  });
});

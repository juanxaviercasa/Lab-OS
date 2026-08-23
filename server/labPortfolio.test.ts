import { describe, expect, it } from "vitest";
import { getDefaultInitiatives } from "./labPortfolio";

describe("portafolio de iniciativas", () => {
  it("mantiene las cuatro líneas estratégicas con límites de seguridad y siguientes hitos", () => {
    const initiatives = getDefaultInitiatives();
    expect(initiatives).toHaveLength(4);
    expect(initiatives.map((item) => item.category)).toEqual(["ia_robotica", "agrotech", "food_automation", "assistive_tech"]);
    initiatives.forEach((item) => { expect(item.safetyScope.length).toBeGreaterThan(10); expect(item.nextMilestone.length).toBeGreaterThan(10); });
  });
});

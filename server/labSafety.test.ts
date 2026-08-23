import { describe, expect, it } from "vitest";
import { buildBlockedPhysicalAttemptAudit, buildPlanDecisionPersistence, physicalExecutionStatus, resolvePlanDecision, reviewSimulatedPlan } from "./labSafety";

describe("safeguardas de LabOS", () => {
  it("bloquea siempre el control físico directo", () => {
    expect(physicalExecutionStatus()).toMatchObject({
      allowed: false,
      code: "PHYSICAL_CONTROL_DISABLED",
    });
  });

  it("rechaza un plan que omite la salvaguarda de control físico", () => {
    const review = reviewSimulatedPlan({
      mode: "simulacion",
      riskLevel: "medio",
      preconditions: ["Lectura disponible"],
      safeguards: ["Aprobación humana requerida"],
    });
    expect(review.canBePrepared).toBe(false);
    expect(review.missing[0]).toContain("control físico");
  });

  it("requiere aprobación humana para riesgo medio o alto", () => {
    const review = reviewSimulatedPlan({
      mode: "simulacion",
      riskLevel: "alto",
      preconditions: ["Lectura disponible"],
      safeguards: ["Sin control físico directo", "No se transmiten órdenes"],
    });
    expect(review.canBePrepared).toBe(true);
    expect(review.approvalRequired).toBe(true);
    expect(review.execution).toBe("blocked");
  });

  it("solo resuelve planes pendientes y nunca habilita ejecución física", () => {
    expect(resolvePlanDecision("pendiente_aprobacion", "aprobar")).toBe("aprobado");
    expect(resolvePlanDecision("pendiente_aprobacion", "rechazar")).toBe("bloqueado");
    expect(() => resolvePlanDecision("aprobado", "rechazar")).toThrow("pendientes de aprobación");
    expect(physicalExecutionStatus().allowed).toBe(false);
  });

  it("prepara la persistencia y la auditoría de una aprobación humana", () => {
    const now = new Date("2026-08-23T12:00:00.000Z");
    const result = buildPlanDecisionPersistence("pendiente_aprobacion", 7, 42, "Plan de riego", "aprobar", now);
    expect(result.planUpdate).toEqual({ status: "aprobado", approvedBy: 42, approvedAt: now });
    expect(result.audit).toMatchObject({
      eventType: "plan.approved_for_simulation",
      severity: "info",
      metadata: { planId: 7, resultingStatus: "aprobado", physicalExecution: "disabled" },
    });
  });

  it("prepara una entrada crítica de auditoría para un intento físico bloqueado", () => {
    const audit = buildBlockedPhysicalAttemptAudit("Abrir válvula real");
    expect(audit).toMatchObject({
      eventType: "safety.physical_attempt_blocked",
      severity: "critico",
      metadata: { intent: "Abrir válvula real", allowed: false, code: "PHYSICAL_CONTROL_DISABLED" },
    });
  });
});

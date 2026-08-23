export type LabMode = "observacion" | "simulacion";
export type RiskLevel = "bajo" | "medio" | "alto";
export type PlanDecisionStatus = "aprobado" | "bloqueado";

export type SafetyReviewInput = {
  mode: LabMode;
  riskLevel: RiskLevel;
  preconditions: string[];
  safeguards: string[];
};

export type SafetyReview = {
  approvalRequired: boolean;
  canBePrepared: boolean;
  missing: string[];
  execution: "blocked";
  message: string;
};

const REQUIRED_SAFEGUARD = "sin control físico directo";

export function reviewSimulatedPlan(input: SafetyReviewInput): SafetyReview {
  const normalizedSafeguards = input.safeguards.map((item) => item.trim().toLowerCase());
  const missing: string[] = [];

  if (input.preconditions.filter(Boolean).length === 0) {
    missing.push("Añade al menos una precondición verificable.");
  }

  if (!normalizedSafeguards.some((item) => item.includes(REQUIRED_SAFEGUARD))) {
    missing.push("Declara explícitamente que no existe control físico directo.");
  }

  if (input.mode !== "observacion" && input.mode !== "simulacion") {
    missing.push("El modo debe ser observación o simulación.");
  }

  return {
    approvalRequired: input.riskLevel !== "bajo",
    canBePrepared: missing.length === 0,
    missing,
    execution: "blocked",
    message:
      "LabOS solo prepara y registra planes. La ejecución física permanece bloqueada en esta fase.",
  };
}

export function physicalExecutionStatus() {
  return {
    allowed: false,
    code: "PHYSICAL_CONTROL_DISABLED",
    message:
      "El control físico directo está deshabilitado. Utiliza observación o simulación y conserva la aprobación humana para futuras integraciones.",
  } as const;
}

export function resolvePlanDecision(currentStatus: string, decision: "aprobar" | "rechazar"): PlanDecisionStatus {
  if (currentStatus !== "pendiente_aprobacion") {
    throw new Error("Solo los planes pendientes de aprobación pueden resolverse.");
  }
  return decision === "aprobar" ? "aprobado" : "bloqueado";
}

export function buildPlanDecisionPersistence(
  currentStatus: string,
  planId: number,
  actorId: number,
  planTitle: string,
  decision: "aprobar" | "rechazar",
  now = new Date(),
) {
  const status = resolvePlanDecision(currentStatus, decision);
  const approved = decision === "aprobar";
  return {
    planUpdate: {
      status,
      approvedBy: approved ? actorId : null,
      approvedAt: approved ? now : null,
    },
    audit: {
      eventType: approved ? "plan.approved_for_simulation" : "plan.rejected",
      severity: approved ? "info" as const : "atencion" as const,
      message: approved
        ? `El plan fue aprobado exclusivamente para simulación: ${planTitle}`
        : `El plan fue rechazado y bloqueado: ${planTitle}`,
      metadata: { planId, resultingStatus: status, physicalExecution: "disabled" },
    },
  };
}

export function buildBlockedPhysicalAttemptAudit(intent: string) {
  const status = physicalExecutionStatus();
  return {
    eventType: "safety.physical_attempt_blocked",
    severity: "critico" as const,
    message: `Intento bloqueado de acción física: ${intent}`,
    metadata: { intent, ...status },
  };
}

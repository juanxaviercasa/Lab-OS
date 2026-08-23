import { describe, expect, it } from "vitest";
import { clinicalRecordCanBeApproved, getDefaultClinicalApprovalTemplates } from "./clinicalApprovals";

describe("plantillas de aprobación clínica", () => {
  it("define coberturas de movilidad, transferencias, alimentación y comunicación con límite de simulación", () => {
    const templates = getDefaultClinicalApprovalTemplates();
    expect(templates).toHaveLength(4);
    expect(templates.map((template) => template.scope)).toEqual(["movilidad", "transferencia", "alimentacion", "comunicacion"]);
    templates.forEach((template) => expect(template.safetyBoundary).toContain("simulación"));
  });

  it("exige consentimiento, evidencia suficiente y nota de decisión antes de aprobar", () => {
    expect(clinicalRecordCanBeApproved({ consentConfirmed: false, evidence: ["evidencia"], decisionNote: "corta" }).canApprove).toBe(false);
    expect(clinicalRecordCanBeApproved({ consentConfirmed: true, evidence: ["contexto revisado", "riesgos revisados"], decisionNote: "La evidencia y los límites fueron revisados por la persona responsable." })).toMatchObject({ canApprove: true, physicalExecution: "disabled" });
  });
});

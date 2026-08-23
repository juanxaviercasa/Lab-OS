export type ClinicalScope = "movilidad" | "transferencia" | "alimentacion" | "comunicacion";

export type ClinicalTemplateSeed = {
  name: string;
  scope: ClinicalScope;
  version: string;
  status: "lista";
  requiredRoles: string[];
  checklist: string[];
  consentStatement: string;
  safetyBoundary: string;
};

export function getDefaultClinicalApprovalTemplates(): ClinicalTemplateSeed[] {
  const commonBoundary = "Autoriza únicamente la evaluación en observación o simulación; no habilita diagnóstico, tratamiento, movimiento, dispensado, transferencia ni control físico.";
  return [
    {
      name: "Revisión clínica · apoyo de movilidad guiada",
      scope: "movilidad",
      version: "1.0",
      status: "lista",
      requiredRoles: ["Profesional clínico responsable", "Persona usuaria o representante", "Revisor de seguridad"],
      checklist: ["Necesidad funcional documentada", "Riesgos posturales y del entorno revisados", "Consentimiento informado confirmado", "Escenario limitado al gemelo digital", "Criterios de detención definidos"],
      consentStatement: "Confirmo que la persona participante comprende el alcance de simulación, privacidad y la ausencia de actuación física.",
      safetyBoundary: commonBoundary,
    },
    {
      name: "Revisión clínica · cama y transferencias",
      scope: "transferencia",
      version: "1.0",
      status: "lista",
      requiredRoles: ["Profesional clínico responsable", "Persona cuidadora autorizada", "Revisor de seguridad"],
      checklist: ["Objetivo de confort definido", "Riesgos de presión y caída considerados", "Plan de acompañamiento documentado", "Consentimiento informado confirmado", "Sin conexión a cama, elevador ni actuador"],
      consentStatement: "Confirmo que la revisión se limita a una representación digital y que no sustituye la valoración clínica presencial.",
      safetyBoundary: commonBoundary,
    },
    {
      name: "Revisión clínica · apoyo a alimentación",
      scope: "alimentacion",
      version: "1.0",
      status: "lista",
      requiredRoles: ["Profesional clínico responsable", "Persona usuaria o representante", "Especialista en nutrición cuando aplique"],
      checklist: ["Preferencias y restricciones documentadas", "Riesgos de deglución identificados por el equipo competente", "Consentimiento informado confirmado", "Simulación sin dispensado ni manipulación", "Criterio de suspensión documentado"],
      consentStatement: "Confirmo que esta plantilla no prescribe dietas ni habilita alimentación automatizada; solo registra una evaluación de simulación.",
      safetyBoundary: commonBoundary,
    },
    {
      name: "Revisión clínica · comunicación y recordatorios",
      scope: "comunicacion",
      version: "1.0",
      status: "lista",
      requiredRoles: ["Profesional clínico responsable", "Persona usuaria o representante", "Responsable de privacidad"],
      checklist: ["Objetivo de comunicación definido", "Preferencias de privacidad registradas", "Consentimiento informado confirmado", "Contenido revisable antes de uso", "Sin decisiones clínicas automatizadas"],
      consentStatement: "Confirmo que los recordatorios y mensajes permanecen bajo supervisión humana y no sustituyen atención profesional.",
      safetyBoundary: commonBoundary,
    },
  ];
}

export function clinicalRecordCanBeApproved(input: { consentConfirmed: boolean; evidence: string[]; decisionNote: string }) {
  const missing: string[] = [];
  if (!input.consentConfirmed) missing.push("Debe confirmarse el consentimiento informado.");
  if (input.evidence.filter(Boolean).length < 2) missing.push("Se requieren al menos dos elementos de evidencia revisable.");
  if (input.decisionNote.trim().length < 12) missing.push("La nota de decisión debe explicar la revisión realizada.");
  return { canApprove: missing.length === 0, missing, physicalExecution: "disabled" as const };
}

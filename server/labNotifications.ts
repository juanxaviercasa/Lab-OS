export function blockedPhysicalNotification(intent: string) {
  return { kind: "seguridad" as const, severity: "critico" as const, title: "Acción física bloqueada", detail: `LabOS bloqueó y auditó el intento: ${intent}. No se contactó ningún equipo.` };
}

export function planDecisionNotification(decision: "aprobar" | "rechazar", title: string) {
  return decision === "aprobar"
    ? { kind: "seguridad" as const, severity: "info" as const, title: "Plan aprobado en simulación", detail: `${title} fue aprobado por una persona; el control físico sigue deshabilitado.` }
    : { kind: "seguridad" as const, severity: "atencion" as const, title: "Plan rechazado", detail: `${title} fue rechazado y quedó registrado para revisión.` };
}

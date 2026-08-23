export const dataFlowNodes = [
  { id: "origen", title: "Fuente", detail: "Lecturas HTTPS en modo observación", kind: "telemetria" },
  { id: "validacion", title: "Validación", detail: "Esquema, origen y límites", kind: "seguridad" },
  { id: "gemelo", title: "Gemelo digital", detail: "Estado de zonas y referencias", kind: "modelo" },
  { id: "simulacion", title: "Simulación", detail: "Proyección sin actuación", kind: "simulacion" },
  { id: "auditoria", title: "Auditoría", detail: "Bitácora y notificaciones", kind: "auditoria" },
] as const;

export function resolveDataFlowNode(id: string) {
  return dataFlowNodes.find((node) => node.id === id) ?? dataFlowNodes[0];
}

export function getDefaultRobotLearningModules() {
  return [
    { initiativeSlug: "cerebro-robotico-educativo", name: "Núcleo de diálogo adaptativo", capability: "Tutoría de idiomas y explicaciones", mode: "dialogo" as const, readiness: "prototipo" as const, safetyBoundary: "No evalúa diagnósticos, decisiones de alto impacto ni emite órdenes físicas.", progressPct: 62 },
    { initiativeSlug: "cerebro-robotico-educativo", name: "Memoria de currículo", capability: "Seguimiento de objetivos de aprendizaje", mode: "planificacion" as const, readiness: "diseno" as const, safetyBoundary: "Requiere consentimiento y revisión humana de cualquier perfil sensible.", progressPct: 45 },
    { initiativeSlug: "cerebro-robotico-educativo", name: "Laboratorio de escenarios", capability: "Práctica guiada y simulación", mode: "simulacion" as const, readiness: "diseno" as const, safetyBoundary: "Opera únicamente con escenarios aislados; no controla robots ni dispositivos.", progressPct: 38 },
    { initiativeSlug: "cerebro-robotico-educativo", name: "Evaluación formativa", capability: "Retroalimentación y dominio progresivo", mode: "evaluacion" as const, readiness: "concepto" as const, safetyBoundary: "Las sugerencias no sustituyen la evaluación docente, clínica o profesional.", progressPct: 22 },
  ];
}

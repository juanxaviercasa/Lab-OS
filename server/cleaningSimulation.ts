export type CleaningArea = "cocina" | "sala" | "exterior" | "residuos";
export type CleaningTaskType = "vajilla" | "superficies" | "encerado" | "vehiculo" | "residuos_reciclaje";

export type CleaningMetrics = {
  waterLiters: number;
  energyKwh: number;
  wasteKg: number;
  recyclingKg: number;
  exposureMinutes: number;
};

export type CleaningScenarioSeed = {
  name: string;
  area: CleaningArea;
  taskType: CleaningTaskType;
  riskLevel: "bajo" | "medio" | "alto";
  metrics: CleaningMetrics;
  safeguards: string[];
};

const safetyBoundary = ["Solo evaluación en gemelo digital", "Sin locomoción ni manipulación física", "Sin agua, químicos, aspiración o pulido real", "Revisión humana obligatoria antes de cualquier prototipo"];

export function getDefaultCleaningScenarios(): CleaningScenarioSeed[] {
  return [
    { name: "Vajilla de cocina · carga eficiente", area: "cocina", taskType: "vajilla", riskLevel: "medio", metrics: { waterLiters: 14, energyKwh: 0.55, wasteKg: 0.08, recyclingKg: 0.18, exposureMinutes: 18 }, safeguards: [...safetyBoundary, "No activa lavavajillas ni dosifica detergente"] },
    { name: "Sala · superficies y aspirado conceptual", area: "sala", taskType: "superficies", riskLevel: "bajo", metrics: { waterLiters: 1.5, energyKwh: 0.22, wasteKg: 0.12, recyclingKg: 0.04, exposureMinutes: 22 }, safeguards: [...safetyBoundary, "No activa aspiradora ni equipo eléctrico"] },
    { name: "Sala · encerado y prevención de resbalón", area: "sala", taskType: "encerado", riskLevel: "medio", metrics: { waterLiters: 0.8, energyKwh: 0.12, wasteKg: 0.05, recyclingKg: 0.02, exposureMinutes: 28 }, safeguards: [...safetyBoundary, "Evalúa ventilación y superficie sin aplicar productos"] },
    { name: "Exterior · lavado de vehículo con ahorro", area: "exterior", taskType: "vehiculo", riskLevel: "medio", metrics: { waterLiters: 48, energyKwh: 0.35, wasteKg: 0.16, recyclingKg: 0.08, exposureMinutes: 35 }, safeguards: [...safetyBoundary, "No abre válvulas, mangueras ni equipos de presión"] },
    { name: "Residuos · clasificación y reciclaje trazable", area: "residuos", taskType: "residuos_reciclaje", riskLevel: "bajo", metrics: { waterLiters: 0, energyKwh: 0.05, wasteKg: 0.65, recyclingKg: 1.8, exposureMinutes: 16 }, safeguards: [...safetyBoundary, "No transporta bolsas ni compacta residuos"] },
  ];
}

export type CleaningVerification = {
  state: "verificado" | "requiere_revision";
  checks: Array<{ label: string; passed: boolean; detail: string }>;
  physicalExecution: "disabled";
};

export function verifyCleaningScenario(metrics: CleaningMetrics, riskLevel: "bajo" | "medio" | "alto"): CleaningVerification {
  const checks = [
    { label: "Métricas no negativas", passed: Object.values(metrics).every((value) => Number.isFinite(value) && value >= 0), detail: "Agua, energía, residuos, reciclaje y exposición son valores de simulación." },
    { label: "Balance de reciclaje", passed: metrics.recyclingKg >= 0 && metrics.wasteKg >= 0, detail: `${metrics.recyclingKg.toFixed(2)} kg de reciclaje trazable frente a ${metrics.wasteKg.toFixed(2)} kg de residuos estimados.` },
    { label: "Uso de recursos", passed: metrics.waterLiters <= 60 && metrics.energyKwh <= 1.2, detail: `${metrics.waterLiters.toFixed(1)} L y ${metrics.energyKwh.toFixed(2)} kWh permanecen dentro del umbral de escenario.` },
    { label: "Revisión humana", passed: riskLevel !== "alto", detail: riskLevel === "alto" ? "Un escenario de riesgo alto requiere revisión adicional antes de marcarse como evaluado." : "La aprobación humana continúa siendo obligatoria para cualquier avance fuera del gemelo." },
  ];
  return { state: checks.every((check) => check.passed) ? "verificado" : "requiere_revision", checks, physicalExecution: "disabled" };
}

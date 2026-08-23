export type CleaningArea = "cocina" | "sala" | "exterior" | "residuos";
export type CleaningTaskType = "vajilla" | "superficies" | "encerado" | "vehiculo" | "residuos_reciclaje";

export type CleaningMetrics = {
  waterLiters: number;
  energyKwh: number;
  wasteKg: number;
  recyclingKg: number;
  exposureMinutes: number;
};

export type CleaningThresholds = {
  maxWaterLiters: number;
  maxEnergyKwh: number;
  minRecyclingKg: number;
};

export type CleaningScenarioSeed = {
  name: string;
  area: CleaningArea;
  taskType: CleaningTaskType;
  riskLevel: "bajo" | "medio" | "alto";
  metrics: CleaningMetrics;
  thresholds: CleaningThresholds;
  safeguards: string[];
};

const safetyBoundary = ["Solo evaluación en gemelo digital", "Sin locomoción ni manipulación física", "Sin agua, químicos, aspiración o pulido real", "Revisión humana obligatoria antes de cualquier prototipo"];

export const defaultCleaningThresholds: CleaningThresholds = { maxWaterLiters: 60, maxEnergyKwh: 1.2, minRecyclingKg: 0 };

export function getDefaultCleaningScenarios(): CleaningScenarioSeed[] {
  return [
    { name: "Vajilla de cocina · carga eficiente", area: "cocina", taskType: "vajilla", riskLevel: "medio", metrics: { waterLiters: 14, energyKwh: 0.55, wasteKg: 0.08, recyclingKg: 0.18, exposureMinutes: 18 }, thresholds: { maxWaterLiters: 18, maxEnergyKwh: 0.8, minRecyclingKg: 0.12 }, safeguards: [...safetyBoundary, "No activa lavavajillas ni dosifica detergente"] },
    { name: "Sala · superficies y aspirado conceptual", area: "sala", taskType: "superficies", riskLevel: "bajo", metrics: { waterLiters: 1.5, energyKwh: 0.22, wasteKg: 0.12, recyclingKg: 0.04, exposureMinutes: 22 }, thresholds: { maxWaterLiters: 3, maxEnergyKwh: 0.4, minRecyclingKg: 0 }, safeguards: [...safetyBoundary, "No activa aspiradora ni equipo eléctrico"] },
    { name: "Sala · encerado y prevención de resbalón", area: "sala", taskType: "encerado", riskLevel: "medio", metrics: { waterLiters: 0.8, energyKwh: 0.12, wasteKg: 0.05, recyclingKg: 0.02, exposureMinutes: 28 }, thresholds: { maxWaterLiters: 2, maxEnergyKwh: 0.3, minRecyclingKg: 0 }, safeguards: [...safetyBoundary, "Evalúa ventilación y superficie sin aplicar productos"] },
    { name: "Exterior · lavado de vehículo con ahorro", area: "exterior", taskType: "vehiculo", riskLevel: "medio", metrics: { waterLiters: 48, energyKwh: 0.35, wasteKg: 0.16, recyclingKg: 0.08, exposureMinutes: 35 }, thresholds: { maxWaterLiters: 55, maxEnergyKwh: 0.6, minRecyclingKg: 0.05 }, safeguards: [...safetyBoundary, "No abre válvulas, mangueras ni equipos de presión"] },
    { name: "Residuos · clasificación y reciclaje trazable", area: "residuos", taskType: "residuos_reciclaje", riskLevel: "bajo", metrics: { waterLiters: 0, energyKwh: 0.05, wasteKg: 0.65, recyclingKg: 1.8, exposureMinutes: 16 }, thresholds: { maxWaterLiters: 0.2, maxEnergyKwh: 0.2, minRecyclingKg: 1.2 }, safeguards: [...safetyBoundary, "No transporta bolsas ni compacta residuos"] },
  ];
}

export type CleaningVerification = {
  state: "verificado" | "requiere_revision";
  checks: Array<{ label: string; passed: boolean; detail: string }>;
  physicalExecution: "disabled";
};

export function verifyCleaningScenario(metrics: CleaningMetrics, riskLevel: "bajo" | "medio" | "alto", thresholds: CleaningThresholds = defaultCleaningThresholds): CleaningVerification {
  const checks = [
    { label: "Métricas no negativas", passed: Object.values(metrics).every((value) => Number.isFinite(value) && value >= 0), detail: "Agua, energía, residuos, reciclaje y exposición son valores de simulación." },
    { label: "Meta de reciclaje", passed: metrics.recyclingKg >= thresholds.minRecyclingKg, detail: `${metrics.recyclingKg.toFixed(2)} kg de reciclaje frente a una meta mínima de ${thresholds.minRecyclingKg.toFixed(2)} kg.` },
    { label: "Uso de recursos", passed: metrics.waterLiters <= thresholds.maxWaterLiters && metrics.energyKwh <= thresholds.maxEnergyKwh, detail: `${metrics.waterLiters.toFixed(1)} L / máximo ${thresholds.maxWaterLiters.toFixed(1)} L · ${metrics.energyKwh.toFixed(2)} kWh / máximo ${thresholds.maxEnergyKwh.toFixed(2)} kWh.` },
    { label: "Revisión humana", passed: riskLevel !== "alto", detail: riskLevel === "alto" ? "Un escenario de riesgo alto requiere revisión adicional antes de marcarse como evaluado." : "La aprobación humana continúa siendo obligatoria para cualquier avance fuera del gemelo." },
  ];
  return { state: checks.every((check) => check.passed) ? "verificado" : "requiere_revision", checks, physicalExecution: "disabled" };
}

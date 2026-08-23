export type CleaningComparisonMetrics = {
  waterLiters: number;
  energyKwh: number;
  wasteKg: number;
  recyclingKg: number;
  exposureMinutes: number;
};

export function compareCleaningMetrics(left: CleaningComparisonMetrics, right: CleaningComparisonMetrics) {
  const dimensions: Array<{ key: keyof CleaningComparisonMetrics; label: string; unit: string; lowerIsBetter: boolean }> = [
    { key: "waterLiters", label: "Agua", unit: "L", lowerIsBetter: true },
    { key: "energyKwh", label: "Energía", unit: "kWh", lowerIsBetter: true },
    { key: "wasteKg", label: "Residuos", unit: "kg", lowerIsBetter: true },
    { key: "recyclingKg", label: "Reciclaje", unit: "kg", lowerIsBetter: false },
    { key: "exposureMinutes", label: "Exposición", unit: "min", lowerIsBetter: true },
  ];
  const rows = dimensions.map((dimension) => {
    const delta = Number((right[dimension.key] - left[dimension.key]).toFixed(2));
    const better = delta === 0 ? "igual" : (dimension.lowerIsBetter ? delta < 0 : delta > 0) ? "derecha" : "izquierda";
    return { ...dimension, left: left[dimension.key], right: right[dimension.key], delta, better };
  });
  const leftScore = rows.reduce((score, item) => score + (item.better === "izquierda" ? 1 : 0), 0);
  const rightScore = rows.reduce((score, item) => score + (item.better === "derecha" ? 1 : 0), 0);
  return { rows, preferred: leftScore === rightScore ? "equivalente" as const : leftScore > rightScore ? "izquierda" as const : "derecha" as const, physicalExecution: "disabled" as const };
}

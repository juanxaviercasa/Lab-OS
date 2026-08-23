export function buildSimulationTrajectory(first: Record<string, unknown>, second: Record<string, unknown>, metric: "humedad" | "energia" | "conductividad") {
  const firstProjected = (first.projected ?? {}) as Record<string, number>;
  const secondProjected = (second.projected ?? {}) as Record<string, number>;
  const interpolate = (target: number, ratio: number) => {
    const base = metric === "energia" ? target + 5 : target - 4;
    return Number((base + (target - base) * ratio).toFixed(2));
  };
  return Array.from({ length: 7 }, (_, index) => {
    const ratio = index / 6;
    return { step: index === 0 ? "Inicio" : `H+${index * 2}`, escenarioA: interpolate(Number(firstProjected[metric]), ratio), escenarioB: interpolate(Number(secondProjected[metric]), ratio) };
  });
}

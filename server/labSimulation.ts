export type SimulationScenario = "riego" | "luz" | "nutrientes" | "energia";

export type SimulationInput = {
  scenario: SimulationScenario;
  durationHours: number;
  targetZone: string;
  energyThresholdPct: number;
};

const labels: Record<SimulationScenario, string> = {
  riego: "Ventana de riego",
  luz: "Fotoperiodo controlado",
  nutrientes: "Ajuste de nutrientes",
  energia: "Presupuesto energético",
};

export function runSimulationProjection(input: SimulationInput) {
  const hours = Math.max(1, Math.min(input.durationHours, 72));
  const baseline = { humedad: 61, temperatura: 23.4, conductividad: 1.84, energia: 72 };
  const changes: Record<SimulationScenario, { humedad: number; temperatura: number; conductividad: number; energia: number }> = {
    riego: { humedad: Math.min(14, hours * 1.6), temperatura: -0.3, conductividad: -0.04, energia: -Math.min(9, hours * 0.35) },
    luz: { humedad: -Math.min(9, hours * 0.7), temperatura: Math.min(3.4, hours * 0.22), conductividad: 0, energia: -Math.min(18, hours * 0.9) },
    nutrientes: { humedad: 0, temperatura: 0.1, conductividad: Math.min(0.48, hours * 0.06), energia: -Math.min(6, hours * 0.22) },
    energia: { humedad: 0, temperatura: 0, conductividad: 0, energia: Math.min(11, hours * 0.65) },
  };
  const delta = changes[input.scenario];
  const projected = {
    humedad: Number((baseline.humedad + delta.humedad).toFixed(1)),
    temperatura: Number((baseline.temperatura + delta.temperatura).toFixed(1)),
    conductividad: Number((baseline.conductividad + delta.conductividad).toFixed(2)),
    energia: Number((baseline.energia + delta.energia).toFixed(1)),
  };
  const energySafe = projected.energia >= input.energyThresholdPct;
  const moistureSafe = projected.humedad >= 45 && projected.humedad <= 75;
  const conductivitySafe = projected.conductividad >= 1.2 && projected.conductividad <= 2.2;
  const outcome = energySafe && moistureSafe && conductivitySafe ? "estable" : "requiere_revision";

  const points = Array.from({ length: 7 }, (_, index) => {
    const ratio = index / 6;
    return {
      hour: Math.round(hours * ratio),
      humedad: Number((baseline.humedad + delta.humedad * ratio).toFixed(1)),
      temperatura: Number((baseline.temperatura + delta.temperatura * ratio).toFixed(1)),
      conductividad: Number((baseline.conductividad + delta.conductividad * ratio).toFixed(2)),
      energia: Number((baseline.energia + delta.energia * ratio).toFixed(1)),
    };
  });

  return {
    title: `${labels[input.scenario]} · ${input.targetZone}`,
    assumptions: [
      "Modelo determinista de referencia; no representa lecturas reales.",
      "No se emite ninguna orden a válvulas, luminarias o controladores.",
      `Horizonte evaluado: ${hours} horas.`,
    ],
    inputs: { ...input, baseline },
    result: {
      outcome,
      message: outcome === "estable" ? "La proyección permanece dentro de los umbrales de referencia." : "La proyección requiere revisión humana antes de preparar un plan.",
      projected,
      checks: { energySafe, moistureSafe, conductivitySafe },
      points,
      physicalExecution: "disabled",
    },
  };
}

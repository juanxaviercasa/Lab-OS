import { describe, expect, it } from "vitest";
import { blockedPhysicalNotification, planDecisionNotification } from "./labNotifications";
import { getDefaultRobotLearningModules } from "./robotLearning";
import { buildSimulationTrajectory } from "../shared/simulationTrajectory";

describe("notificaciones y aprendizaje robótico", () => {
  it("crea alertas auditables para bloqueos y decisiones humanas", () => {
    expect(blockedPhysicalNotification("Abrir válvula")).toMatchObject({ kind: "seguridad", severity: "critico", title: "Acción física bloqueada" });
    expect(planDecisionNotification("aprobar", "Plan de riego")).toMatchObject({ severity: "info", title: "Plan aprobado en simulación" });
    expect(planDecisionNotification("rechazar", "Plan de riego")).toMatchObject({ severity: "atencion", title: "Plan rechazado" });
  });

  it("define módulos educativos aislados y trayectorias comparativas deterministas", () => {
    const modules = getDefaultRobotLearningModules();
    expect(modules).toHaveLength(4);
    expect(modules.every((module) => module.safetyBoundary.length > 20)).toBe(true);
    const points = buildSimulationTrajectory({ projected: { humedad: 60 } }, { projected: { humedad: 70 } }, "humedad");
    expect(points).toHaveLength(7);
    expect(points[0]).toMatchObject({ escenarioA: 56, escenarioB: 66 });
    expect(points[6]).toMatchObject({ escenarioA: 60, escenarioB: 70 });
  });
});

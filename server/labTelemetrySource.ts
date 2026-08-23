export type NormalizedTelemetryPoint = { metric: string; value: number; unit: string; status: "normal" | "atencion" | "critico" };

const forbiddenHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

export function validatePublicTelemetryUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:") throw new Error("La fuente de telemetría debe usar HTTPS.");
  if (forbiddenHosts.has(host) || host.endsWith(".local") || /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
    throw new Error("No se permiten direcciones locales o privadas como fuentes de telemetría.");
  }
  return url.toString();
}

export function normalizeTelemetryPayload(payload: unknown): NormalizedTelemetryPoint[] {
  const root = payload as Record<string, unknown>;
  const candidates = Array.isArray(payload) ? payload : Array.isArray(root?.readings) ? root.readings : Array.isArray(root?.data) ? root.data : [];
  const rows = candidates.slice(0, 24).flatMap((item): NormalizedTelemetryPoint[] => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const metric = typeof row.metric === "string" ? row.metric.trim() : "";
    const value = Number(row.value);
    const unit = typeof row.unit === "string" ? row.unit.trim() : "";
    const status = row.status === "atencion" || row.status === "critico" ? row.status : "normal";
    return metric && unit && Number.isFinite(value) ? [{ metric, value, unit, status }] : [];
  });
  if (!rows.length) throw new Error("La respuesta debe contener 'readings' o una lista con metric, value y unit.");
  return rows;
}

export type TelemetryTimestamp = { recordedAt: Date };

export function selectTelemetryWindow<T extends TelemetryTimestamp>(rows: T[], periodHours: number, now = new Date()) {
  const cutoff = now.getTime() - periodHours * 60 * 60 * 1000;
  return rows.filter((row) => new Date(row.recordedAt).getTime() >= cutoff);
}

export function selectTelemetryMetric<T extends { metric: string }>(rows: T[], metric?: string) {
  return metric && metric !== "all" ? rows.filter((row) => row.metric === metric) : rows;
}

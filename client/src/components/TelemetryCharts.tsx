import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Activity, ChartNoAxesCombined, Droplets, Loader2, Thermometer, Waves, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const metrics = [
  { id: "Humedad del sustrato", label: "Humedad", unit: "%", color: "#22d3ee", icon: Droplets },
  { id: "Temperatura ambiente", label: "Temperatura", unit: "°C", color: "#a78bfa", icon: Thermometer },
  { id: "Conductividad del depósito", label: "Conductividad", unit: "mS/cm", color: "#fbbf24", icon: Waves },
  { id: "Reserva energética", label: "Energía", unit: "%", color: "#34d399", icon: Zap },
] as const;

function number(value: unknown) { return Number(value ?? 0); }

export function TelemetryCharts() {
  const [selected, setSelected] = useState<(typeof metrics)[number]["id"]>("Humedad del sustrato");
  const [periodHours, setPeriodHours] = useState<24 | 72 | 168>(24);
  const query = trpc.lab.telemetryHistory.useQuery({ metric: selected, periodHours });
  const active = metrics.find((metric) => metric.id === selected) ?? metrics[0];
  const data = useMemo(() => (query.data ?? []).map((row: any) => ({
    time: new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(row.recordedAt)),
    value: number(row.value),
    lower: row.thresholdLow === null ? undefined : number(row.thresholdLow),
    upper: row.thresholdHigh === null ? undefined : number(row.thresholdHigh),
  })), [query.data]);
  const latest = data.at(-1);

  return (
    <section className="rounded-2xl border border-cyan-200/10 bg-[#0a121d]/80 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Analítica de telemetría</p><h2 className="mt-1 font-display text-xl text-slate-100">Series históricas simuladas</h2><p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">Explora la evolución por métrica. Los datos se inicializan como referencia de simulación, no como lectura de campo.</p></div>
        <Badge variant="outline" className="border-cyan-300/20 bg-cyan-300/[0.05] text-[10px] uppercase tracking-[0.13em] text-cyan-200"><Activity className="mr-1.5 size-3" />Ventana: {periodHours} h</Badge>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">{metrics.map((metric) => { const Icon = metric.icon; const activeMetric = selected === metric.id; return <Button key={metric.id} type="button" variant={activeMetric ? "default" : "outline"} onClick={() => setSelected(metric.id)} className={activeMetric ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200" : "border-slate-700 bg-slate-950/20 text-slate-400 hover:bg-white/5 hover:text-slate-100"}><Icon className="mr-2 size-3.5" />{metric.label}</Button>; })}</div>
      <div className="mt-3 flex items-center gap-2"><span className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Periodo</span>{([24, 72, 168] as const).map((hours) => <Button key={hours} type="button" size="sm" variant="ghost" onClick={() => setPeriodHours(hours)} className={periodHours === hours ? "h-7 bg-cyan-300/[0.09] text-cyan-100 hover:bg-cyan-300/[0.14]" : "h-7 text-slate-500 hover:bg-white/5 hover:text-slate-200"}>{hours === 168 ? "7 días" : `${hours} h`}</Button>)}</div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_.5fr]">
        <div className="h-[330px] rounded-xl border border-white/5 bg-slate-950/30 p-3">
          {query.isLoading ? <div className="grid h-full place-items-center text-sm text-slate-500"><Loader2 className="mr-2 inline size-4 animate-spin text-cyan-300" />Cargando serie…</div> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ left: -14, right: 12, top: 14, bottom: 2 }}><defs><linearGradient id="telemetryGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={active.color} stopOpacity={0.38} /><stop offset="100%" stopColor={active.color} stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#1e3446" strokeDasharray="3 6" vertical={false} /><XAxis dataKey="time" stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} /><YAxis stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: "#07111b", border: "1px solid rgba(103,232,249,.2)", borderRadius: "10px", color: "#e2e8f0", fontSize: 12 }} labelStyle={{ color: "#94a3b8" }} formatter={(value: number) => [`${value} ${active.unit}`, active.label]} /><Area type="monotone" dataKey="value" stroke={active.color} strokeWidth={2.5} fill="url(#telemetryGradient)" dot={{ fill: active.color, stroke: "#07111b", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} /></AreaChart></ResponsiveContainer>}
        </div>
        <div className="space-y-3 rounded-xl border border-white/5 bg-slate-950/25 p-4"><div className="grid size-10 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-300/5 text-cyan-200"><ChartNoAxesCombined className="size-4" /></div><p className="mt-4 text-[10px] uppercase tracking-[0.15em] text-slate-500">Última referencia</p><p className="mt-1 font-display text-3xl text-slate-100">{latest ? `${latest.value} ${active.unit}` : "—"}</p><div className="border-t border-white/5 pt-3 text-xs leading-5 text-slate-500"><p>Rango de referencia</p><p className="mt-1 font-mono text-cyan-100">{latest?.lower ?? "—"} — {latest?.upper ?? "—"} {active.unit}</p></div><p className="rounded-lg border border-amber-300/15 bg-amber-300/[0.035] p-2.5 text-[11px] leading-4 text-amber-100">Las tendencias ayudan a revisar planes, pero no habilitan automatización física.</p></div>
      </div>
    </section>
  );
}

export function TelemetryOverviewChart({ readings }: { readings: any[] }) {
  const grouped = useMemo(() => {
    const byTime = new Map<string, Record<string, number | string>>();
    readings.forEach((reading) => {
      const time = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(reading.recordedAt));
      const row = byTime.get(time) ?? { time };
      if (reading.metric === "Humedad del sustrato") row.humedad = number(reading.value);
      if (reading.metric === "Temperatura ambiente") row.temperatura = number(reading.value);
      if (reading.metric === "Reserva energética") row.energia = number(reading.value);
      byTime.set(time, row);
    });
    return Array.from(byTime.values());
  }, [readings]);
  return <section className="rounded-2xl border border-cyan-200/10 bg-[#0a121d]/80 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Vista combinada</p><h2 className="mt-1 font-display text-xl text-slate-100">Trayectoria del último ciclo</h2></div><ChartNoAxesCombined className="size-5 text-cyan-300/70" /></div><div className="mt-5 h-[250px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={grouped} margin={{ left: -14, right: 8, top: 10 }}><CartesianGrid stroke="#1e3446" strokeDasharray="3 6" vertical={false} /><XAxis dataKey="time" stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} /><YAxis stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: "#07111b", border: "1px solid rgba(103,232,249,.2)", borderRadius: "10px", color: "#e2e8f0", fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} /><Line type="monotone" dataKey="humedad" name="Humedad %" stroke="#22d3ee" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="temperatura" name="Temperatura °C" stroke="#a78bfa" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="energia" name="Reserva %" stroke="#34d399" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></section>;
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { BatteryCharging, Droplets, FlaskConical, Leaf, Lightbulb, Loader2, ShieldCheck, Sparkles, Waves } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const scenarioMeta = {
  riego: { label: "Ventana de riego", detail: "Proyecta humedad, consumo energético y referencia de conductividad.", icon: Droplets, color: "text-cyan-200" },
  luz: { label: "Fotoperiodo controlado", detail: "Evalúa el impacto de una ventana de luz sobre temperatura, humedad y energía.", icon: Lightbulb, color: "text-violet-200" },
  nutrientes: { label: "Ajuste de nutrientes", detail: "Proyecta la conductividad del depósito dentro de los límites de referencia.", icon: Waves, color: "text-amber-100" },
  energia: { label: "Presupuesto energético", detail: "Simula una recuperación de reserva para priorizar cargas diferibles.", icon: BatteryCharging, color: "text-emerald-200" },
} as const;

function parse(value: string | null) { try { return value ? JSON.parse(value) : null; } catch { return null; } }

export function SimulationConsole({ zones, simulations }: { zones: any[]; simulations: any[] }) {
  const utils = trpc.useUtils();
  const [scenario, setScenario] = useState<keyof typeof scenarioMeta>("riego");
  const [durationHours, setDurationHours] = useState("8");
  const [targetZone, setTargetZone] = useState(zones[0]?.name ?? "Bancal Hidropónico A");
  const [latest, setLatest] = useState<any>(null);
  const mutation = trpc.lab.runSimulation.useMutation({
    onSuccess: (result) => { setLatest(result); toast.success("Proyección completada en entorno de simulación."); utils.lab.dashboard.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const metadata = scenarioMeta[scenario];
  const Icon = metadata.icon;
  const recent = simulations.slice(0, 4);

  return <div className="space-y-6">
    <div className="grid gap-6 xl:grid-cols-[.86fr_1.14fr]">
      <section className="rounded-2xl border border-cyan-200/10 bg-[#0a121d]/80 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Constructor de escenario</p><h2 className="mt-1 font-display text-xl text-slate-100">Proyección segura</h2><p className="mt-2 text-xs leading-5 text-slate-500">Calcula resultados deterministas a partir de referencias simuladas. La simulación no comunica con dispositivos físicos.</p>
        <form onSubmit={(event) => { event.preventDefault(); mutation.mutate({ scenario, durationHours: Number(durationHours), targetZone }); }} className="mt-6 space-y-4">
          <div><Label className="text-xs text-slate-400">Escenario</Label><Select value={scenario} onValueChange={(value) => setScenario(value as keyof typeof scenarioMeta)}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(scenarioMeta).map(([value, item]) => <SelectItem key={value} value={value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="rounded-xl border border-white/5 bg-slate-950/25 p-3"><div className="flex gap-3"><div className={cn("grid size-9 shrink-0 place-items-center rounded-lg border border-white/5 bg-white/[0.025]", metadata.color)}><Icon className="size-4" /></div><p className="text-xs leading-5 text-slate-500">{metadata.detail}</p></div></div>
          <div><Label className="text-xs text-slate-400">Zona objetivo</Label><Select value={targetZone} onValueChange={setTargetZone}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{zones.map((zone) => <SelectItem key={zone.id} value={zone.name}>{zone.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-xs text-slate-400">Horizonte de proyección (horas)</Label><Input type="number" min="1" max="72" value={durationHours} onChange={(event) => setDurationHours(event.target.value)} className="mt-2" /></div>
          <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-3"><p className="flex items-center gap-2 text-xs font-medium text-amber-100"><ShieldCheck className="size-3.5" />Entorno aislado</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Los resultados se guardarán como evidencia de simulación. Las órdenes físicas siguen bloqueadas.</p></div>
          <Button type="submit" disabled={mutation.isPending} className="w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200">{mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}Ejecutar proyección</Button>
        </form>
      </section>
      <SimulationResult result={latest} />
    </div>
    <section className="rounded-2xl border border-cyan-200/10 bg-[#0a121d]/80 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Historial de simulaciones</p><h2 className="mt-1 font-display text-xl text-slate-100">Evidencia reciente</h2></div><Badge variant="outline" className="border-cyan-300/20 bg-cyan-300/[0.05] text-[10px] uppercase tracking-[0.13em] text-cyan-200">{simulations.length} registros</Badge></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{recent.length ? recent.map((run) => { const result = parse(run.resultsJson); return <div key={run.id} className="rounded-xl border border-white/5 bg-slate-950/25 p-4"><div className="flex items-start justify-between gap-3"><span className="grid size-8 place-items-center rounded-lg border border-cyan-300/10 bg-cyan-300/5 text-cyan-200"><FlaskConical className="size-4" /></span><Badge variant="outline" className={result?.outcome === "estable" ? "border-emerald-300/20 text-[10px] text-emerald-100" : "border-amber-300/20 text-[10px] text-amber-100"}>{result?.outcome ?? run.status}</Badge></div><p className="mt-4 text-sm font-medium text-slate-200">{run.title}</p><p className="mt-1 text-xs text-slate-500">{run.durationHours} h · {run.targetZone}</p><p className="mt-3 text-[11px] leading-5 text-slate-500">{result?.message ?? "Resultado preservado como registro de simulación."}</p></div>; }) : <div className="col-span-full rounded-xl border border-dashed border-cyan-300/15 p-6 text-center text-sm text-slate-500">Aún no hay escenarios ejecutados. Crea una proyección para registrar la primera evidencia.</div>}</div></section>
  </div>;
}

function SimulationResult({ result }: { result: any }) {
  const chartData = useMemo(() => result?.result?.points ?? [], [result]);
  if (!result) return <section className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-[radial-gradient(circle_at_70%_30%,rgba(34,211,238,.10),transparent_34rem),#07111b] p-6"><div className="absolute inset-x-0 top-14 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" /><div className="relative grid h-full min-h-[360px] place-items-center"><div className="max-w-sm text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-200"><Leaf className="size-6" /></div><h2 className="mt-5 font-display text-2xl text-slate-100">Listo para proyectar</h2><p className="mt-3 text-sm leading-6 text-slate-500">Selecciona un escenario y ejecuta una proyección para revisar impactos, umbrales y curvas de tendencia en un entorno aislado.</p></div></div></section>;
  const projected = result.result.projected;
  return <section className="rounded-2xl border border-cyan-300/15 bg-[#07111b] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Resultado proyectado</p><h2 className="mt-1 font-display text-xl text-slate-100">{result.title}</h2></div><Badge variant="outline" className={result.result.outcome === "estable" ? "border-emerald-300/20 bg-emerald-300/5 text-emerald-100" : "border-amber-300/20 bg-amber-300/5 text-amber-100"}>{result.result.outcome.replaceAll("_", " ")}</Badge></div><p className="mt-3 text-xs leading-5 text-slate-500">{result.result.message}</p><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Humedad", projected.humedad, "%"], ["Temperatura", projected.temperatura, "°C"], ["Conductividad", projected.conductividad, "mS/cm"], ["Energía", projected.energia, "%"]].map(([label, value, unit]) => <div key={String(label)} className="rounded-xl border border-white/5 bg-slate-950/30 p-3"><p className="text-[10px] uppercase tracking-[0.13em] text-slate-600">{label}</p><p className="mt-1 font-mono text-sm text-cyan-100">{value} {unit}</p></div>)}</div><div className="mt-5 h-[210px] rounded-xl border border-white/5 bg-slate-950/25 p-3"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ left: -14, right: 8, top: 8 }}><defs><linearGradient id="projectionGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} /><stop offset="100%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#1e3446" strokeDasharray="3 6" vertical={false} /><XAxis dataKey="hour" stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} unit="h" /><YAxis stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: "#07111b", border: "1px solid rgba(103,232,249,.2)", borderRadius: "10px", color: "#e2e8f0", fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} /><Area type="monotone" dataKey="humedad" name="Humedad %" stroke="#22d3ee" fill="url(#projectionGradient)" strokeWidth={2} /><Area type="monotone" dataKey="energia" name="Energía %" stroke="#34d399" fill="none" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></section>;
}

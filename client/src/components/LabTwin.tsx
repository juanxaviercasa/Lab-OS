import { cn } from "@/lib/utils";
import { BatteryCharging, CircleDotDashed, Droplets, Leaf, Lightbulb, ScanEye } from "lucide-react";

type Zone = { id: number; name: string; code: string; type: string; status: "normal" | "atencion" | "en_pausa"; description: string | null };
type Device = { id: number; name: string; type: string; connectivity: string; riskLevel: string; enabled: boolean };

const zoneIcon = { cultivo: Leaf, germinacion: Lightbulb, agua: Droplets, energia: BatteryCharging, cuarentena: ScanEye } as const;

export function LabTwin({ zones, devices, focus = false }: { zones: Zone[]; devices: Device[]; focus?: boolean }) {
  return (
    <section className={cn("twin-shell overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#07111b]/90", focus && "min-h-[510px]")}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-100/10 px-5 py-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Gemelo digital · nivel 01</p><h3 className="mt-1 font-display text-lg text-slate-100">Estación de cultivo simulada</h3></div>
        <div className="flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-1.5 text-[11px] text-cyan-200"><CircleDotDashed className="size-3.5" /> Entorno aislado</div>
      </div>
      <div className="relative min-h-[330px] overflow-hidden p-5 sm:p-7">
        <div className="twin-orbit twin-orbit-a" /><div className="twin-orbit twin-orbit-b" /><div className="twin-glow" />
        <div className="relative grid gap-3 sm:grid-cols-3">
          {zones.map((zone, index) => {
            const Icon = zoneIcon[zone.type as keyof typeof zoneIcon] ?? CircleDotDashed;
            const zoneDevices = devices.filter((device) => index === 0 ? device.type !== "camara" : device.type === "camara");
            return (
              <div key={zone.id} className={cn("twin-zone", zone.status === "atencion" && "twin-zone-attention", zone.status === "en_pausa" && "twin-zone-paused")}>
                <div className="flex items-start justify-between"><span className="grid size-9 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Icon className="size-4" /></span><span className={cn("size-2.5 rounded-full", zone.status === "normal" ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]" : "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.75)]")} /></div>
                <p className="mt-7 text-[10px] font-semibold tracking-[0.18em] text-slate-500">{zone.code}</p><p className="mt-1 text-sm font-medium text-slate-100">{zone.name}</p><p className="mt-2 text-xs leading-5 text-slate-500">{zone.description ?? "Zona simulada"}</p>
                <p className="mt-5 border-t border-white/5 pt-3 text-[10px] uppercase tracking-[0.13em] text-cyan-300/75">{zoneDevices.length || 1} nodo{zoneDevices.length === 1 ? "" : "s"} visible{zoneDevices.length === 1 ? "" : "s"}</p>
              </div>
            );
          })}
        </div>
        <div className="relative mt-6 grid gap-2 rounded-xl border border-white/5 bg-slate-950/35 p-3 sm:grid-cols-3">
          <TwinLabel label="Sensores" value={`${devices.filter((item) => item.type === "sensor").length || 1} simulados`} /><TwinLabel label="Actuadores" value="bloqueados" warning /><TwinLabel label="Adaptadores" value="preparados" />
        </div>
      </div>
    </section>
  );
}

function TwinLabel({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return <div className="flex items-center justify-between px-2 py-1"><span className="text-[10px] uppercase tracking-[0.16em] text-slate-600">{label}</span><span className={cn("text-xs", warning ? "text-amber-200" : "text-cyan-200")}>{value}</span></div>;
}

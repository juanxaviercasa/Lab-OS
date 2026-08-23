import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { NotificationsCenter } from "@/components/NotificationsCenter";
import { trpc } from "@/lib/trpc";
import {
  Accessibility,
  Activity,
  Atom,
  Bot,
  Boxes,
  ClipboardCheck,
  ChartNoAxesCombined,
  CookingPot,
  Radio,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Network,
  Settings2,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Centro de mando", path: "/" },
  { icon: Boxes, label: "Gemelo digital", path: "/gemelo" },
  { icon: ClipboardCheck, label: "Operaciones", path: "/operaciones" },
  { icon: ChartNoAxesCombined, label: "Simulación", path: "/simulacion" },
  { icon: Radio, label: "Telemetría", path: "/telemetria" },
  { icon: FlaskConical, label: "Experimentos", path: "/experimentos" },
  { icon: Boxes, label: "Proyectos", path: "/proyectos" },
  { icon: Atom, label: "Cerebro robótico", path: "/cerebro-robotico" },
  { icon: Sprout, label: "Cultivo autónomo", path: "/cultivo" },
  { icon: CookingPot, label: "Cocina automatizada", path: "/cocina" },
  { icon: Accessibility, label: "Tecnología asistiva", path: "/asistencia" },
  { icon: Bot, label: "Autómata de limpieza", path: "/limpieza" },
  { icon: Network, label: "Adaptadores", path: "/adaptadores" },
  { icon: Settings2, label: "Configuración", path: "/configuracion" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#060a10] px-5 text-slate-100 lab-grid">
        <div className="max-w-md rounded-3xl border border-cyan-300/15 bg-slate-950/80 p-8 text-center shadow-2xl shadow-cyan-950/30 backdrop-blur">
          <div className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
            <Atom className="size-7" />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">LabOS · acceso controlado</p>
          <h1 className="text-2xl font-semibold tracking-tight">Inicia sesión para abrir el centro de mando</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">La simulación, los registros y los placeholders de integración son privados para tu laboratorio.</p>
          <Button onClick={() => startLogin()} className="mt-7 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200">Abrir LabOS</Button>
        </div>
      </div>
    );
  }

  return <SidebarProvider><DashboardContent>{children}</DashboardContent></SidebarProvider>;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const notifications = trpc.lab.dashboard.useQuery(undefined, { refetchInterval: 45000 });
  const active = menuItems.find((item) => item.path === location) ?? menuItems[0];

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-cyan-200/10 bg-[#08111b] text-slate-300">
        <SidebarHeader className="h-[84px] justify-center border-b border-cyan-100/10 px-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border border-cyan-300/35 bg-cyan-300/10 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.13)]">
              <Atom className="size-5" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="font-display text-base font-semibold tracking-[0.13em] text-slate-100">LABOS</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-cyan-300/75">Cultivo seguro</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 group-data-[collapsible=icon]:hidden">Navegación</p>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={active.path === item.path}
                  onClick={() => setLocation(item.path)}
                  tooltip={item.label}
                  className="h-10 rounded-lg text-slate-400 transition-colors hover:bg-cyan-300/8 hover:text-cyan-100 data-[active=true]:bg-cyan-300/12 data-[active=true]:text-cyan-100"
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="mx-2 mt-7 rounded-xl border border-amber-300/15 bg-amber-300/[0.045] p-3 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 text-amber-200"><ShieldCheck className="size-4" /><span className="text-xs font-medium">Modo protegido</span></div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Los adaptadores están aislados. No existe control físico directo.</p>
          </div>
        </SidebarContent>
        <SidebarFooter className="border-t border-cyan-100/10 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 group-data-[collapsible=icon]:justify-center">
                <Avatar className="size-8 border border-cyan-200/20"><AvatarFallback className="bg-cyan-300/10 text-xs text-cyan-100">{user?.name?.charAt(0).toUpperCase() ?? "L"}</AvatarFallback></Avatar>
                <div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-medium text-slate-200">{user?.name ?? "Operador"}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">Control autorizado</p></div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-slate-700 bg-slate-950 text-slate-100">
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-rose-300 focus:text-rose-200"><LogOut className="mr-2 size-4" />Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-h-screen bg-[#060a10] text-slate-100 lab-grid">
        <header className="sticky top-0 z-20 flex h-[84px] items-center justify-between border-b border-cyan-100/10 bg-[#060a10]/80 px-5 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3"><SidebarTrigger className="text-slate-300 hover:bg-white/5 hover:text-cyan-200" /><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">LabOS / {active.label}</p><h2 className="font-display text-lg font-medium text-slate-100">Centro de supervisión</h2></div></div>
          <div className="flex items-center gap-2"><NotificationsCenter notifications={notifications.data?.notifications} /><Badge variant="outline" className="hidden border-cyan-300/20 bg-cyan-300/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-cyan-200 sm:flex"><Activity className="mr-1.5 size-3" />Telemetría simulada</Badge><Badge variant="outline" className="border-amber-300/20 bg-amber-300/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-amber-200">Sin control físico</Badge></div>
        </header>
        <main className="mx-auto w-full max-w-[1640px] flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </SidebarInset>
    </>
  );
}

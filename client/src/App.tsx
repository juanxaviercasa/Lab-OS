import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/gemelo" component={Home} /><Route path="/operaciones" component={Home} /><Route path="/simulacion" component={Home} /><Route path="/telemetria" component={Home} /><Route path="/experimentos" component={Home} /><Route path="/proyectos" component={Home} /><Route path="/cerebro-robotico" component={Home} /><Route path="/adaptadores" component={Home} /><Route path="/configuracion" component={Home} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster richColors theme="dark" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

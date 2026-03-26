import { Calendar, Users, LayoutDashboard, Clock, Settings, LogOut, ListOrdered, ShieldAlert } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAppointments } from "@/hooks/use-data";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/appointments", icon: Calendar, label: "Citas" },
  { to: "/waiting-list", icon: ListOrdered, label: "Lista de Espera" },
  { to: "/patients", icon: Users, label: "Pacientes" },
  { to: "/schedule", icon: Clock, label: "Horarios" },
  { to: "/settings", icon: Settings, label: "Configuración" },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();
  const { data: allAppointments = [] } = useAppointments();

  const waitingCount = allAppointments.filter(
    a => (a as any).source === "public" && a.status === "pending"
  ).length;

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card min-h-screen">
      <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              S
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-bold text-foreground">SmileFlow</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Gestión de citas</span>
            </div>
          </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          const isWaiting = to === "/waiting-list";
          return (
            <NavLink key={to} to={to} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}>
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">{label}</span>
              {isWaiting && waitingCount > 0 && (
                <span className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-warning/20 text-warning"
                )}>
                  {waitingCount}
                </span>
              )}
            </NavLink>
          );
        })}
        {isAdmin && (
          <NavLink to="/admin" className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
            location.pathname === "/admin" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}>
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="flex-1">Admin Empresas</span>
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-semibold text-muted-foreground">{user?.email?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={signOut} className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

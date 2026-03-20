import { Calendar, Users, LayoutDashboard, ListOrdered, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppointments } from "@/hooks/use-data";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Inicio" },
  { to: "/appointments", icon: Calendar, label: "Citas" },
  { to: "/waiting-list", icon: ListOrdered, label: "Espera" },
  { to: "/patients", icon: Users, label: "Pacientes" },
  { to: "/settings", icon: Settings, label: "Ajustes" },
];

export function MobileNav() {
  const location = useLocation();
  const { data: allAppointments = [] } = useAppointments();

  const waitingCount = allAppointments.filter(
    a => (a as any).source === "public" && a.status === "pending"
  ).length;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
      <div className="flex justify-around px-2 py-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          const isWaiting = to === "/waiting-list";
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-2 py-2 min-w-0 flex-1 relative"
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-8 rounded-full transition-colors relative",
                isActive ? "bg-primary/10" : ""
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                {isWaiting && waitingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {waitingCount > 9 ? "9+" : waitingCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors truncate",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

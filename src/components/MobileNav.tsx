import { Calendar, Users, LayoutDashboard, Clock, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Inicio" },
  { to: "/appointments", icon: Calendar, label: "Citas" },
  { to: "/patients", icon: Users, label: "Pacientes" },
  { to: "/schedule", icon: Clock, label: "Horarios" },
  { to: "/settings", icon: Settings, label: "Ajustes" },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
      <div className="flex justify-around px-2 py-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-2 py-2 min-w-0 flex-1"
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-8 rounded-full transition-colors",
                isActive ? "bg-primary/10" : ""
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
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

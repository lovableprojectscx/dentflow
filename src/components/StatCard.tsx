import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn("bg-card rounded-xl border border-border p-4 animate-fade-in", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-secondary-foreground" />
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, parseISO, isToday,
  addWeeks, subWeeks, startOfDay
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-500",
  pending: "bg-amber-400",
  cancelled: "bg-red-400",
  completed: "bg-slate-400",
};

const STATUS_BG: Record<string, string> = {
  confirmed: "bg-emerald-50 border-emerald-200 text-emerald-800",
  pending: "bg-amber-50 border-amber-200 text-amber-800",
  cancelled: "bg-red-50 border-red-200 text-red-800",
  completed: "bg-slate-100 border-slate-200 text-slate-600",
};

type ViewMode = "month" | "week";

interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  patients?: { name?: string; phone?: string } | null;
  source?: string;
  notes?: string | null;
}

interface Props {
  appointments: Appointment[];
  onNewAppointment?: () => void;
}

export function AppointmentCalendar({ appointments, onNewAppointment }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const byDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const apt of appointments) {
      if (!map[apt.date]) map[apt.date] = [];
      map[apt.date].push(apt);
    }
    return map;
  }, [appointments]);

  const selectedDayStr = selectedDay ? format(selectedDay, "yyyy-MM-dd") : "";
  const selectedAppointments = (byDate[selectedDayStr] ?? []).sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  /* --- Month grid --- */
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    const days: Date[] = [];
    let d = start;
    while (d <= end) { days.push(d); d = addDays(d, 1); }
    return days;
  }, [currentDate]);

  /* --- Week grid --- */
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const displayDays = view === "month" ? monthDays : weekDays;

  const navigate = (dir: 1 | -1) => {
    if (view === "month") setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const headerLabel = view === "month"
    ? format(currentDate, "MMMM yyyy", { locale: es })
    : `${format(weekDays[0], "d MMM", { locale: es })} – ${format(weekDays[6], "d MMM yyyy", { locale: es })}`;

  const WEEK_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="flex gap-4 h-full min-h-[600px]">
      {/* ── Calendar Panel ── */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <h2 className="text-sm font-semibold text-foreground capitalize min-w-[160px] text-center">{headerLabel}</h2>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()); }}
              className="text-xs px-3 py-1 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
            >
              Hoy
            </button>
            <div className="flex rounded-lg border border-border overflow-hidden text-xs">
              {(["month", "week"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn("px-3 py-1 transition-colors", view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}
                >
                  {v === "month" ? "Mes" : "Semana"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEK_LABELS.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className={cn("flex-1 grid grid-cols-7", view === "month" ? "auto-rows-fr" : "grid-rows-1")}>
          {displayDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const apts = byDate[key] ?? [];
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const isCurrentMonth = view === "week" || isSameMonth(day, currentDate);
            const today = isToday(day);

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "relative flex flex-col p-1.5 border-b border-r border-border transition-colors text-left min-h-[80px]",
                  "hover:bg-muted/50",
                  isSelected && "bg-primary/5 ring-inset ring-1 ring-primary/30",
                  !isCurrentMonth && "opacity-40",
                )}
              >
                <span className={cn(
                  "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1",
                  today ? "bg-primary text-primary-foreground" : "text-foreground",
                )}>
                  {format(day, "d")}
                </span>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {apts.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className={cn("text-[10px] px-1.5 py-0.5 rounded truncate border font-medium", STATUS_BG[apt.status] ?? STATUS_BG.pending)}
                    >
                      {apt.time.slice(0, 5)} {(apt as any).patients?.name ?? apt.type}
                    </div>
                  ))}
                  {apts.length > 3 && (
                    <span className="text-[10px] text-muted-foreground pl-1">+{apts.length - 3} más</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      <div className="w-72 shrink-0 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground capitalize">
              {selectedDay ? format(selectedDay, "EEEE", { locale: es }) : "Selecciona un día"}
            </p>
            <p className="text-lg font-bold text-foreground leading-tight">
              {selectedDay ? format(selectedDay, "d 'de' MMMM", { locale: es }) : ""}
            </p>
          </div>
          {onNewAppointment && (
            <button onClick={onNewAppointment} className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {selectedAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <span className="text-lg">📅</span>
              </div>
              <p className="text-sm text-muted-foreground">Sin citas este día</p>
            </div>
          ) : (
            selectedAppointments.map((apt) => {
              const name = (apt as any).patients?.name ?? "Paciente";
              const dot = STATUS_COLORS[apt.status] ?? "bg-gray-400";
              return (
                <div key={apt.id} className="bg-background border border-border rounded-xl p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", dot)} />
                    <span className="text-xs font-bold text-foreground tabular-nums">{apt.time.slice(0, 5)}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{apt.duration}min</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                  <p className="text-xs text-muted-foreground truncate">{apt.type}</p>
                  {apt.source === "public" && apt.status === "pending" && (
                    <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">Solicitud online</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-border">
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { key: "confirmed", label: "Confirmada" },
              { key: "pending", label: "Pendiente" },
              { key: "completed", label: "Completada" },
              { key: "cancelled", label: "Cancelada" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", STATUS_COLORS[key])} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo, useRef } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
  addWeeks, subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Constants ────────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-500",
  pending:   "bg-amber-400",
  cancelled: "bg-red-400",
  completed: "bg-slate-400",
};

const STATUS_BG: Record<string, string> = {
  confirmed: "bg-emerald-50 border-emerald-200 text-emerald-800",
  pending:   "bg-amber-50 border-amber-200 text-amber-800",
  cancelled: "bg-red-50 border-red-200 text-red-800",
  completed: "bg-slate-100 border-slate-200 text-slate-600",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmada",
  pending:   "Pendiente",
  cancelled: "Cancelada",
  completed: "Completada",
};

const WEEK_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

/* ─── Types ──────────────────────────────────────────────── */
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
}

/* ─── Helper ─────────────────────────────────────────────── */
function useByDate(appointments: Appointment[]) {
  return useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const a of appointments) {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    }
    return map;
  }, [appointments]);
}

/* ═══════════════════════════════════════════════════════════
   MOBILE VIEW — Week strip + agenda list
   ═══════════════════════════════════════════════════════════ */
function MobileCalendar({ appointments }: Props) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(today, { weekStartsOn: 1 })
  );
  const [selected, setSelected] = useState<Date>(today);
  const byDate = useByDate(appointments);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const selectedStr = format(selected, "yyyy-MM-dd");
  const dayApts = (byDate[selectedStr] ?? []).sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  const monthLabel = format(selected, "MMMM yyyy", { locale: es });

  return (
    <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* ── Month header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={() => {
            const prev = subWeeks(weekStart, 1);
            setWeekStart(prev);
            setSelected(prev);
          }}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h2 className="text-sm font-semibold capitalize text-foreground">{monthLabel}</h2>
        <button
          onClick={() => {
            const next = addWeeks(weekStart, 1);
            setWeekStart(next);
            setSelected(next);
          }}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* ── Week strip ── */}
      <div className="grid grid-cols-7 px-2 py-2 gap-1">
        {weekDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const count = byDate[key]?.length ?? 0;
          const isSelected = isSameDay(day, selected);
          const today_ = isToday(day);

          return (
            <button
              key={key}
              onClick={() => setSelected(day)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted"
              )}
            >
              <span className={cn(
                "text-[10px] font-medium",
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {WEEK_SHORT[(day.getDay() + 6) % 7]}
              </span>
              <span className={cn(
                "text-sm font-bold leading-none",
                today_ && !isSelected ? "text-primary" : ""
              )}>
                {format(day, "d")}
              </span>
              {count > 0 && (
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isSelected ? "bg-primary-foreground/70" : "bg-primary"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Selected day label ── */}
      <div className="px-4 py-2 border-t border-border bg-muted/30">
        <p className="text-xs font-semibold text-foreground capitalize">
          {format(selected, "EEEE, d 'de' MMMM", { locale: es })}
          <span className="ml-2 text-muted-foreground font-normal">
            {dayApts.length} cita{dayApts.length !== 1 ? "s" : ""}
          </span>
        </p>
      </div>

      {/* ── Agenda ── */}
      <div className="divide-y divide-border">
        {dayApts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <CalendarDays className="w-8 h-8 opacity-30" />
            <p className="text-sm">Sin citas este día</p>
          </div>
        ) : (
          dayApts.map((apt) => {
            const name = (apt as any).patients?.name ?? "Paciente";
            const dot = STATUS_COLORS[apt.status] ?? "bg-gray-400";
            const label = STATUS_LABEL[apt.status] ?? apt.status;
            return (
              <div key={apt.id} className="px-4 py-3 flex items-start gap-3">
                {/* Time column */}
                <div className="shrink-0 w-12 text-center pt-0.5">
                  <p className="text-xs font-bold text-foreground tabular-nums">{apt.time.slice(0, 5)}</p>
                  <p className="text-[10px] text-muted-foreground">{apt.duration}m</p>
                </div>
                {/* Color bar */}
                <span className={cn("w-1 self-stretch rounded-full shrink-0 mt-0.5", dot)} />
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                    <span className={cn(
                      "ml-auto shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium border",
                      STATUS_BG[apt.status] ?? STATUS_BG.pending
                    )}>
                      {label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{apt.type}</p>
                  {apt.source === "public" && apt.status === "pending" && (
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                      Solicitud online
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Legend ── */}
      <div className="border-t border-border px-4 py-2 flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1">
            <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_COLORS[key])} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DESKTOP VIEW — Full month grid + side panel
   ═══════════════════════════════════════════════════════════ */
function DesktopCalendar({ appointments }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<Date>(new Date());
  const byDate = useByDate(appointments);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    const days: Date[] = [];
    let d = start;
    while (d <= end) { days.push(d); d = addDays(d, 1); }
    return days;
  }, [currentDate]);

  const selectedStr = format(selected, "yyyy-MM-dd");
  const dayApts = (byDate[selectedStr] ?? []).sort((a, b) => a.time.localeCompare(b.time));
  const headerLabel = format(currentDate, "MMMM yyyy", { locale: es });

  return (
    <div className="flex gap-4 min-h-[580px]">
      {/* Grid panel */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <h2 className="text-sm font-semibold text-foreground capitalize w-40 text-center">{headerLabel}</h2>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <button
            onClick={() => { setCurrentDate(new Date()); setSelected(new Date()); }}
            className="text-xs px-3 py-1 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
          >
            Hoy
          </button>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{d}</div>
          ))}
        </div>
        {/* Cells */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {monthDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const apts = byDate[key] ?? [];
            const isSelected = isSameDay(day, selected);
            const inMonth = isSameMonth(day, currentDate);
            const todayD = isToday(day);

            return (
              <button
                key={key}
                onClick={() => setSelected(day)}
                className={cn(
                  "flex flex-col p-1.5 border-b border-r border-border text-left transition-colors min-h-[80px]",
                  "hover:bg-muted/40",
                  isSelected && "bg-primary/5 ring-inset ring-1 ring-primary/30",
                  !inMonth && "opacity-40"
                )}
              >
                <span className={cn(
                  "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1",
                  todayD ? "bg-primary text-primary-foreground" : "text-foreground"
                )}>
                  {format(day, "d")}
                </span>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {apts.slice(0, 3).map((apt) => (
                    <div key={apt.id}
                      className={cn("text-[10px] px-1.5 py-0.5 rounded truncate border font-medium", STATUS_BG[apt.status] ?? STATUS_BG.pending)}>
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

      {/* Side panel */}
      <div className="w-64 shrink-0 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-4 border-b border-border">
          <p className="text-xs text-muted-foreground capitalize">
            {format(selected, "EEEE", { locale: es })}
          </p>
          <p className="text-lg font-bold text-foreground leading-tight">
            {format(selected, "d 'de' MMMM", { locale: es })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dayApts.length} cita{dayApts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {dayApts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <CalendarDays className="w-7 h-7 opacity-30" />
              <p className="text-sm">Sin citas</p>
            </div>
          ) : (
            dayApts.map((apt) => {
              const name = (apt as any).patients?.name ?? "Paciente";
              return (
                <div key={apt.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_COLORS[apt.status] ?? "bg-gray-400")} />
                    <span className="text-xs font-bold tabular-nums">{apt.time.slice(0, 5)}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{apt.duration}min</span>
                  </div>
                  <p className="text-sm font-semibold truncate">{name}</p>
                  <p className="text-xs text-muted-foreground truncate">{apt.type}</p>
                </div>
              );
            })
          )}
        </div>
        <div className="border-t border-border px-4 py-3">
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
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

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT — renders right component based on screen size
   ═══════════════════════════════════════════════════════════ */
export function AppointmentCalendar({ appointments }: Props) {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileCalendar appointments={appointments} />
      </div>
      {/* Desktop */}
      <div className="hidden md:block">
        <DesktopCalendar appointments={appointments} />
      </div>
    </>
  );
}

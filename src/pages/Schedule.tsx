import { useState } from "react";
import { useAppointments, useClinicSettings } from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle, XCircle } from "lucide-react";

function generateTimeSlots(openTime: string, closeTime: string) {
  const slots: string[] = [];
  const [openH] = openTime.split(":").map(Number);
  const [closeH] = closeTime.split(":").map(Number);
  for (let h = openH; h < closeH; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

export default function Schedule() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: appointments = [] } = useAppointments(selectedDate);
  const { data: settings } = useClinicSettings();

  const openTime = settings?.opening_time ?? "08:00";
  const closeTime = settings?.closing_time ?? "18:00";
  const allSlots = generateTimeSlots(openTime, closeTime);

  const activeAppointments = appointments.filter(a => a.status !== "cancelled");

  function toMinutes(t: string) {
    const [h, m] = t.slice(0, 5).split(":").map(Number);
    return h * 60 + m;
  }

  function isSlotOccupied(slot: string): boolean {
    const slotMin = toMinutes(slot);
    return activeAppointments.some(a => {
      const start = toMinutes(a.time);
      const end = start + (a.duration ?? 30);
      return slotMin >= start && slotMin < end;
    });
  }

  const available = allSlots.filter(s => !isSlotOccupied(s)).length;
  const booked = allSlots.filter(s => isSlotOccupied(s)).length;

  // Check if selected day is a working day
  const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay();
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const isWorkingDay = settings?.working_days?.[adjustedDay] ?? true;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Horarios</h1>
        <p className="text-sm text-muted-foreground mt-1">Vista de disponibilidad del día</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="space-y-2">
          <Label>Seleccionar fecha</Label>
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-48" />
        </div>
        {isWorkingDay && (
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-success" /> {available} disponibles
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <XCircle className="w-4 h-4 text-destructive" /> {booked} ocupados
            </span>
          </div>
        )}
      </div>

      {!isWorkingDay ? (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">Día no laborable</p>
          <p className="text-sm mt-1">La clínica no atiende este día según tu configuración</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {allSlots.map(slot => {
            const isBooked = isSlotOccupied(slot);
            return (
              <div key={slot} className={cn(
                "flex items-center gap-2 p-3 rounded-lg border transition-all",
                isBooked ? "border-border bg-muted/50 opacity-60" : "border-success/30 bg-success/5"
              )}>
                <Clock className={cn("w-4 h-4 shrink-0", isBooked ? "text-muted-foreground" : "text-success")} />
                <span className={cn("font-medium text-sm tabular-nums", isBooked ? "text-muted-foreground" : "text-foreground")}>{slot}</span>
                {isBooked && <span className="text-xs text-muted-foreground ml-auto">Ocupado</span>}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-1">Horario configurado</h3>
        <p className="text-sm text-muted-foreground">
          Atención de <span className="font-medium text-foreground">{openTime.slice(0,5)}</span> a <span className="font-medium text-foreground">{closeTime.slice(0,5)}</span> · Puedes modificarlo en <span className="font-medium text-foreground">Configuración</span>
        </p>
      </div>
    </div>
  );
}

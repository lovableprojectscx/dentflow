import { useState } from "react";
import { useAppointments } from "@/hooks/use-data";
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

  const allSlots = generateTimeSlots("08:00", "18:00");
  const bookedTimes = new Set(appointments.filter(a => a.status !== "cancelled").map(a => a.time.slice(0, 5)));

  const available = allSlots.filter(s => !bookedTimes.has(s)).length;
  const booked = allSlots.filter(s => bookedTimes.has(s)).length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Horarios Disponibles</h1>
        <p className="text-sm text-muted-foreground mt-1">Vista de disponibilidad para tu landing page</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="space-y-2">
          <Label>Seleccionar fecha</Label>
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-48" />
        </div>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-success" /> {available} disponibles
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <XCircle className="w-4 h-4 text-destructive" /> {booked} ocupados
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {allSlots.map(slot => {
          const isBooked = bookedTimes.has(slot);
          return (
            <div key={slot} className={cn(
              "flex items-center gap-2 p-3 rounded-lg border transition-all cursor-default",
              isBooked ? "border-border bg-muted/50 opacity-60" : "border-success/30 bg-success/5 hover:bg-success/10"
            )}>
              <Clock className={cn("w-4 h-4", isBooked ? "text-muted-foreground" : "text-success")} />
              <span className={cn("font-medium text-sm", isBooked ? "text-muted-foreground" : "text-foreground")}>{slot}</span>
              {isBooked && <span className="text-xs text-muted-foreground ml-auto">Ocupado</span>}
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mt-8">
        <h3 className="font-semibold text-foreground mb-2">🔗 Integración con Landing Page</h3>
        <p className="text-sm text-muted-foreground">
          Los horarios disponibles se sincronizan automáticamente con tu página web. Tus pacientes ven en tiempo real qué horarios están libres.
        </p>
      </div>
    </div>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpcomingAppointments } from "@/hooks/use-data";
import { Calendar, Clock, MessageCircle, AlertCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewAppointmentDialog } from "./NewAppointmentDialog";
import { useState } from "react";

interface FollowUpAlertProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
}

export function FollowUpAlert({ open, onClose, patientId, patientName, patientPhone }: FollowUpAlertProps) {
  const { data: upcoming = [], isLoading } = useUpcomingAppointments(patientId);
  const [newAptOpen, setNewAptOpen] = useState(false);

  const handleWhatsApp = () => {
    if (!patientPhone) return;
    const cleanPhone = patientPhone.replace(/[\s\-\(\)]/g, "");
    
    let message = `¡Hola ${patientName}! 👋\n\nLe escribimos de la clínica para confirmar que su tratamiento de hoy ha finalizado con éxito.`;
    
    if (upcoming.length > 0) {
      const next = upcoming[0];
      const dateText = new Date(next.date + "T12:00:00").toLocaleDateString("es-ES", { 
        weekday: "long", day: "numeric", month: "long" 
      });
      message += `\n\nLe recordamos que su próxima cita es el *${dateText}* a las *${next.time.slice(0, 5)}*. ¡Le esperamos!`;
    } else {
      message += `\n\n¿Desea agendar su próxima revisión? Por favor avísenos qué día le vendría bien. 🦷`;
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <DialogTitle>¡Cita completada!</DialogTitle>
            <DialogDescription>
              ¿Deseas realizar un seguimiento a {patientName}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {isLoading ? (
              <div className="h-20 bg-muted animate-pulse rounded-lg" />
            ) : upcoming.length > 0 ? (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Calendar className="w-4 h-4" />
                  Cita próxima programada
                </div>
                {upcoming.slice(0, 2).map(apt => (
                  <div key={apt.id} className="text-xs text-muted-foreground flex items-center gap-3">
                    <span className="font-bold tabular-nums">{apt.time.slice(0, 5)}</span>
                    <span>{new Date(apt.date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                    <span className="truncate flex-1">· {apt.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-warning font-semibold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Sin citas próximas
                </div>
                <p className="text-xs text-muted-foreground">
                  El paciente no tiene más citas agendadas. Es un buen momento para programar la siguiente.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2 h-8 gap-1.5 text-xs text-warning border-warning/30 hover:bg-warning/10"
                  onClick={() => setNewAptOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agendar revisión
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">
              Cerrar
            </Button>
            {patientPhone && (
              <Button onClick={handleWhatsApp} className="flex-1 sm:flex-none gap-2 bg-success hover:bg-success/90">
                <MessageCircle className="w-4 h-4" />
                Mensaje Seguimiento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewAppointmentDialog 
        open={newAptOpen} 
        onOpenChange={setNewAptOpen} 
        initialPatientId={patientId}
        initialPatientName={patientName}
      />
    </>
  );
}

const CheckCircle = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
